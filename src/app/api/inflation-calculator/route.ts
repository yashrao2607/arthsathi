import { NextRequest, NextResponse } from "next/server";

// ---------------------------------------------------------------------------
// Inflation Calculator API
// POST /api/inflation-calculator
// Body: { currentAmount, inflationRate?, years, category? }
// Returns: future cost, purchasing power, yearly breakdown, tips
// ---------------------------------------------------------------------------

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

type InflationCategory =
  | "general"
  | "education"
  | "healthcare"
  | "real_estate"
  | "food";

interface InflationRequest {
  currentAmount: number;
  inflationRate?: number;
  years: number;
  category?: InflationCategory;
}

interface YearlyBreakdown {
  year: number;
  inflatedCost: number;
  purchasingPower: number;
  cumulativeLoss: number;
}

interface ComparisonItem {
  today: string;
  inFuture: string;
}

interface InflationResponse {
  currentAmount: number;
  inflationRate: number;
  category: string;
  years: number;
  futureCost: number;
  purchasingPowerLoss: number;
  purchasingPowerRetained: number;
  yearlyBreakdown: YearlyBreakdown[];
  comparison: ComparisonItem[];
  requiredPreTaxReturn: number;
  taxRateAssumed: number;
  tips: string[];
}

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const CATEGORY_RATES: Record<InflationCategory, number> = {
  general: 6,
  education: 8,
  healthcare: 7,
  real_estate: 6.5,
  food: 5.5,
};

const VALID_CATEGORIES: InflationCategory[] = [
  "general",
  "education",
  "healthcare",
  "real_estate",
  "food",
];

const CATEGORY_LABELS: Record<InflationCategory, string> = {
  general: "General (CPI)",
  education: "Education",
  healthcare: "Healthcare",
  real_estate: "Real Estate",
  food: "Food & Groceries",
};

