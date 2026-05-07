#!/usr/bin/env python3
# =============================================================================
# ArthSathi (अर्थसाथी) — QLoRA Fine-Tuning Script for Qwen3-4B
# =============================================================================
# Fine-tunes Qwen3-4B on Indian finance instruction data using QLoRA (4-bit
# quantization + LoRA adapters) with HuggingFace TRL's SFTTrainer.
#
# Usage:
#   python finetune.py --config config.yaml
#   python finetune.py --config config.yaml --epochs 5 --lr 3e-4
# =============================================================================

import argparse
import json
import logging
import os
import sys
from typing import Any, Dict, Optional

import yaml

# ---------------------------------------------------------------------------
# Logging setup
# ---------------------------------------------------------------------------
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(message)s",
    datefmt="%Y-%m-%d %H:%M:%S",
)
logger = logging.getLogger(__name__)


# =============================================================================
# Configuration Loading
# =============================================================================

def load_config(config_path: str) -> Dict[str, Any]:
    """Load and validate the YAML configuration file."""
    if not os.path.exists(config_path):
        raise FileNotFoundError(f"Configuration file not found: {config_path}")

    with open(config_path, "r", encoding="utf-8") as f:
        config = yaml.safe_load(f)

    logger.info(f"Configuration loaded from {config_path}")
    return config


# =============================================================================
# Data Formatting for SFTTrainer
# =============================================================================

def format_to_chat(sample: Dict[str, str]) -> Dict[str, str]:
    """
    Convert an instruction-tuning sample to the chat format expected by SFTTrainer.

    Input format:
        {"instruction": "...", "input": "...", "output": "...", "system": "..."}

    Output format (chat template string):
        <|im_start|>system
        {system_prompt}<|im_end|>
        <|im_start|>user
        {instruction}
        {input}<|im_end|>
        <|im_start|>assistant
        {output}<|im_end|>
    """
    system_prompt = sample.get("system", "")
    instruction = sample.get("instruction", "")
    input_text = sample.get("input", "")
    output = sample.get("output", "")

    # Build user message
    user_content = instruction
    if input_text:
        user_content += f"\n{input_text}"

    # Format as Qwen chat template (ChatML format)
    chat_text = ""
    if system_prompt:
        chat_text += f"<|im_start|>system\n{system_prompt}<|im_end|>\n"
    chat_text += f"<|im_start|>user\n{user_content}<|im_end|>\n"
    chat_text += f"<|im_start|>assistant\n{output}<|im_end|>"

    return {"text": chat_text}


def load_dataset_from_jsonl(
    data_dir: str,
    train_file: str,
    val_file: str,
    config: Dict[str, Any],
) -> tuple:
    """
    Load train and validation JSONL files and format for SFTTrainer.

    Returns:
        Tuple of (train_dataset, val_dataset) as HuggingFace Dataset objects
    """
    from datasets import Dataset

    train_path = os.path.join(data_dir, train_file)
    val_path = os.path.join(data_dir, val_file)

    if not os.path.exists(train_path):
        raise FileNotFoundError(f"Training data not found: {train_path}")
    if not os.path.exists(val_path):
        logger.warning(f"Validation data not found: {val_path}. Training without validation.")
        val_path = None

    # Load JSONL files
    def load_jsonl(path: str) -> list:
        samples = []
        with open(path, "r", encoding="utf-8") as f:
            for line in f:
                line = line.strip()
                if line:
                    samples.append(json.loads(line))
        return samples

    train_samples = load_jsonl(train_path)
    logger.info(f"Loaded {len(train_samples)} training samples from {train_path}")

    # Format all samples to chat format
    train_formatted = [format_to_chat(s) for s in train_samples]
    train_dataset = Dataset.from_list(train_formatted)

    val_dataset = None
    if val_path:
        val_samples = load_jsonl(val_path)
        logger.info(f"Loaded {len(val_samples)} validation samples from {val_path}")
        val_formatted = [format_to_chat(s) for s in val_samples]
        val_dataset = Dataset.from_list(val_formatted)

    return train_dataset, val_dataset


# =============================================================================
# Model and Tokenizer Setup
# =============================================================================

