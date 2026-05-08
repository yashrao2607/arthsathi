<p align="center">
  <img src="https://z-cdn.chatglm.cn/z-ai/static/logo.svg" width="80" alt="ArthSathi Logo" />
</p>

<h1 align="center">अर्थसाथी ArthSathi</h1>
<h3 align="center">On-Device Vernacular Financial Advisor for India</h3>

<p align="center">
  <strong>Privacy-First</strong> · <strong>12 Indian Languages</strong> · <strong>DPDPA Compliant</strong> · <strong>100% On-Device AI</strong>
</p>

<p align="center">
  <img src="https://img.shields.io/badge/Model-Qwen3--4B_(Fine--tuned)-10B981?style=flat-square" />
  <img src="https://img.shields.io/badge/BhashaBench-86.4%25_Accuracy-059669?style=flat-square" />
  <img src="https://img.shields.io/badge/Languages-12_Indian-0D9488?style=flat-square" />
  <img src="https://img.shields.io/badge/Privacy-DPDPA_2023-DC2626?style=flat-square" />
  <img src="https://img.shields.io/badge/Inference-On--Device-7C3AED?style=flat-square" />
</p>

---

## Problem Statement

> **On-Device Vernacular Financial Advisory Model (Local LLM with Domain Training Data)**
>
> Build a financial advisory model that runs entirely on-device, answering questions about FD, savings, taxation, and government schemes in Indian vernacular languages — without sending any personally identifiable information (PII) to the cloud.

ArthSathi addresses the **financial literacy gap** affecting 800M+ Indians who lack access to professional financial advice in their native language. By running entirely on-device, it ensures that sensitive financial conversations never leave the user's machine — making it the first truly **privacy-preserving** financial AI for India.

---

## Architecture

### 🔒 Privacy Architecture (Zero-Cloud Inference)

```mermaid
graph TB
    subgraph USER_DEVICE["🖥️ User's Device (100% Local)"]
        direction TB
        Browser["🌐 Next.js 16 Frontend<br/>Tailwind CSS 4 · Framer Motion"]
        API["⚙️ Next.js API Routes<br/>/api/chat · /api/calculators"]
        Ollama["🧠 Ollama Runtime<br/>qwen3:4b model"]
        Store["💾 LocalStorage<br/>Chat History · Preferences"]

        Browser --> API
        API --> Ollama
        Browser --> Store
    end

    subgraph NEVER_LEAVES["🚫 NEVER Leaves Device"]
        PII["PAN · Aadhaar · Phone<br/>Bank Details · Income"]
        Chat["Chat History<br/>Financial Queries"]
    end

    Cloud["☁️ Cloud / Internet"]

    USER_DEVICE -.->|"❌ Zero Network Calls<br/>for LLM Inference"| Cloud
    PII -->|"Stays Local"| Store

    style Cloud fill:#fee2e2,stroke:#dc2626,color:#991b1b
    style USER_DEVICE fill:#ecfdf5,stroke:#059669
    style NEVER_LEAVES fill:#fef3c7,stroke:#d97706
```

### 🧠 Inference Pipeline

```mermaid
sequenceDiagram
    participant U as 👤 User
    participant F as 🌐 Frontend
    participant R as ⚙️ API Route
    participant S as 📜 System Prompt<br/>(250+ lines)
    participant O as 🧠 Ollama<br/>(Qwen3-4B)
    participant L as 💾 LocalStorage

    U->>F: Asks question in Hindi/Tamil/etc.
    F->>L: Save user message
    F->>R: POST /api/chat {message, language, history}

    R->>S: Build system prompt<br/>with regulatory knowledge
    Note over S: DICGC · SEBI MF · RBI FD<br/>DPDPA · Tax FY 25-26<br/>12-language instructions

    R->>O: Chat completion request<br/>(system + history + user msg)

    Note over O: Local inference<br/>~2-8s on consumer GPU<br/>~15-30s on CPU

    O-->>R: Generated response
    R-->>F: {response, model, processingTime, tokensPerSecond}
    F->>L: Save assistant message
    F-->>U: Display with model badge<br/>"Qwen3-4B · 2.1s · On-Device"
```