// Practical comparison items based on amount range
function getComparisonItems(
  currentAmount: number,
  futureCost: number,
): ComparisonItem[] {
  const items: ComparisonItem[] = [];

  const fmt = (n: number) =>
    `₹${n.toLocaleString("en-IN", { maximumFractionDigits: 0 })}`;

  if (currentAmount >= 50) {
    items.push({
      today: `${fmt(currentAmount)} worth of groceries today`,
      inFuture: `Same groceries will cost ${fmt(futureCost)} in future`,
    });
  }

  if (currentAmount >= 500) {
    items.push({
      today: `${fmt(currentAmount)} doctor visit today`,
      inFuture: `Same visit will cost ${fmt(futureCost)} in future`,
    });
  }

  if (currentAmount >= 5000) {
    items.push({
      today: `${fmt(currentAmount)} monthly rent today`,
      inFuture: `Same rent will be ${fmt(futureCost)} in future`,
    });
  }

  if (currentAmount >= 50000) {
    items.push({
      today: `${fmt(currentAmount)} worth of gold today`,
      inFuture: `Same gold will cost ${fmt(futureCost)} in future`,
    });
  }

  if (currentAmount >= 100000) {
    items.push({
      today: `₹${(currentAmount / 100000).toFixed(1)}L education fee today`,
      inFuture: `Same education will cost ₹${(futureCost / 100000).toFixed(1)}L in future`,
    });
  }

  if (currentAmount >= 500000) {
    items.push({
      today: `₹${(currentAmount / 100000).toFixed(1)}L property value today`,
      inFuture: `Same property will be worth ₹${(futureCost / 100000).toFixed(1)}L in future`,
    });
  }

  // Always include at least one generic comparison
  if (items.length === 0) {
    items.push({
      today: `${fmt(currentAmount)} purchasing power today`,
      inFuture: `Will have purchasing power of only ${fmt(currentAmount / (futureCost / currentAmount))} in future`,
    });
  }

  return items;
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function round2(n: number): number {
  return Math.round(n * 100) / 100;
}

// ---------------------------------------------------------------------------
// POST handler
// ---------------------------------------------------------------------------

export async function POST(request: NextRequest) {
  try {
    let body: InflationRequest;
    try {
      body = await request.json();
    } catch {
      return NextResponse.json(
        { error: "Invalid JSON in request body" },
        { status: 400 },
      );
    }

    const {
      currentAmount,
      inflationRate: inputInflationRate,
      years,
      category,
    } = body;

    // ------------------------------------------------------------------
    // Input validation
    // ------------------------------------------------------------------

    if (
      currentAmount === undefined ||
      currentAmount === null ||
      typeof currentAmount !== "number" ||
      currentAmount <= 0
    ) {
      return NextResponse.json(
        { error: "Current amount must be a positive number (in ₹)" },
        { status: 400 },
      );
    }

    if (currentAmount > 1e12) {
      return NextResponse.json(
        { error: "Current amount exceeds maximum limit of ₹1,000,000,000,000" },
        { status: 400 },
      );
    }

    if (
      years === undefined ||
      years === null ||
      typeof years !== "number" ||
      !Number.isInteger(years) ||
      years < 1 ||
      years > 50
    ) {
      return NextResponse.json(
        { error: "Years must be an integer between 1 and 50" },
        { status: 400 },
      );
    }

    // Validate category if provided
    if (
      category !== undefined &&
      category !== null &&
      !VALID_CATEGORIES.includes(category)
    ) {
      return NextResponse.json(
        { error: `Category must be one of: ${VALID_CATEGORIES.join(", ")}` },
        { status: 400 },
      );
    }

    // Validate inflation rate if provided (only used when no category)
    if (
      inputInflationRate !== undefined &&
      inputInflationRate !== null &&
      (typeof inputInflationRate !== "number" ||
        inputInflationRate < 0 ||
        inputInflationRate > 50)
    ) {
      return NextResponse.json(
        { error: "Inflation rate must be between 0% and 50%" },
        { status: 400 },
      );
    }

    // ------------------------------------------------------------------
    // Determine effective inflation rate
    // ------------------------------------------------------------------

    const effectiveCategory: InflationCategory = category ?? "general";
    const inflationRate = category
      ? CATEGORY_RATES[effectiveCategory]
      : (inputInflationRate ?? 6);

    // ------------------------------------------------------------------
    // Calculations
    // ------------------------------------------------------------------

    // Future cost: currentAmount × (1 + inflationRate/100)^years
    const futureCost = round2(
      currentAmount * Math.pow(1 + inflationRate / 100, years),
    );

    // Purchasing power loss
    const purchasingPowerLoss = round2(futureCost - currentAmount);

    // Purchasing power retained: (currentAmount / futureCost) × 100
    const purchasingPowerRetained = round2(
      (currentAmount / futureCost) * 100,
    );

    // Required pre-tax return to beat inflation after tax
    // Formula: inflationRate / (1 - taxRate) where taxRate = 0.3 (30% slab)
    const taxRate = 0.3;
    const requiredPreTaxReturn = round2(
      inflationRate / (1 - taxRate),
    );

    // ------------------------------------------------------------------
    // Year-by-year breakdown
    // ------------------------------------------------------------------

    const yearlyBreakdown: YearlyBreakdown[] = [];

    for (let year = 1; year <= years; year++) {
      const inflatedCost = round2(
        currentAmount * Math.pow(1 + inflationRate / 100, year),
      );
      const purchasingPower = round2(
        (currentAmount / inflatedCost) * 100,
      );
      const cumulativeLoss = round2(inflatedCost - currentAmount);

      yearlyBreakdown.push({
        year,
        inflatedCost,
        purchasingPower,
        cumulativeLoss,
      });
    }

    // ------------------------------------------------------------------
    // Comparison items
    // ------------------------------------------------------------------

    const comparison = getComparisonItems(currentAmount, futureCost);

    // ------------------------------------------------------------------
    // Tips
    // ------------------------------------------------------------------

    const tips: string[] = [];

    tips.push(
      `To beat ${inflationRate}% inflation post-tax at 30% slab, you need pre-tax returns of ${requiredPreTaxReturn}%`,
    );

    if (inflationRate >= 6) {
      tips.push(
        "Equity mutual funds have historically returned 12-15% long-term — well above inflation",
      );
    }

    if (effectiveCategory === "education") {
      tips.push(
        "Education inflation in India is 8-10% — consider starting a dedicated education fund early",
      );
      tips.push(
        "Sukanya Samriddhi Yojana (SSY) offers 8.2% for girl children's education — beats education inflation partially",
      );
    }

    if (effectiveCategory === "healthcare") {
      tips.push(
        "Healthcare inflation is 7-12% in India — health insurance is essential, not optional",
      );
      tips.push(
        "Consider a super top-up health insurance plan for catastrophic medical expenses",
      );
    }

    if (effectiveCategory === "real_estate") {
      tips.push(
        "Real estate appreciation varies widely by location — don't assume uniform 6-7% growth",
      );
      tips.push(
        "Rental yield in India is typically 2-3% — real estate returns come mainly from capital appreciation",
      );
    }

    if (effectiveCategory === "food") {
      tips.push(
        "Food inflation is volatile — budget 5-7% annual increase in grocery expenses",
      );
    }

    tips.push(
      "FD returns at 6-7% barely beat inflation — post-tax you may actually lose purchasing power",
    );

    tips.push(
      "PPF at 7.1% tax-free is an excellent inflation hedge for conservative investors",
    );

    if (purchasingPowerRetained < 50) {
      tips.push(
        `Your money will retain only ${purchasingPowerRetained}% of its purchasing power — aggressive investment is necessary`,
      );
    }

    if (years >= 20) {
      tips.push(
        "For long-term horizons (20+ years), equity allocation of 60-80% is recommended to beat inflation",
      );
    }

    tips.push(
      "Diversification across asset classes (equity, debt, gold, real estate) is the best strategy against inflation",
    );

    // ------------------------------------------------------------------
    // Response
    // ------------------------------------------------------------------

    const response: InflationResponse = {
      currentAmount: round2(currentAmount),
      inflationRate,
      category: CATEGORY_LABELS[effectiveCategory],
      years,
      futureCost,
      purchasingPowerLoss,
      purchasingPowerRetained,
      yearlyBreakdown,
      comparison,
      requiredPreTaxReturn,
      taxRateAssumed: taxRate * 100,
      tips,
    };

    return NextResponse.json(response);
  } catch (error) {
    console.error("[ArthSathi Inflation Calculator] Error:", error);
    return NextResponse.json(
      {
        error:
          "Failed to calculate inflation impact. Please check your inputs and try again.",
      },
      { status: 500 },
    );
  }
}