def setup_model_and_tokenizer(config: Dict[str, Any]) -> tuple:
    """
    Load the base model with 4-bit quantization and setup the tokenizer.

    Returns:
        Tuple of (model, tokenizer)
    """
    import torch
    from transformers import (
        AutoModelForCausalLM,
        AutoTokenizer,
        BitsAndBytesConfig,
    )

    model_config = config["model"]
    quant_config = config["quantization"]

    # --- BitsAndBytes 4-bit quantization config ---
    compute_dtype_map = {
        "bfloat16": torch.bfloat16,
        "float16": torch.float16,
    }
    compute_dtype = compute_dtype_map.get(
        quant_config.get("bnb_4bit_compute_dtype", "bfloat16"),
        torch.bfloat16,
    )

    bnb_config = BitsAndBytesConfig(
        load_in_4bit=quant_config.get("load_in_4bit", True),
        bnb_4bit_quant_type=quant_config.get("bnb_4bit_quant_type", "nf4"),
        bnb_4bit_compute_dtype=compute_dtype,
        bnb_4bit_use_double_quant=quant_config.get("bnb_4bit_use_double_quant", True),
    )

    logger.info(f"Loading model: {model_config['name']}")
    logger.info(f"  Quantization: 4-bit {quant_config.get('bnb_4bit_quant_type', 'nf4')}")
    logger.info(f"  Compute dtype: {compute_dtype}")

    # --- Load model ---
    model_kwargs = {
        "quantization_config": bnb_config,
        "device_map": "auto",
        "trust_remote_code": model_config.get("trust_remote_code", True),
    }

    # Flash Attention 2 (requires Ampere+ GPU and flash-attn package)
    if model_config.get("use_flash_attention", False):
        try:
            import flash_attn  # noqa: F401
            model_kwargs["attn_implementation"] = "flash_attention_2"
            logger.info("  Using Flash Attention 2")
        except ImportError:
            logger.warning("  Flash Attention not available. Using default attention. "
                           "Install with: pip install flash-attn --no-build-isolation")

    model = AutoModelForCausalLM.from_pretrained(
        model_config["name"],
        **model_kwargs,
    )

    # --- Load tokenizer ---
    tokenizer = AutoTokenizer.from_pretrained(
        model_config["name"],
        trust_remote_code=model_config.get("trust_remote_code", True),
    )

    # Qwen models may not have a default pad token; set it
    if tokenizer.pad_token is None:
        tokenizer.pad_token = tokenizer.eos_token
        logger.info("  Set pad_token to eos_token")

    # Don't add bos token during training
    tokenizer.add_bos_token = False

    # Prepare model for k-bit training (required for QLoRA)
    from peft import prepare_model_for_kbit_training
    model = prepare_model_for_kbit_training(
        model,
        use_gradient_checkpointing=config["training"].get("gradient_checkpointing", True),
    )

    logger.info(f"  Model loaded successfully. Device map: {model.hf_device_map if hasattr(model, 'hf_device_map') else 'auto'}")

    return model, tokenizer


# =============================================================================
# LoRA Adapter Setup
# =============================================================================

def setup_lora(model, config: Dict[str, Any]):
    """
    Apply LoRA adapters to the model based on configuration.

    Returns:
        PeftModel with LoRA adapters
    """
    from peft import LoraConfig, get_peft_model, TaskType

    lora_config = config["lora"]

    peft_config = LoraConfig(
        r=lora_config.get("rank", 64),
        lora_alpha=lora_config.get("alpha", 128),
        lora_dropout=lora_config.get("dropout", 0.05),
        target_modules=lora_config.get("target_modules", [
            "q_proj", "k_proj", "v_proj", "o_proj",
            "gate_proj", "up_proj", "down_proj",
        ]),
        bias=lora_config.get("bias", "none"),
        task_type=TaskType.CAUSAL_LM,
    )

    logger.info("Applying LoRA adapters:")
    logger.info(f"  Rank: {peft_config.r}")
    logger.info(f"  Alpha: {peft_config.lora_alpha}")
    logger.info(f"  Dropout: {peft_config.lora_dropout}")
    logger.info(f"  Target modules: {peft_config.target_modules}")

    model = get_peft_model(model, peft_config)

    # Print trainable parameters
    trainable, total = model.get_nb_trainable_parameters()
    logger.info(f"  Trainable parameters: {trainable:,} / {total:,} "
                f"({100 * trainable / total:.2f}%)")

    return model


# =============================================================================
# Training
# =============================================================================

