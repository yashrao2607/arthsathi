import { NextRequest, NextResponse } from "next/server";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

type CompoundingFrequency = "monthly" | "quarterly" | "half-yearly" | "yearly";

interface CompoundInterestRequest {
  principal: number;
  rate: number;
  tenure: number;
  compoundingFrequency?: CompoundingFrequency;
  monthlyContribution?: number;
}

interface YearWiseBreakdown {
  year: number;
  openingBalance: number;
  interestEarned: number;
  contributions: number;
  closingBalance: number;
}

interface CompoundInterestResponse {
  principal: number;
  totalContributions: number;
  totalInterest: number;
  maturityAmount: number;
  effectiveRate: number;
  yearWiseBreakdown: YearWiseBreakdown[];
  comparisonWithSimpleInterest: {
    simpleInterestAmount: number;
    difference: number;
  };
}

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const FREQUENCY_MAP: Record<CompoundingFrequency, number> = {
  monthly: 12,
  quarterly: 4,
  "half-yearly": 2,
  yearly: 1,
};

const VALID_FREQUENCIES: CompoundingFrequency[] = [
  "monthly",
  "quarterly",
  "half-yearly",
  "yearly",
];

// ---------------------------------------------------------------------------
// Rounding helper
// ---------------------------------------------------------------------------

function round2(n: number): number {
  return Math.round(n * 100) / 100;
}

// ---------------------------------------------------------------------------
// POST handler
// ---------------------------------------------------------------------------

export async function POST(request: NextRequest) {
  try {
    let body: CompoundInterestRequest;

    try {
      body = await request.json();
    } catch {
      return NextResponse.json(
        { error: "Invalid JSON in request body" },
        { status: 400 },
      );
    }

    const {
      principal,
      rate,
      tenure,
      compoundingFrequency = "yearly",
      monthlyContribution = 0,
    } = body;

    // ------------------------------------------------------------------
    // Input validation
    // ------------------------------------------------------------------

    if (
      principal === undefined ||
      principal === null ||
      typeof principal !== "number" ||
      principal <= 0
    ) {
      return NextResponse.json(
        { error: "Principal must be a positive number (in ₹)" },
        { status: 400 },
      );
    }

    if (principal > 1e9) {
      return NextResponse.json(
        { error: "Principal exceeds maximum limit of ₹1,000,000,000" },
        { status: 400 },
      );
    }

    if (
      rate === undefined ||
      rate === null ||
      typeof rate !== "number" ||
      rate < 0 ||
      rate > 100
    ) {
      return NextResponse.json(
        { error: "Annual interest rate must be a number between 0 and 100 (%)" },
        { status: 400 },
      );
    }

    if (
      tenure === undefined ||
      tenure === null ||
      typeof tenure !== "number" ||
      tenure <= 0 ||
      !Number.isInteger(tenure)
    ) {
      return NextResponse.json(
        { error: "Tenure must be a positive integer (in years)" },
        { status: 400 },
      );
    }

    if (tenure > 50) {
      return NextResponse.json(
        { error: "Tenure cannot exceed 50 years" },
        { status: 400 },
      );
    }

    if (
      !VALID_FREQUENCIES.includes(compoundingFrequency)
    ) {
      return NextResponse.json(
        {
          error: `Compounding frequency must be one of: ${VALID_FREQUENCIES.join(", ")}`,
        },
        { status: 400 },
      );
    }

    if (
      monthlyContribution !== undefined &&
      monthlyContribution !== null &&
      (typeof monthlyContribution !== "number" || monthlyContribution < 0)
    ) {
      return NextResponse.json(
        { error: "Monthly contribution must be a non-negative number (in ₹)" },
        { status: 400 },
      );
    }

    if ((monthlyContribution ?? 0) > 10000000) {
      return NextResponse.json(
        { error: "Monthly contribution exceeds maximum limit of ₹1,00,00,000" },
        { status: 400 },
      );
    }

    const monthlyContrib = monthlyContribution ?? 0;

    // ------------------------------------------------------------------
    // Calculation
    // ------------------------------------------------------------------

    const n = FREQUENCY_MAP[compoundingFrequency]; // compounding periods per year
    const monthsPerPeriod = 12 / n; // months per compounding period

    // Effective annual rate: (1 + r/n)^n - 1
    let effectiveRate: number;
    if (rate === 0) {
      effectiveRate = 0;
    } else {
      effectiveRate = Math.pow(1 + rate / (100 * n), n) - 1;
    }

    // Rate per compounding period (decimal)
    const ratePerPeriod = rate / (100 * n);

    // ---- Year-wise breakdown (step-by-step for accuracy) ----

    let currentBalance = principal;
    const yearWiseBreakdown: YearWiseBreakdown[] = [];

    for (let year = 1; year <= tenure; year++) {
      const openingBalance = round2(currentBalance);
      let yearInterest = 0;
      let yearContributions = 0;

      for (let period = 1; period <= n; period++) {
        // Add monthly contributions for this compounding period
        const periodContributions = round2(monthlyContrib * monthsPerPeriod);
        yearContributions += periodContributions;
        currentBalance += periodContributions;

        // Apply interest for this period
        if (rate > 0) {
          const periodInterest = round2(currentBalance * ratePerPeriod);
          yearInterest += periodInterest;
          currentBalance += periodInterest;
        }
      }

      yearWiseBreakdown.push({
        year,
        openingBalance,
        interestEarned: round2(yearInterest),
        contributions: round2(yearContributions),
        closingBalance: round2(currentBalance),
      });
    }

    const maturityAmount = round2(currentBalance);
    const totalContributions = round2(principal + monthlyContrib * 12 * tenure);
    const totalInterest = round2(maturityAmount - totalContributions);

    // ---- Comparison with simple interest ----
    // Simple interest: interest only on the original principal
    // No compounding, no interest on contributions
    const simpleInterestOnPrincipal = round2(
      principal * rate * tenure / 100,
    );
    const totalMonthlyContribs = round2(monthlyContrib * 12 * tenure);
    const simpleInterestAmount = round2(
      principal + simpleInterestOnPrincipal + totalMonthlyContribs,
    );
    const difference = round2(maturityAmount - simpleInterestAmount);

    // ------------------------------------------------------------------
    // Response
    // ------------------------------------------------------------------

    const response: CompoundInterestResponse = {
      principal: round2(principal),
      totalContributions,
      totalInterest,
      maturityAmount,
      effectiveRate: round2(effectiveRate * 100), // as percentage
      yearWiseBreakdown,
      comparisonWithSimpleInterest: {
        simpleInterestAmount,
        difference,
      },
    };

    return NextResponse.json(response);
  } catch (error) {
    console.error("[ArthSathi Compound Interest] Error:", error);
    return NextResponse.json(
      {
        error:
          "Failed to calculate compound interest. Please check your inputs and try again.",
      },
      { status: 500 },
    );
  }
}
