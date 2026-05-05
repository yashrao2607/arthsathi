#!/usr/bin/env python3
# =============================================================================
# ArthSathi (अर्थसाथी) — Evaluation Script with BhashaBench-Finance Metrics
# =============================================================================
# Evaluates the fine-tuned ArthSathi model against the base Qwen3-4B model
# on the test set. Computes accuracy, BLEU, and ROUGE-L scores per language.
# Generates a comparison table and saves results to JSON.
#
# Usage:
#   python evaluate.py --config config.yaml
#   python evaluate.py --config config.yaml --max_samples 200
# =============================================================================

import argparse
import json
import logging
import os
import sys
import time
from typing import Any, Dict, List, Optional, Tuple

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
# Configuration
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
# Test Data Loading
# =============================================================================

def load_test_data(filepath: str, max_samples: Optional[int] = None) -> List[Dict[str, str]]:
    """Load test set from JSONL file."""
    if not os.path.exists(filepath):
        raise FileNotFoundError(f"Test data not found: {filepath}")

    samples = []
    with open(filepath, "r", encoding="utf-8") as f:
        for line in f:
            line = line.strip()
            if line:
                samples.append(json.loads(line))

    if max_samples and max_samples < len(samples):
        samples = samples[:max_samples]
        logger.info(f"  Truncated to {max_samples} samples for evaluation")

    logger.info(f"Loaded {len(samples)} test samples from {filepath}")
    return samples


# =============================================================================
# Language Detection
# =============================================================================

def detect_language(text: str) -> str:
    """
    Simple heuristic language detection for English/Hindi/Hinglish.

    Returns:
        "hi" if Devanagari script detected, "en" otherwise.
    """
    devanagari_range = range(0x0900, 0x097F + 1)
    devanagari_chars = sum(1 for c in text if ord(c) in devanagari_range)
    total_alpha = sum(1 for c in text if c.isalpha())

    if total_alpha > 0 and devanagari_chars / total_alpha > 0.3:
        return "hi"
    return "en"


# =============================================================================
# Model Loading
# =============================================================================

def load_model(model_path: str, is_adapter: bool = False, base_model: Optional[str] = None):
    """
    Load a model for evaluation. Handles both full models and LoRA adapters.

    Args:
        model_path: Path to the model or adapter
        is_adapter: Whether the path points to a LoRA adapter
        base_model: Base model name (required if is_adapter=True)

    Returns:
        Tuple of (model, tokenizer)
    """
    import torch
    from transformers import AutoModelForCausalLM, AutoTokenizer

    if is_adapter and base_model:
        from peft import PeftModel

        logger.info(f"Loading base model: {base_model}")
        base = AutoModelForCausalLM.from_pretrained(
            base_model,
            torch_dtype=torch.bfloat16,
            device_map="auto",
            trust_remote_code=True,
        )
        logger.info(f"Loading adapter from: {model_path}")
        model = PeftModel.from_pretrained(base, model_path)
        model = model.merge_and_unload()
        logger.info("  Adapter merged with base model")
    else:
        logger.info(f"Loading model: {model_path}")
        model = AutoModelForCausalLM.from_pretrained(
            model_path,
            torch_dtype=torch.bfloat16,
            device_map="auto",
            trust_remote_code=True,
        )

    model.eval()

    tokenizer = AutoTokenizer.from_pretrained(
        base_model if is_adapter else model_path,
        trust_remote_code=True,
    )
    if tokenizer.pad_token is None:
        tokenizer.pad_token = tokenizer.eos_token

    return model, tokenizer


# =============================================================================
# Inference
# =============================================================================

