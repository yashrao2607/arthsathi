# ArthSathi (अर्थसाथी) Fine-Tuning Pipeline

> **ArthSathi** — your financial companion — is an Indian financial advisory AI fine-tuned from **Qwen3-4B** using QLoRA for domain-specific instruction following in Indian financial contexts.

---

## Overview

This pipeline fine-tunes Qwen3-4B on curated Indian finance datasets to create ArthSathi, a model that can:

- Answer questions about Indian tax regimes (old vs. new), deductions under Sections 80C–80U
- Explain mutual fund concepts (SIP, SWP, ELSS, NPS)
- Advise on insurance, fixed deposits, PPF, and savings schemes
- Provide RBI guideline summaries and SEBI regulation explanations
- Respond in English and Hindi (with Hinglish support)

### Architecture: QLoRA on Qwen3-4B

| Component       | Setting                                      |
| --------------- | -------------------------------------------- |
| Base Model      | Qwen/Qwen3-4B                               |
| Quantization    | 4-bit NF4 (BitsAndBytes)                    |
| LoRA Rank       | 64                                           |
| LoRA Alpha      | 128                                          |
| Target Modules  | q, k, v, o projections + gate, up, down proj |
| Max Seq Length   | 2048                                         |

---

## Directory Structure

```
fine-tuning/
├── README.md            # This documentation
├── config.yaml          # All hyperparameters and paths
├── requirements.txt     # Python dependencies
├── prepare_data.py      # Dataset download, cleaning, formatting
├── finetune.py          # QLoRA fine-tuning with SFTTrainer
├── evaluate.py          # Evaluation with BhashaBench-Finance metrics
└── export_onnx.py       # ONNX export + quantization for mobile
```

---

## Hardware Requirements

| Configuration     | GPU              | VRAM  | Training Time (est.) |
| ----------------- | ---------------- | ----- | -------------------- |
| **Minimum**       | 1× RTX 3090     | 24 GB | ~8 hours             |
| **Recommended**   | 1× A100 (40GB)  | 40 GB | ~4 hours             |
| **Optimal**       | 2× A100 (80GB)  | 80 GB | ~2 hours             |

- **Disk Space**: ~30 GB (datasets + model checkpoints + exports)
- **RAM**: 32 GB minimum, 64 GB recommended
- QLoRA 4-bit quantization reduces VRAM from ~16 GB (fp16) to ~6 GB for Qwen3-4B

---

## Quick Start

### 1. Install Dependencies

```bash
cd fine-tuning
python -m venv venv
source venv/bin/activate
pip install -r requirements.txt
```

### 2. Prepare the Dataset

```bash
python prepare_data.py --config config.yaml
```

This will:
- Download `bharatgenai/FinanceParam` and `gbharti/finance-alpaca` from HuggingFace
- Clean, deduplicate, and normalize the data
- Convert to instruction-tuning format with Indian finance system prompts
- Split into `train.jsonl`, `val.jsonl`, `test.jsonl` (90/5/5)
- Save to `./data/` (configurable in `config.yaml`)

### 3. Fine-Tune the Model

```bash
python finetune.py --config config.yaml
```

Optional overrides:
```bash
python finetune.py --config config.yaml --epochs 5 --lr 3e-4 --batch_size 2
```

This will:
- Load Qwen3-4B in 4-bit quantization
- Apply LoRA adapters with the configured parameters
- Train using SFTTrainer with gradient checkpointing
- Save checkpoints to `./checkpoints/` and the final adapter to `./output/`
- Log metrics to Weights & Biases (if configured)

### 4. Evaluate the Model

```bash
python evaluate.py --config config.yaml
```

This will:
- Load the fine-tuned model and the base Qwen3-4B
- Run inference on the test set
- Compute accuracy, BLEU, and ROUGE-L scores
- Generate a comparison table (base vs. fine-tuned)
- Save results to `./eval_results/results.json`

### 5. Export to ONNX

```bash
python export_onnx.py --config config.yaml
```

This will:
- Merge LoRA adapters with the base model
- Export the merged model to ONNX format
- Apply INT8 quantization for mobile deployment
- Verify that ONNX outputs match PyTorch outputs within tolerance
- Save to `./export/onnx/`

