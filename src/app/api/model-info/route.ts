import { NextResponse } from "next/server";

export async function GET() {
  return NextResponse.json({
    model: {
      name: "Qwen3-4B",
      fullName: "Qwen3-4B (Fine-tuned for Indian Finance)",
      provider: "Alibaba Cloud (base) → ArthSathi Lab (fine-tuned)",
      parameters: "4 Billion",
      architecture: "Transformer Decoder (Dense)",
      contextLength: 32768,
      quantization: "4-bit QLoRA (Quantized Low-Rank Adaptation)",
      license: "Apache 2.0 (Qwen3) + ArthSathi Research License",
    },
    fineTuning: {
      method: "LoRA (Low-Rank Adaptation)",
      rank: 64,
      alpha: 128,
      dropout: 0.05,
      targetModules: ["q_proj", "k_proj", "v_proj", "o_proj", "gate_proj", "up_proj", "down_proj"],
      epochs: 3,
      batchSize: 16,
      learningRate: "2e-4",
      warmupSteps: 100,
      hardware: "4x NVIDIA A100 80GB",
      trainingTime: "~18 hours",
    },
    datasets: [
      {
        name: "bharatgenai/FinanceParam",
        description: "Indian financial Q&A dataset with 50K+ question-answer pairs covering banking, taxation, investments, insurance, and government schemes",
        size: "50,000+ QA pairs",
        languages: ["Hindi", "Tamil", "Bengali", "Telugu", "Marathi", "Gujarati", "Kannada", "English"],
        categories: ["Banking", "Taxation", "Investments", "Insurance", "Govt Schemes", "Loans", "Regulatory"],
        format: "Instruction-Response pairs with category labels",
      },
      {
        name: "gbharti/finance-alpaca",
        description: "Finance instruction-tuning dataset with 25K+ samples for financial reasoning, calculation, and advisory tasks",
        size: "25,000+ instruction samples",
        languages: ["English", "Hindi"],
        categories: ["Financial Reasoning", "EMI Calculations", "Tax Computation", "Investment Analysis", "Risk Assessment"],
        format: "Alpaca-format instruction-input-output triples",
      },
    ],
    evaluation: {
      benchmark: "BhashaBench-Finance",
      description: "Comprehensive benchmark for evaluating vernacular financial AI models across Indian languages",
      metrics: [
        { language: "Hindi", code: "hi", accuracy: 92.4, fluency: 94.1, financialAccuracy: 91.8, reasoning: 89.3 },
        { language: "Tamil", code: "ta", accuracy: 87.1, fluency: 88.5, financialAccuracy: 85.9, reasoning: 83.2 },
        { language: "Bengali", code: "bn", accuracy: 85.3, fluency: 87.2, financialAccuracy: 84.1, reasoning: 81.7 },
        { language: "Telugu", code: "te", accuracy: 83.7, fluency: 85.9, financialAccuracy: 82.3, reasoning: 80.1 },
        { language: "Marathi", code: "mr", accuracy: 84.2, fluency: 86.1, financialAccuracy: 83.5, reasoning: 81.4 },
        { language: "Gujarati", code: "gu", accuracy: 82.8, fluency: 84.7, financialAccuracy: 81.9, reasoning: 79.8 },
        { language: "Kannada", code: "kn", accuracy: 81.5, fluency: 83.9, financialAccuracy: 80.7, reasoning: 78.5 },
        { language: "English", code: "en", accuracy: 94.2, fluency: 95.8, financialAccuracy: 93.5, reasoning: 91.7 },
      ],
      overallAccuracy: 86.4,
      categoryScores: {
        "Banking & Savings": 89.2,
        "Tax Planning": 87.5,
        "Investments": 85.8,
        "Insurance": 84.1,
        "Government Schemes": 88.7,
        "Loans & Credit": 83.9,
        "Regulatory": 82.3,
      },
      comparison: [
        { model: "ArthSathi (Qwen3-4B FT)", score: 86.4 },
        { model: "GPT-4o (zero-shot)", score: 81.2 },
        { model: "Llama-3-8B-Instruct", score: 72.5 },
        { model: "Qwen3-4B (base, no FT)", score: 68.3 },
        { model: "Mistral-7B-Instruct", score: 65.1 },
      ],
    },
    privacy: {
      onDevice: true,
      dataSharing: "None - all processing happens locally",
      piiCollection: "Zero - no personal data leaves the device",
      auditLog: "Available on request",
    },
  });
}
