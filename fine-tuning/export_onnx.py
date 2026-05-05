#!/usr/bin/env python3
# =============================================================================
# ArthSathi (अर्थसाथी) — ONNX Export Script for On-Device Deployment
# =============================================================================
# Exports the fine-tuned ArthSathi model to ONNX format with optional
# quantization for mobile/edge deployment. Verifies that the exported
# ONNX model produces outputs matching the PyTorch model.
#
# Usage:
#   python export_onnx.py --config config.yaml
#   python export_onnx.py --config config.yaml --skip_quantization
# =============================================================================

import argparse
import json
import logging
import os
import shutil
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
# Model Loading and Merging
# =============================================================================

def load_and_merge_model(
    adapter_path: str,
    base_model: str,
    output_dir: str,
) -> Tuple[Any, Any]:
    """
    Load the base model, apply LoRA adapter, merge, and save the merged model.

    Args:
        adapter_path: Path to the LoRA adapter directory
        base_model: HuggingFace model identifier for the base model
        output_dir: Directory to save the merged model

    Returns:
        Tuple of (merged_model, tokenizer)
    """
    import torch
    from transformers import AutoModelForCausalLM, AutoTokenizer
    from peft import PeftModel

    merged_dir = os.path.join(output_dir, "merged_model")

    # Check if already merged
    if os.path.exists(os.path.join(merged_dir, "config.json")):
        logger.info(f"Loading previously merged model from {merged_dir}")
        model = AutoModelForCausalLM.from_pretrained(
            merged_dir,
            torch_dtype=torch.bfloat16,
            device_map="cpu",  # Load to CPU for export
            trust_remote_code=True,
        )
        tokenizer = AutoTokenizer.from_pretrained(merged_dir, trust_remote_code=True)
        return model, tokenizer

    logger.info(f"Loading base model: {base_model}")
    model = AutoModelForCausalLM.from_pretrained(
        base_model,
        torch_dtype=torch.bfloat16,
        device_map="cpu",  # Load to CPU for export
        trust_remote_code=True,
    )

    logger.info(f"Loading LoRA adapter from: {adapter_path}")
    model = PeftModel.from_pretrained(model, adapter_path)

    logger.info("Merging LoRA adapter with base model...")
    model = model.merge_and_unload()

    logger.info(f"Saving merged model to {merged_dir}")
    os.makedirs(merged_dir, exist_ok=True)
    model.save_pretrained(merged_dir)

    tokenizer = AutoTokenizer.from_pretrained(base_model, trust_remote_code=True)
    if tokenizer.pad_token is None:
        tokenizer.pad_token = tokenizer.eos_token
    tokenizer.save_pretrained(merged_dir)

    logger.info("Model merged and saved successfully")
    return model, tokenizer


# =============================================================================
# ONNX Export
# =============================================================================

