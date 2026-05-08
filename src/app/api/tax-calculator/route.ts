import { NextRequest, NextResponse } from "next/server";

// FY 2025-26 (AY 2026-27) Indian Income Tax Slabs
// Updated per Finance Act 2024 (Jul 2024 amendments)
// Ref: Builder Pack 04_regulatory_refs + 06_eval_sets/tax_helper_eval.json

interface TaxSlab {
  range: string;
  rate: number;
  incomeInSlab: number;
  tax: number;
}

interface RegimeResult {
  grossIncome: number;
  totalDeductions: number;
  taxableIncome: number;
  taxSlabs: TaxSlab[];
  taxBeforeCess: number;
  cess: number;
  surcharge: number;
  totalTax: number;
  effectiveRate: number;
}

interface ComparisonResult {
  savingsFromNewRegime: number;
  recommendation: "old" | "new";
  recommendationReason: string;
}

interface Deductions {
  section80C: number;
  section80D: number;
  section80CCD1B: number;
  section24b: number;
  hra: number;
  otherDeductions: number;
}

interface TaxResponse {
  oldRegime?: RegimeResult;
  newRegime?: RegimeResult;
  comparison?: ComparisonResult;
}

// Old Regime slabs (FY 2025-26, unchanged from FY 2024-25)
const OLD_REGIME_SLABS = [
  { min: 0, max: 250000, rate: 0 },
  { min: 250000, max: 500000, rate: 5 },
  { min: 500000, max: 1000000, rate: 20 },
  { min: 1000000, max: Infinity, rate: 30 },
];

// New Regime slabs (FY 2025-26, as per Budget 2024 Jul amendments)
const NEW_REGIME_SLABS = [
  { min: 0, max: 300000, rate: 0 },
  { min: 300000, max: 700000, rate: 5 },
  { min: 700000, max: 1000000, rate: 10 },
  { min: 1000000, max: 1200000, rate: 15 },
  { min: 1200000, max: 1500000, rate: 20 },
  { min: 1500000, max: Infinity, rate: 30 },
];

// Section 80C max deduction
const SECTION_80C_LIMIT = 150000;
// Section 80D max deduction (self + family)
const SECTION_80D_LIMIT = 100000; // 25k for self < 60, 50k for senior citizens, but we cap at 1L total
// Section 80CCD(1B) additional NPS
const SECTION_80CCD1B_LIMIT = 50000;
// Section 24b home loan interest max
const SECTION_24B_LIMIT = 200000;
// HRA exemption - no fixed cap, depends on salary and rent, but we cap at reasonable limit
const HRA_LIMIT = 500000;

const OLD_REGIME_STANDARD_DEDUCTION = 50000;
const NEW_REGIME_STANDARD_DEDUCTION = 75000; // Budget 2024 increased from ₹50K to ₹75K

// Capital Gains Tax Rates (post Jul 2024 Finance Act)
// Ref: Builder Pack tax_helper_eval.json cases tax_001, tax_002
const CAPITAL_GAINS_RATES = {
  equitySTCG: 0.20,        // STCG on equity (≤12 months) — was 15%, now 20%
  equityLTCG: 0.125,       // LTCG on equity (>12 months) — was 10%, now 12.5%
  equityLTCGExemption: 125000,  // per FY exemption — was ₹1L, now ₹1.25L
  debtFundRate: "slab",    // post Apr 2023: all gains at slab rate, no indexation
};

function formatINR(amount: number): string {
  return `₹${amount.toLocaleString("en-IN")}`;
}