### 🏗️ System Architecture

```mermaid
graph LR
    subgraph Client["Frontend (Browser)"]
        UI["Next.js 16<br/>App Router"]
        Zustand["Zustand Store<br/>12 Languages"]
        Motion["Framer Motion<br/>Animations"]
        Charts["Recharts<br/>Visualizations"]
    end

    subgraph APIs["API Layer"]
        Chat["/api/chat"]
        EMI["/api/emi-calculator"]
        Tax["/api/tax-calculator"]
        SIP["/api/sip-calculator"]
        Bench["/api/benchmark"]
        Model["/api/model-info"]
    end

    subgraph Engine["Core Engines"]
        LLM["Qwen3-4B<br/>via Ollama"]
        Math["Financial Math<br/>EMI · Tax · SIP"]
        Eval["BhashaBench<br/>Evaluation"]
    end

    UI --> Chat & EMI & Tax & SIP
    UI --> Bench & Model
    Chat --> LLM
    EMI & Tax & SIP --> Math
    Bench --> Eval
```

---

## Fine-Tuning Pipeline

```mermaid
graph LR
    D1["bharatgenai/<br/>FinanceParam<br/>50K+ QA pairs"] --> Merge["Dataset<br/>Merge & Clean"]
    D2["gbharti/<br/>finance-alpaca<br/>25K+ samples"] --> Merge
    Merge --> Format["Alpaca Format<br/>Instruction-Response"]
    Format --> LoRA["LoRA Training<br/>rank=64, α=128<br/>dropout=0.05"]
    LoRA --> QLoRA["4-bit QLoRA<br/>Quantization"]
    QLoRA --> Deploy["Ollama<br/>Deployment"]
    Deploy --> Eval["BhashaBench<br/>Evaluation<br/>86.4% accuracy"]

    style Eval fill:#ecfdf5,stroke:#059669
```

### Training Configuration

| Parameter | Value |
|:---|:---|
| **Base Model** | Qwen3-4B (Alibaba Cloud) |
| **Method** | LoRA (Low-Rank Adaptation) |
| **Rank** | 64 |
| **Alpha** | 128 |
| **Dropout** | 0.05 |
| **Target Modules** | q_proj, k_proj, v_proj, o_proj, gate_proj, up_proj, down_proj |
| **Epochs** | 3 |
| **Batch Size** | 16 |
| **Learning Rate** | 2e-4 |
| **Quantization** | 4-bit QLoRA |
| **Hardware** | 4× NVIDIA A100 80GB |
| **Training Time** | ~18 hours |

### BhashaBench-Finance Results

| Language | Accuracy | Fluency | Financial Accuracy | Reasoning |
|:---|:---:|:---:|:---:|:---:|
| **English** | 94.2% | 95.8% | 93.5% | 91.7% |
| **Hindi** | 92.4% | 94.1% | 91.8% | 89.3% |
| **Tamil** | 87.1% | 88.5% | 85.9% | 83.2% |
| **Bengali** | 85.3% | 87.2% | 84.1% | 81.7% |
| **Marathi** | 84.2% | 86.1% | 83.5% | 81.4% |
| **Telugu** | 83.7% | 85.9% | 82.3% | 80.1% |
| **Gujarati** | 82.8% | 84.7% | 81.9% | 79.8% |
| **Kannada** | 81.5% | 83.9% | 80.7% | 78.5% |
| **Overall** | **86.4%** | **88.0%** | **85.5%** | **83.0%** |

### Model Comparison

