#!/usr/bin/env python3
# =============================================================================
# ArthSathi (अर्थसाथी) — Dataset Preparation Script
# =============================================================================
# Downloads, cleans, normalizes, and formats Indian finance datasets for
# instruction tuning. Outputs train/val/test JSONL splits.
#
# Usage:
#   python prepare_data.py --config config.yaml
#   python prepare_data.py --config config.yaml --seed 123 --output_dir ./my_data
# =============================================================================

import argparse
import hashlib
import json
import logging
import os
import random
import sys
from pathlib import Path
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
# Configuration Loading
# =============================================================================

def load_config(config_path: str) -> Dict[str, Any]:
    """Load and validate the YAML configuration file."""
    if not os.path.exists(config_path):
        raise FileNotFoundError(f"Configuration file not found: {config_path}")

    with open(config_path, "r", encoding="utf-8") as f:
        config = yaml.safe_load(f)

    # Validate required sections
    required_sections = ["model", "dataset", "lora"]
    for section in required_sections:
        if section not in config:
            raise ValueError(f"Missing required config section: {section}")

    logger.info(f"Configuration loaded from {config_path}")
    return config


# =============================================================================
# Dataset Download
# =============================================================================

def download_dataset(name: str, split: str = "train") -> Any:
    """
    Download a dataset from HuggingFace Hub.

    Args:
        name: HuggingFace dataset identifier (e.g., "bharatgenai/FinanceParam")
        split: Dataset split to load

    Returns:
        datasets.Dataset object
    """
    try:
        from datasets import load_dataset
        logger.info(f"Downloading dataset: {name} (split={split})")
        # Load with trust_remote_code for custom datasets
        ds = load_dataset(name, split=split, trust_remote_code=True)
        logger.info(f"  Loaded {len(ds)} samples from {name}")
        return ds
    except Exception as e:
        logger.error(f"Failed to download {name}: {e}")
        raise


# =============================================================================
# Dataset Parsers — Convert raw datasets to unified format
# =============================================================================

def parse_financeparam(dataset: Any, system_prompt: str) -> List[Dict[str, str]]:
    """
    Parse bharatgenai/FinanceParam dataset into instruction format.

    Expected columns vary; handle common patterns:
      - instruction/response pairs
      - question/answer pairs
      - input/output pairs
    """
    samples = []
    for item in dataset:
        # FinanceParam may have different column names; try common patterns
        instruction = (
            item.get("instruction")
            or item.get("question")
            or item.get("input")
            or item.get("prompt")
            or ""
        ).strip()

        output = (
            item.get("response")
            or item.get("answer")
            or item.get("output")
            or item.get("completion")
            or ""
        ).strip()

        input_text = (
            item.get("input")
            or item.get("context")
            or ""
        ).strip()

        # Skip if we couldn't extract meaningful content
        if not instruction or not output:
            continue

        # Avoid using 'input' as instruction if it's the same field
        if input_text == instruction:
            input_text = ""

        samples.append({
            "instruction": instruction,
            "input": input_text,
            "output": output,
            "system": system_prompt,
            "source": "FinanceParam",
        })

    logger.info(f"  Parsed {len(samples)} samples from FinanceParam")
    return samples


def parse_finance_alpaca(dataset: Any, system_prompt: str) -> List[Dict[str, str]]:
    """
    Parse gbharti/finance-alpaca dataset into instruction format.

    Expected Alpaca format columns: instruction, input, output/text
    """
    samples = []
    for item in dataset:
        instruction = (
            item.get("instruction")
            or item.get("prompt")
            or ""
        ).strip()

        output = (
            item.get("output")
            or item.get("response")
            or item.get("text")
            or ""
        ).strip()

        input_text = (
            item.get("input")
            or item.get("context")
            or ""
        ).strip()

        if not instruction or not output:
            continue

        samples.append({
            "instruction": instruction,
            "input": input_text,
            "output": output,
            "system": system_prompt,
            "source": "finance-alpaca",
        })

    logger.info(f"  Parsed {len(samples)} samples from finance-alpaca")
    return samples


