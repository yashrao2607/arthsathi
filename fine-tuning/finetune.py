import os
import sys
import yaml
import torch
import logging
import argparse
from datetime import datetime
from datasets import load_dataset
from transformers import (
    AutoModelForCausalLM,
    AutoTokenizer,
    BitsAndBytesConfig,
    set_seed,
)
from peft import (
    LoraConfig,
    get_peft_model,
    prepare_model_for_kbit_training,
)
from trl import SFTTrainer, SFTConfig

# Setup logging
logging.basicConfig(
    format="%(asctime)s [%(levelname)s] %(message)s",
    level=logging.INFO,
    datefmt="%Y-%m-%d %H:%M:%S",
)
logger = logging.getLogger(__name__)

def load_config(config_path):
    with open(config_path, "r") as f:
        return yaml.safe_load(f)

def setup_model_and_tokenizer(config):
    model_config = config["model"]
    quant_config = config["quantization"]
    
    compute_dtype = torch.float16
    
    local_rank = int(os.environ.get("LOCAL_RANK", -1))
    device_map = "auto" if local_rank == -1 else {"": local_rank}

    bnb_config = BitsAndBytesConfig(
        load_in_4bit=quant_config.get("load_in_4bit", True),
        bnb_4bit_quant_type=quant_config.get("bnb_4bit_quant_type", "nf4"),
        bnb_4bit_compute_dtype=compute_dtype,
        bnb_4bit_use_double_quant=quant_config.get("bnb_4bit_use_double_quant", True),
    )

    logger.info(f"Loading model: {model_config['name']}")
    model = AutoModelForCausalLM.from_pretrained(
        model_config["name"],
        quantization_config=bnb_config,
        device_map=device_map,
        trust_remote_code=True,
        dtype=compute_dtype,
    )
    
    tokenizer = AutoTokenizer.from_pretrained(model_config["name"], trust_remote_code=True)
    if tokenizer.pad_token is None:
        tokenizer.pad_token = tokenizer.eos_token
        
    return model, tokenizer, compute_dtype

def train(model, tokenizer, train_dataset, val_dataset, config, compute_dtype):
    lora_config_data = config["lora"]
    training_config = config["training"]
    
    model = prepare_model_for_kbit_training(model)
    
    lora_config = LoraConfig(
        r=lora_config_data["rank"],
        lora_alpha=lora_config_data["alpha"],
        target_modules=lora_config_data["target_modules"],
        lora_dropout=lora_config_data["dropout"],
        bias="none",
        task_type="CAUSAL_LM",
    )
    model = get_peft_model(model, lora_config)
    
    # NUCLEAR FIX: Force everything to float16 and DISABLE mixed precision flags
    # This prevents the GradScaler from ever starting.
    logger.info("  Total Eclipse: Forcing all parameters to float16 and disabling Scaler...")
    model.config.torch_dtype = compute_dtype
    for name, param in model.named_parameters():
        if "4bit" not in str(param.dtype).lower():
            param.data = param.data.to(torch.float16)

    # Dataset formatting function (ChatML format for Qwen)
    def formatting_prompts_func(example):
        system = example.get('system', "You are ArthSathi, a financial advisor.")
        instruction = example.get('instruction', "")
        input_text = example.get('input', "")
        response = example.get('output', "")
        
        text = f"<|im_start|>system\n{system}<|im_end|>\n"
        text += f"<|im_start|>user\n{instruction} {input_text}".strip() + "<|im_end|>\n"
        text += f"<|im_start|>assistant\n{response}<|im_end|>"
        return text

    sft_config = SFTConfig(
        output_dir=training_config["output_dir"],
        max_length=config["model"].get("max_seq_length", 2048),
        packing=False,
        per_device_train_batch_size=training_config["per_device_train_batch_size"],
        gradient_accumulation_steps=training_config["gradient_accumulation_steps"],
        learning_rate=float(training_config["learning_rate"]),
        num_train_epochs=training_config["num_train_epochs"],
        fp16=False, # DISABLED to bypass GradScaler
        bf16=False, # DISABLED
        logging_steps=training_config["logging_steps"],
        eval_strategy="steps",
        eval_steps=training_config["eval_steps"],
        save_strategy="steps",
        save_steps=training_config["save_steps"],
        report_to="none",
    )

    trainer = SFTTrainer(
        model=model,
        train_dataset=train_dataset,
        eval_dataset=val_dataset,
        args=sft_config,
        formatting_func=formatting_prompts_func,
        processing_class=tokenizer,
    )
    
    trainer.train()
    trainer.save_model(training_config["output_dir"])

def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--config", type=str, default="config.yaml")
    args = parser.parse_args()
    
    config = load_config(args.config)
    set_seed(config["training"].get("seed", 42))
    
    train_dataset = load_dataset("json", data_files="./data/train.jsonl", split="train")
    val_dataset = load_dataset("json", data_files="./data/val.jsonl", split="train")
    
    model, tokenizer, compute_dtype = setup_model_and_tokenizer(config)
    train(model, tokenizer, train_dataset, val_dataset, config, compute_dtype)

if __name__ == "__main__":
    main()