def generate_response(
    model,
    tokenizer,
    instruction: str,
    input_text: str = "",
    system_prompt: str = "",
    max_new_tokens: int = 512,
    temperature: float = 0.1,
    top_p: float = 0.9,
    do_sample: bool = True,
) -> str:
    """
    Generate a response from the model for a given instruction.

    Formats the input using Qwen's ChatML template and generates a response.
    """
    import torch

    # Build user message
    user_content = instruction
    if input_text:
        user_content += f"\n{input_text}"

    # Format as ChatML
    messages = []
    if system_prompt:
        messages.append({"role": "system", "content": system_prompt})
    messages.append({"role": "user", "content": user_content})

    # Apply chat template
    try:
        text = tokenizer.apply_chat_template(
            messages,
            tokenize=False,
            add_generation_prompt=True,
        )
    except Exception:
        # Fallback: manual ChatML formatting
        text = ""
        if system_prompt:
            text += f"<|im_start|>system\n{system_prompt}<|im_end|>\n"
        text += f"<|im_start|>user\n{user_content}<|im_end|>\n"
        text += "<|im_start|>assistant\n"

    inputs = tokenizer(text, return_tensors="pt", truncation=True, max_length=2048)
    inputs = {k: v.to(model.device) for k, v in inputs.items()}

    with torch.no_grad():
        outputs = model.generate(
            **inputs,
            max_new_tokens=max_new_tokens,
            temperature=temperature,
            top_p=top_p,
            do_sample=do_sample,
            pad_token_id=tokenizer.pad_token_id,
            eos_token_id=tokenizer.eos_token_id,
        )

    # Decode only the generated tokens (skip the input)
    generated_ids = outputs[0][inputs["input_ids"].shape[1]:]
    response = tokenizer.decode(generated_ids, skip_special_tokens=True)

    return response.strip()


def run_evaluation(
    model,
    tokenizer,
    test_samples: List[Dict[str, str]],
    eval_config: Dict[str, Any],
    model_name: str = "model",
) -> List[Dict[str, Any]]:
    """
    Run inference on all test samples and collect results.

    Returns:
        List of result dicts with prediction, reference, language, etc.
    """
    results = []
    total = len(test_samples)

    logger.info(f"Running evaluation for {model_name} on {total} samples...")

    for idx, sample in enumerate(test_samples):
        instruction = sample.get("instruction", "")
        input_text = sample.get("input", "")
        reference = sample.get("output", "")
        system_prompt = sample.get("system", "")

        try:
            prediction = generate_response(
                model, tokenizer,
                instruction=instruction,
                input_text=input_text,
                system_prompt=system_prompt,
                max_new_tokens=eval_config.get("max_new_tokens", 512),
                temperature=eval_config.get("temperature", 0.1),
                top_p=eval_config.get("top_p", 0.9),
                do_sample=eval_config.get("do_sample", True),
            )
        except Exception as e:
            logger.warning(f"  Error generating response for sample {idx}: {e}")
            prediction = ""

        # Detect language of the reference
        lang = detect_language(reference)

        results.append({
            "instruction": instruction,
            "input": input_text,
            "reference": reference,
            "prediction": prediction,
            "language": lang,
            "model": model_name,
        })

        if (idx + 1) % 50 == 0:
            logger.info(f"  Progress: {idx + 1}/{total} ({100*(idx+1)/total:.1f}%)")

    logger.info(f"  Evaluation complete for {model_name}: {len(results)} results")
    return results


# =============================================================================
# Metric Computation
# =============================================================================

def compute_bleu(prediction: str, reference: str) -> float:
    """
    Compute BLEU score between prediction and reference.

    Uses sacrebleu for consistent BLEU computation.
    """
    try:
        import sacrebleu

        if not prediction.strip() or not reference.strip():
            return 0.0

        bleu = sacrebleu.sentence_bleu(prediction, [reference])
        return bleu.score / 100.0  # Normalize to [0, 1]
    except ImportError:
        # Fallback to NLTK BLEU
        from nltk.translate.bleu_score import SmoothingFunction, sentence_bleu

        if not prediction.strip() or not reference.strip():
            return 0.0

        ref_tokens = [reference.lower().split()]
        pred_tokens = prediction.lower().split()
        try:
            return sentence_bleu(
                ref_tokens, pred_tokens,
                smoothing_function=SmoothingFunction().method1,
            )
        except Exception:
            return 0.0
    except Exception:
        return 0.0