# Registry of dataset parsers keyed by format name
PARSERS = {
    "financeparam": parse_financeparam,
    "alpaca": parse_finance_alpaca,
}


# =============================================================================
# Data Cleaning and Quality Filtering
# =============================================================================

def compute_jaccard_similarity(text_a: str, text_b: str) -> float:
    """Compute Jaccard similarity between two texts based on word sets."""
    words_a = set(text_a.lower().split())
    words_b = set(text_b.lower().split())
    if not words_a and not words_b:
        return 1.0
    if not words_a or not words_b:
        return 0.0
    intersection = words_a & words_b
    union = words_a | words_b
    return len(intersection) / len(union)


def compute_hash(text: str) -> str:
    """Compute SHA-256 hash of text for exact deduplication."""
    return hashlib.sha256(text.encode("utf-8")).hexdigest()


def clean_text(text: str) -> str:
    """
    Clean and normalize text:
    - Strip leading/trailing whitespace
    - Normalize multiple spaces/newlines
    - Remove control characters
    - Fix common encoding issues
    """
    import re

    # Remove control characters (keep newlines and tabs)
    text = re.sub(r"[\x00-\x08\x0b\x0c\x0e-\x1f\x7f]", "", text)

    # Normalize multiple spaces (not newlines)
    text = re.sub(r"[^\S\n]+", " ", text)

    # Normalize multiple newlines to max 2
    text = re.sub(r"\n{3,}", "\n\n", text)

    # Strip leading/trailing whitespace
    text = text.strip()

    return text


def filter_and_clean_samples(
    samples: List[Dict[str, str]],
    min_instruction_length: int = 10,
    min_output_length: int = 20,
    max_instruction_length: int = 1024,
    max_output_length: int = 2048,
    deduplication_threshold: float = 0.85,
) -> List[Dict[str, str]]:
    """
    Apply quality filters and deduplication to the sample list.

    Steps:
    1. Clean text in all fields
    2. Filter by length constraints
    3. Exact deduplication via hashing
    4. Fuzzy deduplication via Jaccard similarity
    """
    logger.info(f"Starting cleaning: {len(samples)} raw samples")

    # --- Step 1: Clean text ---
    for sample in samples:
        sample["instruction"] = clean_text(sample["instruction"])
        sample["input"] = clean_text(sample["input"])
        sample["output"] = clean_text(sample["output"])

    # --- Step 2: Length filtering ---
    before = len(samples)
    samples = [
        s for s in samples
        if (
            min_instruction_length <= len(s["instruction"]) <= max_instruction_length
            and min_output_length <= len(s["output"]) <= max_output_length
        )
    ]
    logger.info(f"  Length filter: {before} → {len(samples)} (removed {before - len(samples)})")

    # --- Step 3: Exact deduplication ---
    before = len(samples)
    seen_hashes = set()
    deduped = []
    for sample in samples:
        # Hash based on instruction + output (ignore input for dedup)
        h = compute_hash(sample["instruction"] + sample["output"])
        if h not in seen_hashes:
            seen_hashes.add(h)
            deduped.append(sample)
    samples = deduped
    logger.info(f"  Exact dedup: {before} → {len(samples)} (removed {before - len(samples)})")

    # --- Step 4: Fuzzy deduplication (Jaccard on instruction) ---
    # Only apply to a subset for efficiency — check against recent samples
    before = len(samples)
    deduped = []
    recent_instructions: List[str] = []

    for sample in samples:
        is_duplicate = False
        instr = sample["instruction"]

        # Check against last N unique instructions
        for recent in recent_instructions[-200:]:
            if compute_jaccard_similarity(instr, recent) > deduplication_threshold:
                is_duplicate = True
                break

        if not is_duplicate:
            deduped.append(sample)
            recent_instructions.append(instr)

    samples = deduped
    logger.info(f"  Fuzzy dedup: {before} → {len(samples)} (removed {before - len(samples)})")

    logger.info(f"Cleaning complete: {len(samples)} clean samples")
    return samples