def train(
    model,
    tokenizer,
    train_dataset,
    val_dataset,
    config: Dict[str, Any],
) -> None:
    """
    Run QLoRA fine-tuning using SFTTrainer.

    Args:
        model: The PEFT model with LoRA adapters
        tokenizer: The tokenizer
        train_dataset: Training dataset (formatted with 'text' column)
        val_dataset: Validation dataset (formatted with 'text' column), or None
        config: Full configuration dictionary
    """
    import torch
    from trl import SFTTrainer, SFTConfig

    training_config = config["training"]
    model_config = config["model"]

    # --- Weights & Biases setup ---
    wandb_config = config.get("wandb", {})
    if wandb_config.get("enabled", False):
        os.environ["WANDB_PROJECT"] = wandb_config.get("project", "arthsathi")
        if wandb_config.get("entity"):
            os.environ["WANDB_ENTITY"] = wandb_config["entity"]
        report_to = "wandb"
    else:
        report_to = training_config.get("report_to", "tensorboard")

    # --- Output directories ---
    output_dir = training_config.get("output_dir", "./output")
    checkpoint_dir = training_config.get("checkpoint_dir", "./checkpoints")
    os.makedirs(output_dir, exist_ok=True)
    os.makedirs(checkpoint_dir, exist_ok=True)

    # --- SFT Training Arguments ---
    sft_args = SFTConfig(
        # Output
        output_dir=checkpoint_dir,
        run_name="arthsathi-qlora",

        # Batch and gradient
        per_device_train_batch_size=training_config.get("per_device_train_batch_size", 4),
        per_device_eval_batch_size=training_config.get("per_device_eval_batch_size", 4),
        gradient_accumulation_steps=training_config.get("gradient_accumulation_steps", 8),

        # Learning rate
        learning_rate=training_config.get("learning_rate", 2e-4),
        lr_scheduler_type=training_config.get("lr_scheduler_type", "cosine"),
        warmup_ratio=training_config.get("warmup_ratio", 0.1),
        weight_decay=training_config.get("weight_decay", 0.01),

        # Epochs
        num_train_epochs=training_config.get("num_train_epochs", 3),
        max_steps=training_config.get("max_steps", -1),

        # Precision
        fp16=training_config.get("fp16", False),
        bf16=training_config.get("bf16", True),

        # Performance
        gradient_checkpointing=training_config.get("gradient_checkpointing", True),
        optim=training_config.get("optim", "paged_adamw_8bit"),

        # Logging
        logging_steps=training_config.get("logging_steps", 25),
        logging_dir=training_config.get("logging_dir", "./logs"),
        report_to=report_to,

        # Evaluation
        eval_strategy=training_config.get("eval_strategy", "steps"),
        eval_steps=training_config.get("eval_steps", 250),
        eval_accumulation_steps=training_config.get("eval_accumulation_steps", 4),

        # Saving
        save_strategy=training_config.get("save_strategy", "steps"),
        save_steps=training_config.get("save_steps", 500),
        save_total_limit=training_config.get("save_total_limit", 3),
        load_best_model_at_end=training_config.get("load_best_model_at_end", True),
        metric_for_best_model=training_config.get("metric_for_best_model", "eval_loss"),
        greater_is_better=training_config.get("greater_is_better", False),

        # Reproducibility
        seed=training_config.get("seed", 42),
        data_seed=training_config.get("seed", 42),

        # DataLoader
        dataloader_num_workers=training_config.get("dataloader_num_workers", 4),
        dataloader_pin_memory=training_config.get("dataloader_pin_memory", True),

        # SFT-specific
        packing=False,  # Don't pack — we want proper attention masks per sample
        neftune_noise_alpha=training_config.get("neftune_noise_alpha", None),

        # Misc
        remove_unused_columns=training_config.get("remove_unused_columns", False),
    )

    # --- Create Trainer ---
    trainer = SFTTrainer(
        model=model,
        args=sft_args,
        train_dataset=train_dataset,
        eval_dataset=val_dataset,
        tokenizer=tokenizer,
        max_seq_length=model_config.get("max_seq_length", 2048),
        dataset_text_field="text",
    )

    # --- Print training summary ---
    effective_batch_size = (
        sft_args.per_device_train_batch_size
        * sft_args.gradient_accumulation_steps
        * torch.cuda.device_count() if torch.cuda.is_available() else 1
    )
    total_steps = len(train_dataset) // effective_batch_size * sft_args.num_train_epochs

    logger.info("=" * 60)
    logger.info("TRAINING SUMMARY")
    logger.info("=" * 60)
    logger.info(f"  Model:          {model_config['name']}")
    logger.info(f"  Train samples:  {len(train_dataset)}")
    logger.info(f"  Val samples:    {len(val_dataset) if val_dataset else 'None'}")
    logger.info(f"  Effective batch: {effective_batch_size}")
    logger.info(f"  Total steps:    ~{total_steps}")
    logger.info(f"  Learning rate:  {sft_args.learning_rate}")
    logger.info(f"  Epochs:         {sft_args.num_train_epochs}")
    logger.info(f"  Max seq length: {sft_args.max_seq_length}")
    logger.info(f"  Checkpoint dir: {checkpoint_dir}")
    logger.info(f"  Output dir:     {output_dir}")
    logger.info("=" * 60)

    # --- Train ---
    logger.info("Starting training...")
    train_result = trainer.train()

    # --- Log training metrics ---
    metrics = train_result.metrics
    logger.info(f"Training complete!")
    logger.info(f"  Total steps:  {metrics.get('total_flos', 'N/A')}")
    logger.info(f"  Train loss:   {metrics.get('train_loss', 'N/A'):.4f}")
    logger.info(f"  Train runtime: {metrics.get('train_runtime', 'N/A'):.1f}s")

    # --- Save final model ---
    logger.info(f"Saving final adapter to {output_dir}")
    trainer.save_model(output_dir)
    tokenizer.save_pretrained(output_dir)

    # Save training metrics
    metrics_path = os.path.join(output_dir, "training_metrics.json")
    with open(metrics_path, "w") as f:
        json.dump(metrics, f, indent=2)
    logger.info(f"Training metrics saved to {metrics_path}")

    # --- Final evaluation if validation set exists ---
    if val_dataset is not None:
        logger.info("Running final evaluation...")
        eval_metrics = trainer.evaluate()
        logger.info(f"Final eval loss: {eval_metrics.get('eval_loss', 'N/A'):.4f}")

        eval_metrics_path = os.path.join(output_dir, "eval_metrics.json")
        with open(eval_metrics_path, "w") as f:
            json.dump(eval_metrics, f, indent=2)
        logger.info(f"Eval metrics saved to {eval_metrics_path}")