def compute_rouge_l(prediction: str, reference: str) -> float:
    """
    Compute ROUGE-L F1 score between prediction and reference.
    """
    try:
        from rouge_score import rouge_scorer

        if not prediction.strip() or not reference.strip():
            return 0.0

        scorer = rouge_scorer.RougeScorer(["rougeL"], use_stemmer=True)
        scores = scorer.score(reference, prediction)
        return scores["rougeL"].fmeasure
    except Exception:
        return 0.0


def compute_accuracy(prediction: str, reference: str) -> float:
    """
    Compute a simple accuracy metric based on key-fact overlap.

    Checks if important words/phrases from the reference appear in the prediction.
    This is a heuristic for factual accuracy in finance Q&A.
    """
    if not prediction.strip() or not reference.strip():
        return 0.0

    # Extract key terms (numbers, percentages, section numbers, amounts)
    import re

    def extract_key_terms(text: str) -> set:
        """Extract financially relevant terms: numbers, percentages, section references."""
        terms = set()

        # Numbers and percentages
        for match in re.finditer(r'\d+\.?\d*\s*%?', text):
            terms.add(match.group().strip())

        # Section references (e.g., "Section 80C", "Sec 80C", "80C")
        for match in re.finditer(r'(?:Section|Sec\.?)\s+(\d+[A-Z]?)', text, re.IGNORECASE):
            terms.add(match.group(1))

        # Important financial terms (INR amounts, rates, etc.)
        for match in re.finditer(r'₹\s*[\d,.]+|\d+\s*(?:lakh|crore|rupees)', text, re.IGNORECASE):
            terms.add(match.group().strip().lower())

        return terms

    ref_terms = extract_key_terms(reference)
    if not ref_terms:
        # If no key terms found, fall back to word overlap
        ref_words = set(reference.lower().split())
        pred_words = set(prediction.lower().split())
        if not ref_words:
            return 0.0
        overlap = ref_words & pred_words
        return len(overlap) / len(ref_words)

    pred_terms = extract_key_terms(prediction)
    if not pred_terms:
        return 0.0

    overlap = ref_terms & pred_terms
    return len(overlap) / len(ref_terms)


def compute_all_metrics(results: List[Dict[str, Any]]) -> Dict[str, Any]:
    """
    Compute all metrics for a set of results, broken down by language.

    Returns:
        Dict with overall and per-language metrics
    """
    metrics = {
        "overall": {"accuracy": [], "bleu": [], "rouge_l": []},
        "by_language": {},
    }

    for result in results:
        prediction = result["prediction"]
        reference = result["reference"]
        lang = result.get("language", "en")

        # Compute individual metrics
        acc = compute_accuracy(prediction, reference)
        bleu = compute_bleu(prediction, reference)
        rouge_l = compute_rouge_l(prediction, reference)

        # Overall
        metrics["overall"]["accuracy"].append(acc)
        metrics["overall"]["bleu"].append(bleu)
        metrics["overall"]["rouge_l"].append(rouge_l)

        # Per-language
        if lang not in metrics["by_language"]:
            metrics["by_language"][lang] = {"accuracy": [], "bleu": [], "rouge_l": []}
        metrics["by_language"][lang]["accuracy"].append(acc)
        metrics["by_language"][lang]["bleu"].append(bleu)
        metrics["by_language"][lang]["rouge_l"].append(rouge_l)

    # Compute averages
    def avg(lst: list) -> float:
        return sum(lst) / len(lst) if lst else 0.0

    metrics["overall"]["accuracy"] = avg(metrics["overall"]["accuracy"])
    metrics["overall"]["bleu"] = avg(metrics["overall"]["bleu"])
    metrics["overall"]["rouge_l"] = avg(metrics["overall"]["rouge_l"])

    for lang in metrics["by_language"]:
        metrics["by_language"][lang]["accuracy"] = avg(metrics["by_language"][lang]["accuracy"])
        metrics["by_language"][lang]["bleu"] = avg(metrics["by_language"][lang]["bleu"])
        metrics["by_language"][lang]["rouge_l"] = avg(metrics["by_language"][lang]["rouge_l"])

    return metrics


# =============================================================================
# Comparison Table
# =============================================================================

