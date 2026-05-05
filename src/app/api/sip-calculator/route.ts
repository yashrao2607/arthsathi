import { NextRequest, NextResponse } from "next/server";

// ---------------------------------------------------------------------------
// SIP Calculator API
// POST /api/sip-calculator
// Body: { monthlyAmount, expectedRate, tenureYears, stepUpPercent? }
// Returns: totalValue, totalInvested, wealthGenerated, yearlyBreakdown, benchmarkComparison
// ---------------------------------------------------------------------------

interface SipRequest {
  monthlyAmount: number;
  expectedRate: number;
  tenureYears: number;
  stepUpPercent?: number;
}

interface YearlyBreakdown {
  year: number;
  investedSoFar: number;
  valueAtYearEnd: number;
  gainsSoFar: number;
}

interface BenchmarkComparison {
  name: string;
  rate: number;
  totalValue: number;
  totalInvested: number;
  wealthGenerated: number;
}

interface SipResult {
  totalValue: number;
  totalInvested: number;
  wealthGenerated: number;
  yearlyBreakdown: YearlyBreakdown[];
  benchmarkComparison: BenchmarkComparison[];
}

function calculateSip(
  monthlyAmount: number,
  annualRate: number,
  tenureYears: number,
  stepUpPercent: number
): SipResult {
  const monthlyRate = annualRate / 100 / 12;
  const yearlyBreakdown: YearlyBreakdown[] = [];

  let currentValue = 0;
  let totalInvested = 0;
  let currentMonthlyAmount = monthlyAmount;

  for (let year = 1; year <= tenureYears; year++) {
    // Apply step-up at the start of each year (except year 1)
    if (year > 1 && stepUpPercent > 0) {
      currentMonthlyAmount = currentMonthlyAmount * (1 + stepUpPercent / 100);
    }

    // 12 months of investment
    for (let month = 1; month <= 12; month++) {
      currentValue = (currentValue + currentMonthlyAmount) * (1 + monthlyRate);
      totalInvested += currentMonthlyAmount;
    }

    yearlyBreakdown.push({
      year,
      investedSoFar: Math.round(totalInvested),
      valueAtYearEnd: Math.round(currentValue),
      gainsSoFar: Math.round(currentValue - totalInvested),
    });
  }

  const totalValue = Math.round(currentValue);
  const wealthGenerated = totalValue - Math.round(totalInvested);

  // Benchmark comparison (no step-up for benchmarks)
  const benchmarks: BenchmarkComparison[] = [
    { name: "FD @7%", rate: 7 },
    { name: "PPF @7.1%", rate: 7.1 },
    { name: "Savings @3.5%", rate: 3.5 },
  ].map((b) => {
    const bMonthlyRate = b.rate / 100 / 12;
    let bValue = 0;
    let bInvested = 0;
    for (let month = 0; month < tenureYears * 12; month++) {
      bValue = (bValue + monthlyAmount) * (1 + bMonthlyRate);
      bInvested += monthlyAmount;
    }
    return {
      name: b.name,
      rate: b.rate,
      totalValue: Math.round(bValue),
      totalInvested: Math.round(bInvested),
      wealthGenerated: Math.round(bValue - bInvested),
    };
  });

  return {
    totalValue,
    totalInvested: Math.round(totalInvested),
    wealthGenerated,
    yearlyBreakdown,
    benchmarkComparison: benchmarks,
  };
}

export async function POST(request: NextRequest) {
  try {
    const body: SipRequest = await request.json();

    const { monthlyAmount, expectedRate, tenureYears, stepUpPercent = 0 } = body;

    // Validation
    if (!monthlyAmount || monthlyAmount <= 0) {
      return NextResponse.json(
        { error: "Monthly SIP amount must be a positive number" },
        { status: 400 }
      );
    }

    if (monthlyAmount > 10000000) {
      return NextResponse.json(
        { error: "Monthly SIP amount cannot exceed ₹1 Crore" },
        { status: 400 }
      );
    }

    if (expectedRate === undefined || expectedRate < 0 || expectedRate > 50) {
      return NextResponse.json(
        { error: "Expected return rate must be between 0% and 50%" },
        { status: 400 }
      );
    }

    if (!tenureYears || tenureYears < 1 || tenureYears > 40) {
      return NextResponse.json(
        { error: "Investment tenure must be between 1 and 40 years" },
        { status: 400 }
      );
    }

    if (stepUpPercent < 0 || stepUpPercent > 100) {
      return NextResponse.json(
        { error: "Annual step-up must be between 0% and 100%" },
        { status: 400 }
      );
    }

    const result = calculateSip(monthlyAmount, expectedRate, tenureYears, stepUpPercent);

    return NextResponse.json(result);
  } catch {
    return NextResponse.json(
      { error: "Invalid request body" },
      { status: 400 }
    );
  }
}