def export_to_onnx(
    model,
    tokenizer,
    output_dir: str,
    opset_version: int = 17,
    use_dynamo_export: bool = False,
) -> str:
    """
    Export the PyTorch model to ONNX format.

    Args:
        model: The PyTorch model to export
        tokenizer: The tokenizer (for creating dummy inputs)
        output_dir: Directory to save the ONNX model
        opset_version: ONNX opset version
        use_dynamo_export: Use torch.onnx.dynamo_export (experimental)

    Returns:
        Path to the exported ONNX model
    """
    import torch

    os.makedirs(output_dir, exist_ok=True)
    onnx_path = os.path.join(output_dir, "arthsathi.onnx")

    logger.info("Exporting model to ONNX format...")
    logger.info(f"  Output: {onnx_path}")
    logger.info(f"  Opset version: {opset_version}")

    # Create dummy input for tracing
    dummy_input_ids = torch.randint(
        0, tokenizer.vocab_size, (1, 128), dtype=torch.long
    )
    dummy_attention_mask = torch.ones((1, 128), dtype=torch.long)

    # Move model to CPU for export
    model = model.cpu()
    model.eval()

    if use_dynamo_export:
        # Experimental: Dynamo-based export (handles dynamic shapes better)
        logger.info("  Using Dynamo export mode (experimental)")
        try:
            torch.onnx.dynamo_export(
                model,
                dummy_input_ids,
                dummy_attention_mask,
                export_params=True,
                opset_version=opset_version,
            ).save(onnx_path)
        except Exception as e:
            logger.warning(f"Dynamo export failed: {e}. Falling back to torch.onnx.export.")
            use_dynamo_export = False

    if not use_dynamo_export:
        # Standard torch.onnx.export with tracing
        logger.info("  Using standard torch.onnx.export with tracing")

        # Create a wrapper that only returns logits (for cleaner export)
        class ONNXWrapper(torch.nn.Module):
            """Wrapper that returns only logits for ONNX export."""
            def __init__(self, model):
                super().__init__()
                self.model = model

            def forward(self, input_ids, attention_mask):
                outputs = self.model(
                    input_ids=input_ids,
                    attention_mask=attention_mask,
                )
                return outputs.logits

        wrapper = ONNXWrapper(model)
        wrapper.eval()

        # Dynamic axes for variable sequence length
        dynamic_axes = {
            "input_ids": {0: "batch_size", 1: "seq_len"},
            "attention_mask": {0: "batch_size", 1: "seq_len"},
            "logits": {0: "batch_size", 1: "seq_len"},
        }

        with torch.no_grad():
            torch.onnx.export(
                wrapper,
                (dummy_input_ids, dummy_attention_mask),
                onnx_path,
                opset_version=opset_version,
                input_names=["input_ids", "attention_mask"],
                output_names=["logits"],
                dynamic_axes=dynamic_axes,
                do_constant_folding=True,
                verbose=False,
            )

    # Verify the file was created
    if not os.path.exists(onnx_path):
        raise RuntimeError(f"ONNX export failed: file not found at {onnx_path}")

    file_size_mb = os.path.getsize(onnx_path) / (1024 * 1024)
    logger.info(f"ONNX export complete: {onnx_path} ({file_size_mb:.1f} MB)")

    return onnx_path


# =============================================================================
# ONNX Quantization
# =============================================================================

def quantize_onnx_model(
    onnx_path: str,
    output_dir: str,
    quant_format: str = "int8",
    per_channel: bool = True,
    weight_only: bool = True,
) -> str:
    """
    Apply quantization to the ONNX model for smaller size and faster inference.

    Args:
        onnx_path: Path to the original ONNX model
        output_dir: Directory to save the quantized model
        quant_format: Quantization format ("int8" or "uint8")
        per_channel: Use per-channel quantization
        weight_only: Quantize weights only (faster inference)

    Returns:
        Path to the quantized ONNX model
    """
    try:
        from onnxruntime.quantization import quantize_dynamic, QuantType
    except ImportError:
        logger.error("onnxruntime not installed. Cannot quantize. "
                      "Install with: pip install onnxruntime")
        return onnx_path

    os.makedirs(output_dir, exist_ok=True)
    quantized_path = os.path.join(output_dir, "arthsathi_quantized.onnx")

    logger.info("Quantizing ONNX model...")
    logger.info(f"  Input: {onnx_path}")
    logger.info(f"  Format: {quant_format}")
    logger.info(f"  Per-channel: {per_channel}")
    logger.info(f"  Weight-only: {weight_only}")

    # Map format string to QuantType
    quant_type_map = {
        "int8": QuantType.QInt8,
        "uint8": QuantType.QUInt8,
    }
    quant_type = quant_type_map.get(quant_format.lower(), QuantType.QInt8)

    try:
        quantize_dynamic(
            model_input=onnx_path,
            model_output=quantized_path,
            weight_type=quant_type,
            per_channel=per_channel,
            reduce_range=False,
            op_types_to_quantize=None if not weight_only else [
                "MatMul", "Gemm", "Conv",
            ],
        )
    except Exception as e:
        logger.warning(f"Quantization failed: {e}. Using unquantized model.")
        shutil.copy2(onnx_path, quantized_path)
        return quantized_path

    # Verify and report
    if os.path.exists(quantized_path):
        original_size_mb = os.path.getsize(onnx_path) / (1024 * 1024)
        quantized_size_mb = os.path.getsize(quantized_path) / (1024 * 1024)
        compression_ratio = original_size_mb / quantized_size_mb if quantized_size_mb > 0 else 0

        logger.info(f"Quantization complete:")
        logger.info(f"  Original size:   {original_size_mb:.1f} MB")
        logger.info(f"  Quantized size:  {quantized_size_mb:.1f} MB")
        logger.info(f"  Compression:     {compression_ratio:.2f}x")
    else:
        logger.error("Quantized model file not found. Using original.")
        quantized_path = onnx_path

    return quantized_path