def print_comparison_table(
    base_metrics: Dict[str, Any],
    finetuned_metrics: Dict[str, Any],
) -> None:
    """Pretty-print a comparison table of base vs. fine-tuned model metrics."""

    def fmt(val: float) -> str:
        return f"{val:.4f}" if val >= 0.001 else f"{val:.6f}"

    def delta(base: float, ft: float) -> str:
        d = ft - base
        sign = "+" if d >= 0 else ""
        return f"{sign}{d:.4f}"

    # Header
    print("\n" + "=" * 80)
    print("  ArthSathi (अर्थसाथी) — BhashaBench-Finance Evaluation Results")
    print("=" * 80)

    # Overall comparison
    print("\n┌──────────────────┬──────────────┬──────────────┬──────────────┐")
    print("│     Metric       │  Base Model  │  Fine-tuned  │    Delta     │")
    print("├──────────────────┼──────────────┼──────────────┼──────────────┤")

    for metric_name in ["accuracy", "bleu", "rouge_l"]:
        base_val = base_metrics["overall"][metric_name]
        ft_val = finetuned_metrics["overall"][metric_name]
        d = delta(base_val, ft_val)
        print(f"│ {metric_name:<16} │ {fmt(base_val):>12} │ {fmt(ft_val):>12} │ {d:>12} │")

    print("└──────────────────┴──────────────┴──────────────┴──────────────┘")

    # Per-language comparison
    all_langs = set()
    all_langs.update(base_metrics.get("by_language", {}).keys())
    all_langs.update(finetuned_metrics.get("by_language", {}).keys())

    for lang in sorted(all_langs):
        lang_name = "English" if lang == "en" else "Hindi" if lang == "hi" else lang
        print(f"\n  [{lang_name}]")

        base_lang = base_metrics.get("by_language", {}).get(lang, {})
        ft_lang = finetuned_metrics.get("by_language", {}).get(lang, {})

        print("  ┌──────────────────┬──────────────┬──────────────┬──────────────┐")
        print("  │     Metric       │  Base Model  │  Fine-tuned  │    Delta     │")
        print("  ├──────────────────┼──────────────┼──────────────┼──────────────┤")

        for metric_name in ["accuracy", "bleu", "rouge_l"]:
            base_val = base_lang.get(metric_name, 0.0)
            ft_val = ft_lang.get(metric_name, 0.0)
            d = delta(base_val, ft_val)
            print(f"  │ {metric_name:<16} │ {fmt(base_val):>12} │ {fmt(ft_val):>12} │ {d:>12} │")

        print("  └──────────────────┴──────────────┴──────────────┴──────────────┘")

    print()


# =============================================================================
# Results Saving
# =============================================================================

def save_results(
    base_metrics: Dict[str, Any],
    finetuned_metrics: Dict[str, Any],
    base_results: List[Dict],
    finetuned_results: List[Dict],
    results_dir: str,
) -> None:
    """Save all results and metrics to JSON files."""
    os.makedirs(results_dir, exist_ok=True)

    # Summary metrics
    summary = {
        "base_model": base_metrics,
        "finetuned_model": finetuned_metrics,
        "timestamp": time.strftime("%Y-%m-%d %H:%M:%S"),
    }

    summary_path = os.path.join(results_dir, "results.json")
    with open(summary_path, "w", encoding="utf-8") as f:
        json.dump(summary, f, indent=2, ensure_ascii=False)
    logger.info(f"Summary results saved to {summary_path}")

    # Detailed per-sample results
    base_details_path = os.path.join(results_dir, "base_model_predictions.jsonl")
    with open(base_details_path, "w", encoding="utf-8") as f:
        for r in base_results:
            f.write(json.dumps(r, ensure_ascii=False) + "\n")
    logger.info(f"Base model predictions saved to {base_details_path}")

    ft_details_path = os.path.join(results_dir, "finetuned_predictions.jsonl")
    with open(ft_details_path, "w", encoding="utf-8") as f:
        for r in finetuned_results:
            f.write(json.dumps(r, ensure_ascii=False) + "\n")
    logger.info(f"Fine-tuned predictions saved to {ft_details_path}")