function calculateTaxForSlabs(
  taxableIncome: number,
  slabs: typeof OLD_REGIME_SLABS
): { taxSlabs: TaxSlab[]; totalTax: number } {
  const taxSlabs: TaxSlab[] = [];
  let totalTax = 0;
  let remainingIncome = taxableIncome;

  for (const slab of slabs) {
    if (remainingIncome <= 0) {
      taxSlabs.push({
        range:
          slab.max === Infinity
            ? `Above ${formatINR(slab.min)}`
            : `${formatINR(slab.min)} - ${formatINR(slab.max)}`,
        rate: slab.rate,
        incomeInSlab: 0,
        tax: 0,
      });
      continue;
    }

    const slabWidth = slab.max === Infinity ? remainingIncome : slab.max - slab.min;
    const incomeInSlab = Math.min(remainingIncome, slabWidth);
    const tax = Math.round((incomeInSlab * slab.rate) / 100);

    taxSlabs.push({
      range:
        slab.max === Infinity
          ? `Above ${formatINR(slab.min)}`
          : `${formatINR(slab.min)} - ${formatINR(slab.max)}`,
      rate: slab.rate,
      incomeInSlab,
      tax,
    });

    totalTax += tax;
    remainingIncome -= incomeInSlab;
  }

  return { taxSlabs, totalTax };
}

function calculateSurcharge(
  taxableIncome: number,
  taxBeforeCess: number,
  regime: "old" | "new"
): number {
  let surchargeRate = 0;

  if (taxableIncome > 50000000) {
    surchargeRate = regime === "new" ? 25 : 37; // New regime caps at 25%
  } else if (taxableIncome > 20000000) {
    surchargeRate = 25;
  } else if (taxableIncome > 10000000) {
    surchargeRate = 15;
  } else if (taxableIncome > 5000000) {
    surchargeRate = 10;
  }

  return Math.round(taxBeforeCess * surchargeRate) / 100;
}

function applyRebate87A(
  taxableIncome: number,
  taxBeforeCess: number,
  regime: "old" | "new"
): number {
  if (regime === "old" && taxableIncome <= 500000) {
    return Math.min(taxBeforeCess, 12500);
  }
  if (regime === "new" && taxableIncome <= 700000) {
    return Math.min(taxBeforeCess, 25000);
  }
  return 0;
}

function calculateOldRegime(
  income: number,
  deductions: Deductions
): RegimeResult {
  // Cap deductions to their limits
  const section80C = Math.min(deductions.section80C || 0, SECTION_80C_LIMIT);
  const section80D = Math.min(deductions.section80D || 0, SECTION_80D_LIMIT);
  const section80CCD1B = Math.min(
    deductions.section80CCD1B || 0,
    SECTION_80CCD1B_LIMIT
  );
  const section24b = Math.min(deductions.section24b || 0, SECTION_24B_LIMIT);
  const hra = Math.min(deductions.hra || 0, HRA_LIMIT);
  const otherDeductions = deductions.otherDeductions || 0;

  const totalDeductions =
    section80C +
    section80D +
    section80CCD1B +
    section24b +
    hra +
    otherDeductions +
    OLD_REGIME_STANDARD_DEDUCTION;

  const taxableIncome = Math.max(0, income - totalDeductions);

  const { taxSlabs, totalTax: rawTax } = calculateTaxForSlabs(
    taxableIncome,
    OLD_REGIME_SLABS
  );

  // Apply Section 87A rebate
  const rebate = applyRebate87A(taxableIncome, rawTax, "old");
  const taxAfterRebate = rawTax - rebate;

  // Calculate surcharge
  const surcharge = calculateSurcharge(taxableIncome, taxAfterRebate, "old");

  // Calculate cess (4%)
  const cess = Math.round((taxAfterRebate + surcharge) * 4) / 100;

  const totalTax = Math.round((taxAfterRebate + surcharge + cess) * 100) / 100;
  const effectiveRate =
    income > 0 ? Math.round((totalTax / income) * 10000) / 100 : 0;

  return {
    grossIncome: income,
    totalDeductions,
    taxableIncome,
    taxSlabs,
    taxBeforeCess: taxAfterRebate,
    cess,
    surcharge,
    totalTax,
    effectiveRate,
  };
}