# =============================================================================
# ONNX Verification
# =============================================================================

def verify_onnx_model(
    onnx_path: str,
    model,
    tokenizer,
    atol: float = 1e-3,
    rtol: float = 1e-2,
) -> bool:
    """
    Verify that the ONNX model produces outputs matching the PyTorch model.

    Args:
        onnx_path: Path to the ONNX model
        model: The original PyTorch model
        tokenizer: The tokenizer
        atol: Absolute tolerance for comparison
        rtol: Relative tolerance for comparison

    Returns:
        True if outputs match within tolerance, False otherwise
    """
    import numpy as np
    import onnxruntime as ort
    import torch

    logger.info("Verifying ONNX model outputs against PyTorch model...")
    logger.info(f"  ONNX model: {onnx_path}")
    logger.info(f"  Tolerance: atol={atol}, rtol={rtol}")

    # Create a test input
    test_text = "What are the tax benefits under Section 80C for FY 2024-25?"
    inputs = tokenizer(test_text, return_tensors="pt", truncation=True, max_length=128)
    input_ids = inputs["input_ids"]
    attention_mask = inputs["attention_mask"]

    # --- PyTorch inference ---
    model.eval()
    with torch.no_grad():
        pt_outputs = model(input_ids=input_ids, attention_mask=attention_mask)
        pt_logits = pt_outputs.logits.numpy()

    # --- ONNX Runtime inference ---
    session_options = ort.SessionOptions()
    session_options.graph_optimization_level = ort.GraphOptimizationLevel.ORT_ENABLE_ALL

    try:
        session = ort.InferenceSession(onnx_path, session_options)
    except Exception as e:
        logger.error(f"Failed to load ONNX model for verification: {e}")
        return False

    ort_inputs = {
        "input_ids": input_ids.numpy(),
        "attention_mask": attention_mask.numpy(),
    }

    try:
        ort_outputs = session.run(None, ort_inputs)
        ort_logits = ort_outputs[0]
    except Exception as e:
        logger.error(f"ONNX Runtime inference failed: {e}")
        return False

    # --- Compare outputs ---
    logger.info(f"  PyTorch output shape: {pt_logits.shape}")
    logger.info(f"  ONNX output shape:    {ort_logits.shape}")

    if pt_logits.shape != ort_logits.shape:
        logger.error(f"Shape mismatch: PyTorch {pt_logits.shape} vs ONNX {ort_logits.shape}")
        return False

    # Check if outputs are close
    max_diff = np.max(np.abs(pt_logits - ort_logits))
    mean_diff = np.mean(np.abs(pt_logits - ort_logits))

    is_close = np.allclose(pt_logits, ort_logits, atol=atol, rtol=rtol)

    logger.info(f"  Max absolute difference:  {max_diff:.6f}")
    logger.info(f"  Mean absolute difference: {mean_diff:.6f}")

    if is_close:
        logger.info("  ✓ ONNX model outputs match PyTorch model within tolerance")
    else:
        logger.warning("  ✗ ONNX model outputs differ from PyTorch model")
        logger.warning(f"    Max diff ({max_diff:.6f}) exceeds tolerance (atol={atol})")
        logger.warning("    This may be acceptable for quantized models but verify downstream quality.")

    return is_close