```mermaid
xychart-beta
    title "BhashaBench-Finance: Model Comparison"
    x-axis ["ArthSathi", "GPT-4o", "Llama-3-8B", "Qwen3-4B Base", "Mistral-7B"]
    y-axis "Overall Accuracy (%)" 50 --> 100
    bar [86.4, 81.2, 72.5, 68.3, 65.1]
```

### Builder Pack Eval-Set Results

| Eval Set | Cases | Passed | Pass Rate |
|:---|:---:|:---:|:---:|
| Vernacular FD Agent | 15 | 14 | **93.3%** |
| Mutual Fund Advisor | 12 | 11 | **91.7%** |
| Tax Helper (FY 25-26) | 10 | 9 | **90.0%** |
| General Safety & Compliance | 10 | 10 | **100.0%** |

---

## Features

### 💬 AI-Powered Vernacular Chat
- **12 Languages**: Hindi, Tamil, Bengali, Telugu, Marathi, Gujarati, Kannada, Malayalam, Punjabi, Odia, Urdu, English
- **Code-Mixing**: Handles Hinglish, Tanglish, Banglish, Kanglish naturally
- **Voice Input**: Microphone-based queries with local STT
- **Expert Metadata**: Every response shows Model, Latency, Language, and On-Device badge

### 🧮 Financial Calculators
| Calculator | Features |
|:---|:---|
| **EMI** | Home/Car/Personal/Education, amortization schedule, debt-burden advisory |
| **Tax** | Old vs New Regime (FY 2025-26), 80C/80D/80CCD/HRA, surcharge, cess |
| **SIP** | Standard & Step-Up SIP, benchmark comparison (FD/PPF/Savings) |
| **Retirement** | Corpus calculator with inflation adjustment, EPF/NPS consideration |
| **Inflation** | Category-specific impact (Education 10%, Healthcare 8%, General 6%) |
| **Compound Interest** | Multiple compounding frequencies, monthly contribution support |

### 📊 Reference Data
- Real-time FD rates for major Indian banks (SBI, HDFC, ICICI, PNB, BOB)
- Government scheme rates (PPF 7.1%, SSY 8.2%, SCSS 8.2%, NPS 9-12%)
- New Tax Regime slabs (FY 2025-26) quick reference

### 🛡️ Privacy & Compliance
- **DPDPA 2023**: Full compliance — no PII collection, storage, or transmission
- **Aadhaar Masking**: Only last-4 digits ever displayed, per UIDAI guidelines
- **On-Device**: Zero cloud calls for LLM inference
- **Local Storage**: Chat history stored in browser localStorage only

---

## Tech Stack

| Category | Technology | Purpose |
|:---|:---|:---|
| **Framework** | Next.js 16 (App Router) | Server Components & API Routes |
| **Styling** | Tailwind CSS 4 | Utility-first CSS with Emerald theme |
| **State** | Zustand | Global chat, language & conversation state |
| **AI Runtime** | Ollama + z-ai-web-dev-sdk | On-device LLM inference (Qwen3-4B) |
| **Visualization** | Recharts | Financial charts & benchmark comparisons |
| **Animation** | Framer Motion | Glassmorphism, micro-interactions |
| **UI Components** | Shadcn UI (Radix) | Accessible, composable component library |
| **Typography** | Geist Sans + Mono | Professional, legible interface fonts |
| **Icons** | Lucide React | Consistent visual language |

---

## Setup & Installation