# =============================================================================
# Indian Finance-Specific Enhancements
# =============================================================================

# Additional context tags that can be appended to instructions
INDIA_FINANCE_TAGS = {
    "tax": "This question relates to Indian taxation. Reference the Income Tax Act and current assessment year.",
    "mutual_fund": "This question relates to Indian mutual funds. Reference SEBI guidelines and AMFI standards.",
    "insurance": "This question relates to Indian insurance. Reference IRDAI guidelines.",
    "banking": "This question relates to Indian banking. Reference RBI guidelines.",
    "investment": "This question relates to Indian investment options. Reference applicable SEBI/RBI regulations.",
    "savings": "This question relates to Indian savings schemes (PPF, NSC, KVP, SCSS, etc.).",
}

# Keywords for auto-tagging
TAG_KEYWORDS = {
    "tax": ["tax", "income tax", "section 80", "itr", "tds", "gst", "capital gains",
            "tax slab", "deduction", "exemption", "assessment year", "ay ", "pan"],
    "mutual_fund": ["mutual fund", "sip", "swp", "elss", "nav", "amc", "amfi",
                    "systematic", "lumpsum", "fund house"],
    "insurance": ["insurance", "lic", "term plan", "health insurance", "irdai",
                  "premium", "sum assured", "rider"],
    "banking": ["rbi", "repo rate", "fd", "fixed deposit", "savings account",
                "current account", "neft", "rtgs", "imps", "upi", "bank"],
    "investment": ["nps", "ppf", "national pension", "equity", "bond", "debenture",
                   "share", "stock", "demat", "sebi"],
    "savings": ["ppf", "nsc", "kvp", "scss", "senior citizen", "sukanya",
                "post office", "savings scheme"],
}


def auto_tag_sample(sample: Dict[str, str]) -> Dict[str, str]:
    """
    Auto-tag a sample with India finance-specific context based on keywords.

    Appends a relevant context note to the instruction if keywords match.
    """
    combined_text = (sample["instruction"] + " " + sample["input"]).lower()
    matched_tags = []

    for tag, keywords in TAG_KEYWORDS.items():
        if any(kw in combined_text for kw in keywords):
            matched_tags.append(tag)

    if matched_tags:
        context_note = " ".join(INDIA_FINANCE_TAGS[t] for t in matched_tags)
        # Prepend context note to instruction if not already present
        if context_note not in sample["instruction"]:
            sample["instruction"] = f"{sample['instruction']}\n[Context: {context_note}]"

    sample["tags"] = matched_tags
    return sample


# =============================================================================
# Train/Val/Test Splitting
# =============================================================================

def split_dataset(
    samples: List[Dict[str, str]],
    train_ratio: float = 0.90,
    val_ratio: float = 0.05,
    test_ratio: float = 0.05,
    seed: int = 42,
) -> Tuple[List[Dict], List[Dict], List[Dict]]:
    """
    Split samples into train, validation, and test sets.

    Ensures ratios sum to 1.0 and shuffles with a fixed seed for reproducibility.
    """
    total = len(samples)
    assert abs(train_ratio + val_ratio + test_ratio - 1.0) < 1e-6, \
        f"Split ratios must sum to 1.0, got {train_ratio + val_ratio + test_ratio}"

    # Shuffle deterministically
    rng = random.Random(seed)
    rng.shuffle(samples)

    train_end = int(total * train_ratio)
    val_end = train_end + int(total * val_ratio)

    train_set = samples[:train_end]
    val_set = samples[train_end:val_end]
    test_set = samples[val_end:]

    logger.info(f"Split: train={len(train_set)}, val={len(val_set)}, test={len(test_set)}")
    return train_set, val_set, test_set


# =============================================================================
# JSONL I/O
# =============================================================================