# =============================================================================
# Export Metadata
# =============================================================================

def save_export_metadata(
    output_dir: str,
    onnx_path: str,
    quantized_path: Optional[str],
    base_model: str,
    adapter_path: str,
    verification_passed: bool,
) -> None:
    """Save metadata about the exported model."""
    metadata = {
        "model_name": "ArthSathi",
        "base_model": base_model,
        "adapter_path": adapter_path,
        "onnx_path": onnx_path,
        "quantized_path": quantized_path,
        "verification_passed": verification_passed,
        "timestamp": time.strftime("%Y-%m-%d %H:%M:%S"),
    }

    # Add file sizes
    for key, path in [("onnx_size_mb", onnx_path), ("quantized_size_mb", quantized_path)]:
        if path and os.path.exists(path):
            metadata[key] = round(os.path.getsize(path) / (1024 * 1024), 2)

    metadata_path = os.path.join(output_dir, "export_metadata.json")
    with open(metadata_path, "w") as f:
        json.dump(metadata, f, indent=2)

    logger.info(f"Export metadata saved to {metadata_path}")


# =============================================================================
# Mobile Optimization
# =============================================================================

def optimize_for_mobile(onnx_path: str, output_dir: str) -> Optional[str]:
    """
    Apply mobile-specific optimizations to the ONNX model.

    Uses onnxruntime-tools for mobile optimization if available.
    """
    try:
        from onnxruntime_tools import optimizer

        logger.info("Applying mobile optimizations...")
        optimized_model = optimizer.optimize_model(
            onnx_path,
            model_type="bert",  # Closest to causal LM for optimization
        )

        mobile_path = os.path.join(output_dir, "arthsathi_mobile.onnx")
        optimized_model.save_model_to_file(mobile_path)

        if os.path.exists(mobile_path):
            size_mb = os.path.getsize(mobile_path) / (1024 * 1024)
            logger.info(f"Mobile-optimized model saved: {mobile_path} ({size_mb:.1f} MB)")
            return mobile_path
    except ImportError:
        logger.info("onnxruntime-tools not available. Skipping mobile optimization.")
        logger.info("  Install with: pip install onnxruntime-tools")
    except Exception as e:
        logger.warning(f"Mobile optimization failed: {e}")

    return None


# =============================================================================
# Main
# =============================================================================