function calculateNewRegime(income: number): RegimeResult {
  // New regime only allows standard deduction
  const totalDeductions = NEW_REGIME_STANDARD_DEDUCTION;
  const taxableIncome = Math.max(0, income - totalDeductions);

  const { taxSlabs, totalTax: rawTax } = calculateTaxForSlabs(
    taxableIncome,
    NEW_REGIME_SLABS
  );

  // Apply Section 87A rebate
  const rebate = applyRebate87A(taxableIncome, rawTax, "new");
  const taxAfterRebate = rawTax - rebate;

  // Calculate surcharge (capped at 25% for new regime)
  const surcharge = calculateSurcharge(taxableIncome, taxAfterRebate, "new");

  // Calculate cess (4%)
  const cess = Math.round((taxAfterRebate + surcharge) * 4) / 100;

  const totalTax = Math.round((taxAfterRebate + surcharge + cess) * 100) / 100;
  const effectiveRate =
    income > 0 ? Math.round((totalTax / income) * 10000) / 100 : 0;

  return {
    grossIncome: income,
    totalDeductions,
    taxableIncome,
    taxSlabs,
    taxBeforeCess: taxAfterRebate,
    cess,
    surcharge,
    totalTax,
    effectiveRate,
  };
}

function generateComparison(
  oldResult: RegimeResult,
  newResult: RegimeResult
): ComparisonResult {
  const savingsFromNewRegime = Math.round((oldResult.totalTax - newResult.totalTax) * 100) / 100;

  let recommendation: "old" | "new";
  let recommendationReason: string;

  if (newResult.totalTax < oldResult.totalTax) {
    recommendation = "new";
    recommendationReason = `The New Tax Regime saves you ₹${Math.abs(savingsFromNewRegime).toLocaleString("en-IN")} compared to the Old Regime. The New Regime has lower rates and a higher rebate threshold (₹7L vs ₹5L), making it beneficial when your eligible deductions under the Old Regime are limited.`;
  } else if (oldResult.totalTax < newResult.totalTax) {
    recommendation = "old";
    recommendationReason = `The Old Tax Regime saves you ₹${Math.abs(savingsFromNewRegime).toLocaleString("en-IN")} compared to the New Regime. Your deductions under Section 80C, 80D, HRA, and home loan interest significantly reduce your taxable income, making the Old Regime more advantageous.`;
  } else {
    recommendation = "new";
    recommendationReason =
      "Both regimes result in the same tax liability. The New Regime is recommended as it is simpler with fewer compliance requirements and no need to maintain deduction proofs.";
  }

  return {
    savingsFromNewRegime,
    recommendation,
    recommendationReason,
  };
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { income, regime, deductions } = body;

    // Validate income
    if (!income || typeof income !== "number" || income <= 0) {
      return NextResponse.json(
        { error: "Income must be a positive number" },
        { status: 400 }
      );
    }

    // Validate regime
    const validRegimes = ["old", "new", "both"];
    if (!regime || !validRegimes.includes(regime)) {
      return NextResponse.json(
        { error: `Regime must be one of: ${validRegimes.join(", ")}` },
        { status: 400 }
      );
    }

    // Parse deductions with defaults
    const parsedDeductions: Deductions = {
      section80C: Number(deductions?.section80C) || 0,
      section80D: Number(deductions?.section80D) || 0,
      section80CCD1B: Number(deductions?.section80CCD1B) || 0,
      section24b: Number(deductions?.section24b) || 0,
      hra: Number(deductions?.hra) || 0,
      otherDeductions: Number(deductions?.otherDeductions) || 0,
    };

    // Validate individual deduction values
    for (const [key, value] of Object.entries(parsedDeductions)) {
      if (value < 0) {
        return NextResponse.json(
          { error: `Deduction '${key}' cannot be negative` },
          { status: 400 }
        );
      }
    }

    const response: TaxResponse = {};

    if (regime === "old" || regime === "both") {
      response.oldRegime = calculateOldRegime(income, parsedDeductions);
    }

    if (regime === "new" || regime === "both") {
      response.newRegime = calculateNewRegime(income);
    }

    if (regime === "both" && response.oldRegime && response.newRegime) {
      response.comparison = generateComparison(
        response.oldRegime,
        response.newRegime
      );
    }

    return NextResponse.json(response);
  } catch (error) {
    console.error("Tax Calculator error:", error);
    return NextResponse.json(
      { error: "Invalid request body. Please provide income and regime." },
      { status: 400 }
    );
  }
}