def save_jsonl(samples: List[Dict[str, str]], filepath: str) -> None:
    """Save a list of dictionaries as a JSONL file."""
    os.makedirs(os.path.dirname(filepath), exist_ok=True)

    with open(filepath, "w", encoding="utf-8") as f:
        for sample in samples:
            # Remove internal keys that shouldn't be in the output
            output_sample = {
                "instruction": sample["instruction"],
                "input": sample["input"],
                "output": sample["output"],
                "system": sample["system"],
            }
            f.write(json.dumps(output_sample, ensure_ascii=False) + "\n")

    logger.info(f"Saved {len(samples)} samples to {filepath}")


def load_jsonl(filepath: str) -> List[Dict[str, str]]:
    """Load a JSONL file as a list of dictionaries."""
    samples = []
    with open(filepath, "r", encoding="utf-8") as f:
        for line in f:
            line = line.strip()
            if line:
                samples.append(json.loads(line))
    return samples


# =============================================================================
# Statistics Reporting
# =============================================================================

def compute_statistics(samples: List[Dict[str, str]]) -> Dict[str, Any]:
    """Compute and return summary statistics for a sample set."""
    if not samples:
        return {"count": 0}

    instruction_lengths = [len(s["instruction"]) for s in samples]
    output_lengths = [len(s["output"]) for s in samples]
    input_lengths = [len(s["input"]) for s in samples if s.get("input")]

    stats = {
        "count": len(samples),
        "instruction_length": {
            "mean": sum(instruction_lengths) / len(instruction_lengths),
            "min": min(instruction_lengths),
            "max": max(instruction_lengths),
        },
        "output_length": {
            "mean": sum(output_lengths) / len(output_lengths),
            "min": min(output_lengths),
            "max": max(output_lengths),
        },
    }
    if input_lengths:
        stats["input_length"] = {
            "mean": sum(input_lengths) / len(input_lengths),
            "min": min(input_lengths),
            "max": max(input_lengths),
        }
        stats["samples_with_input"] = len(input_lengths)
    else:
        stats["samples_with_input"] = 0

    # Count by source
    sources = {}
    for s in samples:
        src = s.get("source", "unknown")
        sources[src] = sources.get(src, 0) + 1
    stats["by_source"] = sources

    return stats


# =============================================================================
# Main Pipeline
# =============================================================================