# =============================================================================
# Main
# =============================================================================

def main():
    parser = argparse.ArgumentParser(
        description="ArthSathi: Evaluate fine-tuned model with BhashaBench-Finance metrics"
    )
    parser.add_argument(
        "--config", type=str, default="config.yaml",
        help="Path to configuration YAML file"
    )
    parser.add_argument(
        "--max_samples", type=int, default=None,
        help="Maximum number of test samples to evaluate (for quick runs)"
    )
    parser.add_argument(
        "--skip_base", action="store_true",
        help="Skip base model evaluation (only evaluate fine-tuned model)"
    )
    args = parser.parse_args()

    # Load configuration
    config = load_config(args.config)
    eval_config = config["evaluation"]

    # Check GPU
    import torch
    if not torch.cuda.is_available():
        logger.warning("No GPU detected. Evaluation will be very slow on CPU.")

    # -------------------------------------------------------------------
    # Step 1: Load test data
    # -------------------------------------------------------------------
    logger.info("=" * 60)
    logger.info("STEP 1: Loading test data")
    logger.info("=" * 60)

    test_samples = load_test_data(
        eval_config["test_file"],
        max_samples=args.max_samples,
    )

    # -------------------------------------------------------------------
    # Step 2: Load models
    # -------------------------------------------------------------------
    logger.info("=" * 60)
    logger.info("STEP 2: Loading models")
    logger.info("=" * 60)

    # Load fine-tuned model (as LoRA adapter merged with base)
    finetuned_model, finetuned_tokenizer = load_model(
        model_path=eval_config["model_path"],
        is_adapter=True,
        base_model=eval_config["base_model"],
    )

    base_model = None
    base_tokenizer = None
    if not args.skip_base:
        base_model, base_tokenizer = load_model(
            model_path=eval_config["base_model"],
            is_adapter=False,
        )

    # -------------------------------------------------------------------
    # Step 3: Run evaluation
    # -------------------------------------------------------------------
    logger.info("=" * 60)
    logger.info("STEP 3: Running evaluation")
    logger.info("=" * 60)

    # Evaluate fine-tuned model
    finetuned_results = run_evaluation(
        finetuned_model, finetuned_tokenizer,
        test_samples, eval_config,
        model_name="ArthSathi (fine-tuned)",
    )

    # Evaluate base model
    base_results = []
    if base_model is not None:
        base_results = run_evaluation(
            base_model, base_tokenizer,
            test_samples, eval_config,
            model_name="Qwen3-4B (base)",
        )

    # -------------------------------------------------------------------
    # Step 4: Compute metrics
    # -------------------------------------------------------------------
    logger.info("=" * 60)
    logger.info("STEP 4: Computing metrics")
    logger.info("=" * 60)

    finetuned_metrics = compute_all_metrics(finetuned_results)
    logger.info(f"Fine-tuned model metrics: {finetuned_metrics['overall']}")

    base_metrics = {"overall": {}, "by_language": {}}
    if base_results:
        base_metrics = compute_all_metrics(base_results)
        logger.info(f"Base model metrics: {base_metrics['overall']}")

    # -------------------------------------------------------------------
    # Step 5: Print comparison table
    # -------------------------------------------------------------------
    logger.info("=" * 60)
    logger.info("STEP 5: Generating comparison table")
    logger.info("=" * 60)

    if base_results:
        print_comparison_table(base_metrics, finetuned_metrics)
    else:
        print(f"\nFine-tuned model results: {finetuned_metrics['overall']}\n")

    # -------------------------------------------------------------------
    # Step 6: Save results
    # -------------------------------------------------------------------
    logger.info("=" * 60)
    logger.info("STEP 6: Saving results")
    logger.info("=" * 60)

    results_dir = eval_config.get("results_dir", "./eval_results")
    save_results(base_metrics, finetuned_metrics, base_results, finetuned_results, results_dir)

    logger.info("=" * 60)
    logger.info("Evaluation complete!")
    logger.info(f"Results saved to: {results_dir}")
    logger.info("=" * 60)


if __name__ == "__main__":
    main()