---

## Configuration

All settings are centralized in `config.yaml`. Key sections:

```yaml
model:
  name: "Qwen/Qwen3-4B"
  max_seq_length: 2048

lora:
  rank: 64
  alpha: 128
  dropout: 0.05
  target_modules: [q_proj, k_proj, v_proj, o_proj, gate_proj, up_proj, down_proj]

training:
  batch_size: 4
  gradient_accumulation_steps: 8
  learning_rate: 2.0e-4
  num_epochs: 3
  warmup_ratio: 0.1
```

See `config.yaml` for the full configuration.

---

## Datasets

### bharatgenai/FinanceParam
- Indian financial parameters, regulatory data, and domain-specific knowledge
- Covers tax slabs, RBI rates, SEBI guidelines, insurance frameworks
- ~2,500 instruction-response pairs

### gbharti/finance-alpaca
- General finance Q&A in Alpaca format
- Curated for Indian financial context
- ~15,000 instruction-response pairs

After cleaning and deduplication, expect ~12,000–14,000 high-quality training samples.

---

## System Prompt

All training samples are prefixed with the following system prompt:

```
You are ArthSathi (अर्थसाथी), an expert Indian financial advisor AI. You provide accurate,
helpful, and regulation-compliant financial guidance for Indian users. You are knowledgeable
about Indian tax laws (old and new regimes), mutual funds (SIP, SWP, ELSS), insurance,
fixed deposits, PPF, NPS, RBI guidelines, and SEBI regulations. You respond clearly in
English or Hindi as appropriate. Always include relevant disclaimers that this is not
professional financial advice. Use Indian numbering conventions (lakhs, crores) and
INR currency. When discussing taxes, reference current assessment year and applicable
sections of the Income Tax Act.
```

---

## Expected Results

| Metric              | Base Qwen3-4B | ArthSathi (Fine-tuned) | Δ       |
| ------------------- | -------------- | ---------------------- | ------- |
| Finance Accuracy    | ~42%           | ~78%                   | +36%    |
| BLEU (English)      | ~0.21          | ~0.52                  | +0.31   |
| BLEU (Hindi)        | ~0.15          | ~0.44                  | +0.29   |
| ROUGE-L (English)   | ~0.33          | ~0.68                  | +0.35   |
| ROUGE-L (Hindi)     | ~0.27          | ~0.59                  | +0.32   |
| India-Specific Acc. | ~28%           | ~82%                   | +54%    |

> *These are estimated targets based on similar QLoRA fine-tuning runs on Qwen-family models. Actual results will vary based on data quality and training convergence.*

---

## ONNX Export for On-Device Deployment

The exported ONNX model with INT8 quantization targets:

| Target          | Model Size | Inference Latency |
| --------------- | ---------- | ----------------- |
| Android (TFLite) | ~2.1 GB   | ~150 ms/token     |
| iOS (CoreML)    | ~2.3 GB    | ~120 ms/token     |
| Edge (ONNX RT)  | ~2.1 GB    | ~100 ms/token     |

---

## Troubleshooting

### OOM (Out of Memory) Errors
- Reduce `batch_size` to 2 and increase `gradient_accumulation_steps` to 16
- Enable `gradient_checkpointing: true` (default)
- Reduce `max_seq_length` to 1024

### Slow Training
- Ensure CUDA is available: `python -c "import torch; print(torch.cuda.is_available())"`
- Use `flash_attention_2` if your GPU supports it (Ampere+)
- Check disk I/O — use SSD for dataset and checkpoint storage

### Poor Evaluation Scores
- Increase training epochs (3 → 5)
- Lower learning rate (2e-4 → 1e-4)
- Increase LoRA rank (64 → 128)
- Add more domain-specific data

---

## License

This fine-tuning pipeline is provided for research and development purposes. The base model Qwen3-4B is subject to its own license terms. Generated financial advice should always be reviewed by certified financial professionals before dissemination.

---

## Acknowledgements

- **Qwen Team** — for the Qwen3-4B base model
- **BharatGenAI** — for the FinanceParam dataset
- **gbharti** — for the finance-alpaca dataset
- **HuggingFace** — for transformers, peft, trl, and datasets libraries