def main():
    parser = argparse.ArgumentParser(
        description="ArthSathi: Prepare Indian finance datasets for instruction tuning"
    )
    parser.add_argument(
        "--config", type=str, default="config.yaml",
        help="Path to configuration YAML file"
    )
    parser.add_argument(
        "--seed", type=int, default=None,
        help="Override random seed from config"
    )
    parser.add_argument(
        "--output_dir", type=str, default=None,
        help="Override output directory from config"
    )
    args = parser.parse_args()

    # Load configuration
    config = load_config(args.config)
    ds_config = config["dataset"]

    # Override from CLI args
    seed = args.seed if args.seed is not None else config["training"]["seed"]
    output_dir = args.output_dir or ds_config["output_dir"]

    system_prompt = ds_config["system_prompt"]

    # -----------------------------------------------------------------------
    # Step 1: Download datasets
    # -----------------------------------------------------------------------
    logger.info("=" * 60)
    logger.info("STEP 1: Downloading datasets from HuggingFace")
    logger.info("=" * 60)

    all_samples = []

    for source in ds_config["sources"]:
        dataset_name = source["name"]
        split = source.get("split", "train")
        fmt = source.get("format", "alpaca")

        try:
            raw_dataset = download_dataset(dataset_name, split)
        except Exception as e:
            logger.warning(f"Skipping dataset {dataset_name} due to error: {e}")
            continue

        # Parse into unified format
        parser_fn = PARSERS.get(fmt)
        if parser_fn is None:
            logger.error(f"Unknown format '{fmt}' for dataset {dataset_name}. "
                         f"Available: {list(PARSERS.keys())}")
            continue

        samples = parser_fn(raw_dataset, system_prompt)
        all_samples.extend(samples)

    if not all_samples:
        logger.error("No samples collected from any dataset. Aborting.")
        sys.exit(1)

    logger.info(f"Total raw samples collected: {len(all_samples)}")

    # -----------------------------------------------------------------------
    # Step 2: Clean and filter
    # -----------------------------------------------------------------------
    logger.info("=" * 60)
    logger.info("STEP 2: Cleaning and filtering samples")
    logger.info("=" * 60)

    all_samples = filter_and_clean_samples(
        all_samples,
        min_instruction_length=ds_config.get("min_instruction_length", 10),
        min_output_length=ds_config.get("min_output_length", 20),
        max_instruction_length=ds_config.get("max_instruction_length", 1024),
        max_output_length=ds_config.get("max_output_length", 2048),
        deduplication_threshold=ds_config.get("deduplication_threshold", 0.85),
    )

    if not all_samples:
        logger.error("No samples remaining after cleaning. Aborting.")
        sys.exit(1)

    # -----------------------------------------------------------------------
    # Step 3: Auto-tag with Indian finance context
    # -----------------------------------------------------------------------
    logger.info("=" * 60)
    logger.info("STEP 3: Auto-tagging with Indian finance context")
    logger.info("=" * 60)

    all_samples = [auto_tag_sample(s) for s in all_samples]

    tag_counts = {}
    for s in all_samples:
        for t in s.get("tags", []):
            tag_counts[t] = tag_counts.get(t, 0) + 1
    logger.info(f"Tag distribution: {tag_counts}")

    # -----------------------------------------------------------------------
    # Step 4: Split into train/val/test
    # -----------------------------------------------------------------------
    logger.info("=" * 60)
    logger.info("STEP 4: Splitting into train/val/test sets")
    logger.info("=" * 60)

    train_set, val_set, test_set = split_dataset(
        all_samples,
        train_ratio=ds_config.get("train_ratio", 0.90),
        val_ratio=ds_config.get("val_ratio", 0.05),
        test_ratio=ds_config.get("test_ratio", 0.05),
        seed=seed,
    )

    # -----------------------------------------------------------------------
    # Step 5: Save to JSONL files
    # -----------------------------------------------------------------------
    logger.info("=" * 60)
    logger.info("STEP 5: Saving processed datasets")
    logger.info("=" * 60)

    os.makedirs(output_dir, exist_ok=True)

    train_path = os.path.join(output_dir, ds_config["train_file"])
    val_path = os.path.join(output_dir, ds_config["val_file"])
    test_path = os.path.join(output_dir, ds_config["test_file"])

    save_jsonl(train_set, train_path)
    save_jsonl(val_set, val_path)
    save_jsonl(test_set, test_path)

    # -----------------------------------------------------------------------
    # Step 6: Print summary statistics
    # -----------------------------------------------------------------------
    logger.info("=" * 60)
    logger.info("SUMMARY STATISTICS")
    logger.info("=" * 60)

    for name, split_data in [("Train", train_set), ("Val", val_set), ("Test", test_set)]:
        stats = compute_statistics(split_data)
        logger.info(f"\n--- {name} Set ---")
        logger.info(f"  Samples: {stats['count']}")
        logger.info(f"  Instruction length: mean={stats['instruction_length']['mean']:.0f}, "
                     f"min={stats['instruction_length']['min']}, "
                     f"max={stats['instruction_length']['max']}")
        logger.info(f"  Output length: mean={stats['output_length']['mean']:.0f}, "
                     f"min={stats['output_length']['min']}, "
                     f"max={stats['output_length']['max']}")
        if stats.get("samples_with_input", 0) > 0:
            logger.info(f"  Samples with input: {stats['samples_with_input']}")
        logger.info(f"  By source: {stats.get('by_source', {})}")

    logger.info("=" * 60)
    logger.info("Dataset preparation complete!")
    logger.info(f"  Train: {train_path} ({len(train_set)} samples)")
    logger.info(f"  Val:   {val_path} ({len(val_set)} samples)")
    logger.info(f"  Test:  {test_path} ({len(test_set)} samples)")
    logger.info("=" * 60)


if __name__ == "__main__":
    main()