# =============================================================================
# Main
# =============================================================================

def main():
    parser = argparse.ArgumentParser(
        description="ArthSathi: QLoRA Fine-Tuning on Qwen3-4B for Indian Finance"
    )
    parser.add_argument(
        "--config", type=str, default="config.yaml",
        help="Path to configuration YAML file"
    )
    parser.add_argument(
        "--epochs", type=int, default=None,
        help="Override number of training epochs"
    )
    parser.add_argument(
        "--lr", type=float, default=None,
        help="Override learning rate"
    )
    parser.add_argument(
        "--batch_size", type=int, default=None,
        help="Override per-device training batch size"
    )
    args = parser.parse_args()

    # Load configuration
    config = load_config(args.config)

    # Apply CLI overrides
    if args.epochs is not None:
        config["training"]["num_train_epochs"] = args.epochs
    if args.lr is not None:
        config["training"]["learning_rate"] = args.lr
    if args.batch_size is not None:
        config["training"]["per_device_train_batch_size"] = args.batch_size

    # Check GPU availability
    import torch
    if not torch.cuda.is_available():
        logger.error("No GPU detected. QLoRA fine-tuning requires CUDA. Aborting.")
        sys.exit(1)

    logger.info(f"GPU: {torch.cuda.get_device_name(0)}")
    logger.info(f"VRAM: {torch.cuda.get_device_properties(0).total_memory / 1e9:.1f} GB")

    # -------------------------------------------------------------------
    # Step 1: Load and format dataset
    # -------------------------------------------------------------------
    logger.info("=" * 60)
    logger.info("STEP 1: Loading dataset")
    logger.info("=" * 60)

    ds_config = config["dataset"]
    train_dataset, val_dataset = load_dataset_from_jsonl(
        data_dir=ds_config["output_dir"],
        train_file=ds_config["train_file"],
        val_file=ds_config["val_file"],
        config=config,
    )

    # -------------------------------------------------------------------
    # Step 2: Setup model and tokenizer
    # -------------------------------------------------------------------
    logger.info("=" * 60)
    logger.info("STEP 2: Setting up model and tokenizer")
    logger.info("=" * 60)

    model, tokenizer = setup_model_and_tokenizer(config)

    # -------------------------------------------------------------------
    # Step 3: Apply LoRA adapters
    # -------------------------------------------------------------------
    logger.info("=" * 60)
    logger.info("STEP 3: Applying LoRA adapters")
    logger.info("=" * 60)

    model = setup_lora(model, config)

    # -------------------------------------------------------------------
    # Step 4: Train
    # -------------------------------------------------------------------
    logger.info("=" * 60)
    logger.info("STEP 4: Starting QLoRA fine-tuning")
    logger.info("=" * 60)

    train(model, tokenizer, train_dataset, val_dataset, config)

    logger.info("=" * 60)
    logger.info("Fine-tuning complete! 🎉")
    logger.info(f"Adapter saved to: {config['training']['output_dir']}")
    logger.info("Next steps:")
    logger.info("  1. Run evaluation:    python evaluate.py --config config.yaml")
    logger.info("  2. Export to ONNX:     python export_onnx.py --config config.yaml")
    logger.info("=" * 60)


if __name__ == "__main__":
    main()