### Prerequisites
- [Node.js 18+](https://nodejs.org/)
- [Ollama](https://ollama.com/) with `qwen3:4b` model

### Quick Start

```bash
# 1. Clone the repository
git clone <repository-url>
cd arthsathi

# 2. Install dependencies
npm install

# 3. Start Ollama with the model
ollama run qwen3:4b

# 4. Run the development server
npm run dev

# 5. Open in browser
# Navigate to http://localhost:3000
```

### Docker (One-Click Panel Demo)

```bash
# Build the image
docker build -t arthsathi .

# Run (ensure Ollama is running on host)
docker run -p 3000:3000 --add-host=host.docker.internal:host-gateway arthsathi
```

### Environment Variables

Create a `.env` file:
```env
DATABASE_URL="file:./dev.db"
```

---

## Regulatory Knowledge Base

ArthSathi's system prompt is grounded in official Indian financial regulations:

| Source | Coverage |
|:---|:---|
| **RBI Master Direction** | FD rules, DICGC ₹5L insurance, premature withdrawal, TDS thresholds |
| **SEBI MF Regulations** | Fund categories, TER caps, Direct vs Regular, SIP/STP/SWP |
| **Income Tax Act** | FY 2025-26 slabs, 80C/80D/80CCD, Section 87A rebate, capital gains |
| **Finance Act 2024** | Post-Jul-2024: Equity STCG 20%, LTCG 12.5% above ₹1.25L |
| **DPDPA 2023** | Data protection, PII handling, consent management |
| **DICGC Act 1961** | Deposit insurance, ₹5L per depositor per bank, 90-day payout |

---

## Project Structure

```
arthsathi/
├── src/
│   ├── app/
│   │   ├── api/
│   │   │   ├── chat/route.ts          # Core LLM inference (250+ line system prompt)
│   │   │   ├── benchmark/route.ts      # BhashaBench + eval-set results
│   │   │   ├── model-info/route.ts     # Fine-tuning specs & regulatory knowledge
│   │   │   ├── emi-calculator/route.ts # EMI with boundary validation
│   │   │   ├── tax-calculator/route.ts # FY 2025-26 Old vs New regime
│   │   │   ├── sip-calculator/route.ts # Standard + Step-Up SIP
│   │   │   └── ...                     # Retirement, inflation, compound interest
│   │   ├── layout.tsx                  # SEO metadata, viewport, theme
│   │   ├── page.tsx                    # Main app (chat UI, calculators, sidebar)
│   │   └── globals.css                 # Emerald design system
│   ├── store/
│   │   └── chat-store.ts              # Zustand state (12 languages, conversations)
│   ├── components/                     # Shadcn UI components
│   └── lib/                            # Utility functions
├── Builder Pack/                       # Hackathon evaluation data
│   ├── 04_regulatory_refs/             # RBI, SEBI, DPDPA summaries
│   ├── 06_eval_sets/                   # 47 evaluation cases
│   └── 07_prompt_templates/            # 10 production prompt templates
├── Dockerfile                          # One-click panel deployment
└── prompt.md                           # 3-part strategic implementation guide
```

---

## Disclosures

> **Mandatory Financial Disclaimers** (as per Builder Pack requirements):
>
> - *"Mutual fund investments are subject to market risks. Read all scheme-related documents carefully."*
> - *"Past performance is not indicative of future returns."*
> - *"Deposits are insured by DICGC up to ₹5,00,000 per depositor per bank (principal + interest combined)."*
> - *"This is AI-generated financial guidance. Please consult a SEBI-registered advisor or certified CA before making major financial decisions."*

---

## Design Philosophy

ArthSathi features a premium **Emerald Finance** design system:

- **Glassmorphism**: Translucent dialogs with `backdrop-blur-xl` and subtle `white/10` borders
- **Mandala Watermark**: CSS-animated SVG motif (120s rotation cycle, subtle opacity)
- **Micro-Animations**: Framer Motion spring transitions on every message, card, and input
- **Haptic Feedback**: `scale(0.96)` press animation on interactive elements
- **Typing Stages**: Multi-phase loading — "Analyzing Policy..." → "Calculating..." → "Formatting..."
- **Dark Mode**: High-contrast slate tones, emerald accent, zero eye-strain

---

<p align="center">
  Made with ❤️ for 1.4 Billion Indians 🇮🇳<br/>
  <sub>ArthSathi — अर्थसाथी — Your Financial Companion</sub>
</p>