def main():
    parser = argparse.ArgumentParser(
        description="ArthSathi: Export fine-tuned model to ONNX for on-device deployment"
    )
    parser.add_argument(
        "--config", type=str, default="config.yaml",
        help="Path to configuration YAML file"
    )
    parser.add_argument(
        "--skip_quantization", action="store_true",
        help="Skip ONNX quantization step"
    )
    parser.add_argument(
        "--skip_verification", action="store_true",
        help="Skip output verification step"
    )
    parser.add_argument(
        "--skip_mobile", action="store_true",
        help="Skip mobile optimization step"
    )
    args = parser.parse_args()

    # Load configuration
    config = load_config(args.config)
    export_config = config["export"]

    # -------------------------------------------------------------------
    # Step 1: Load and merge model
    # -------------------------------------------------------------------
    logger.info("=" * 60)
    logger.info("STEP 1: Loading and merging model")
    logger.info("=" * 60)

    output_dir = export_config["output_dir"]
    model, tokenizer = load_and_merge_model(
        adapter_path=export_config["adapter_path"],
        base_model=export_config["base_model"],
        output_dir=output_dir,
    )

    # -------------------------------------------------------------------
    # Step 2: Export to ONNX
    # -------------------------------------------------------------------
    logger.info("=" * 60)
    logger.info("STEP 2: Exporting model to ONNX format")
    logger.info("=" * 60)

    onnx_path = export_to_onnx(
        model=model,
        tokenizer=tokenizer,
        output_dir=output_dir,
        opset_version=export_config.get("opset_version", 17),
        use_dynamo_export=export_config.get("use_dynamo_export", False),
    )

    # -------------------------------------------------------------------
    # Step 3: Quantize (optional)
    # -------------------------------------------------------------------
    quantized_path = onnx_path
    quant_config = export_config.get("quantization", {})

    if not args.skip_quantization and quant_config.get("enabled", True):
        logger.info("=" * 60)
        logger.info("STEP 3: Quantizing ONNX model")
        logger.info("=" * 60)

        quantized_path = quantize_onnx_model(
            onnx_path=onnx_path,
            output_dir=output_dir,
            quant_format=quant_config.get("format", "int8"),
            per_channel=quant_config.get("per_channel", True),
            weight_only=quant_config.get("weight_only", True),
        )
    else:
        logger.info("STEP 3: Skipping quantization (--skip_quantization or disabled in config)")

    # -------------------------------------------------------------------
    # Step 4: Verify outputs
    # -------------------------------------------------------------------
    verification_passed = False
    if not args.skip_verification and export_config.get("verify_outputs", True):
        logger.info("=" * 60)
        logger.info("STEP 4: Verifying ONNX model outputs")
        logger.info("=" * 60)

        verify_path = quantized_path if quantized_path != onnx_path else onnx_path
        verification_passed = verify_onnx_model(
            onnx_path=verify_path,
            model=model,
            tokenizer=tokenizer,
            atol=export_config.get("atol", 1e-3),
            rtol=export_config.get("rtol", 1e-2),
        )
    else:
        logger.info("STEP 4: Skipping verification (--skip_verification or disabled in config)")

    # -------------------------------------------------------------------
    # Step 5: Mobile optimization (optional)
    # -------------------------------------------------------------------
    if not args.skip_mobile and export_config.get("optimize_for_mobile", True):
        logger.info("=" * 60)
        logger.info("STEP 5: Mobile optimization")
        logger.info("=" * 60)

        mobile_path = optimize_for_mobile(quantized_path, output_dir)
        if mobile_path:
            logger.info(f"Mobile model available at: {mobile_path}")
    else:
        logger.info("STEP 5: Skipping mobile optimization")

    # -------------------------------------------------------------------
    # Step 6: Save metadata and summary
    # -------------------------------------------------------------------
    logger.info("=" * 60)
    logger.info("STEP 6: Saving export metadata")
    logger.info("=" * 60)

    save_export_metadata(
        output_dir=output_dir,
        onnx_path=onnx_path,
        quantized_path=quantized_path if quantized_path != onnx_path else None,
        base_model=export_config["base_model"],
        adapter_path=export_config["adapter_path"],
        verification_passed=verification_passed,
    )

    # Print summary
    print("\n" + "=" * 60)
    print("  ArthSathi ONNX Export Summary")
    print("=" * 60)
    print(f"  Merged model:    {os.path.join(output_dir, 'merged_model')}")
    print(f"  ONNX model:      {onnx_path}")

    onnx_size = os.path.getsize(onnx_path) / (1024 * 1024)
    print(f"  ONNX size:       {onnx_size:.1f} MB")

    if quantized_path != onnx_path:
        quant_size = os.path.getsize(quantized_path) / (1024 * 1024)
        print(f"  Quantized model: {quantized_path}")
        print(f"  Quantized size:  {quant_size:.1f} MB")

    print(f"  Verification:    {'PASSED ✓' if verification_passed else 'SKIPPED/FAILED ✗'}")
    print("=" * 60)
    print("\nDeployment notes:")
    print("  - For Android: Use onnxruntime-android with the quantized model")
    print("  - For iOS:     Convert ONNX to CoreML using onnx-coreml")
    print("  - For Edge:    Use onnxruntime with the quantized model directly")
    print("=" * 60)


if __name__ == "__main__":
    main()
