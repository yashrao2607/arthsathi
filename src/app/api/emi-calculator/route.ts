import { NextRequest, NextResponse } from "next/server";

// Indian loan benchmarks (FY 2024-25 typical ranges)
const BENCHMARKS = {
  home: {
    typicalRate: "8.5% - 9.5%",
    typicalTenure: "20 - 30 years",
    maxTenure: 360,
    minRate: 8.0,
    maxRate: 12.0,
    description: "Home loans typically have the lowest interest rates and longest tenures",
  },
  personal: {
    typicalRate: "10.5% - 16.0%",
    typicalTenure: "1 - 5 years",
    maxTenure: 84,
    minRate: 10.0,
    maxRate: 24.0,
    description: "Personal loans are unsecured with higher rates and shorter tenures",
  },
  car: {
    typicalRate: "8.5% - 11.5%",
    typicalTenure: "3 - 7 years",
    maxTenure: 96,
    minRate: 7.5,
    maxRate: 14.0,
    description: "Car loans are secured against the vehicle with moderate rates",
  },
  education: {
    typicalRate: "8.0% - 12.0%",
    typicalTenure: "5 - 15 years",
    maxTenure: 180,
    minRate: 7.5,
    maxRate: 15.0,
    description:
      "Education loans often have moratorium periods and subsidized rates for certain categories",
  },
};

interface EMIBreakdownItem {
  month: number;
  emi: number;
  principal: number;
  interest: number;
  balance: number;
}

interface YearlySummaryItem {
  year: number;
  principalPaid: number;
  interestPaid: number;
  closingBalance: number;
}

interface EMIResponse {
  emi: number;
  totalPayment: number;
  totalInterest: number;
  principal: number;
  breakdown: EMIBreakdownItem[];
  truncated: boolean;
  schedule: YearlySummaryItem[];
  benchmarks: typeof BENCHMARKS;
}

function calculateEMI(
  principal: number,
  annualRate: number,
  tenureMonths: number
): number {
  // EMI = P × r × (1+r)^n / ((1+r)^n – 1)
  if (principal <= 0 || tenureMonths <= 0) return 0;
  if (annualRate === 0) return principal / tenureMonths;

  const monthlyRate = annualRate / 12 / 100;
  const power = Math.pow(1 + monthlyRate, tenureMonths);
  const emi = (principal * monthlyRate * power) / (power - 1);
  return Math.round(emi * 100) / 100;
}

function generateBreakdown(
  principal: number,
  annualRate: number,
  tenureMonths: number,
  emi: number
): { breakdown: EMIBreakdownItem[]; truncated: boolean } {
  const monthlyRate = annualRate / 12 / 100;
  let balance = principal;
  const fullBreakdown: EMIBreakdownItem[] = [];

  for (let month = 1; month <= tenureMonths; month++) {
    const interestComponent = Math.round(balance * monthlyRate * 100) / 100;
    const principalComponent = Math.round((emi - interestComponent) * 100) / 100;
    balance = Math.round((balance - principalComponent) * 100) / 100;

    // Ensure balance doesn't go negative due to rounding
    if (balance < 0) balance = 0;

    fullBreakdown.push({
      month,
      emi: Math.round(emi * 100) / 100,
      principal: principalComponent,
      interest: interestComponent,
      balance,
    });
  }

  // Return first 12 and last 6 months to keep response small
  const maxReturn = 18;
  let truncated = false;

  if (fullBreakdown.length <= maxReturn) {
    return { breakdown: fullBreakdown, truncated: false };
  }

  truncated = true;
  const first12 = fullBreakdown.slice(0, 12);
  const last6 = fullBreakdown.slice(-6);
  return { breakdown: [...first12, ...last6], truncated };
}

function generateYearlySchedule(
  principal: number,
  annualRate: number,
  tenureMonths: number,
  emi: number
): YearlySummaryItem[] {
  const monthlyRate = annualRate / 12 / 100;
  let balance = principal;
  const schedule: YearlySummaryItem[] = [];

  let currentYear = 1;
  let yearPrincipal = 0;
  let yearInterest = 0;

  for (let month = 1; month <= tenureMonths; month++) {
    const interestComponent = Math.round(balance * monthlyRate * 100) / 100;
    const principalComponent = Math.round((emi - interestComponent) * 100) / 100;
    balance = Math.round((balance - principalComponent) * 100) / 100;
    if (balance < 0) balance = 0;

    yearPrincipal += principalComponent;
    yearInterest += interestComponent;

    if (month % 12 === 0 || month === tenureMonths) {
      schedule.push({
        year: currentYear,
        principalPaid: Math.round(yearPrincipal * 100) / 100,
        interestPaid: Math.round(yearInterest * 100) / 100,
        closingBalance: balance,
      });
      currentYear++;
      yearPrincipal = 0;
      yearInterest = 0;
    }
  }

  return schedule;
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { principal, rate, tenure, type } = body;

    // Validate inputs
    if (!principal || typeof principal !== "number" || principal <= 0) {
      return NextResponse.json(
        { error: "Principal must be a positive number" },
        { status: 400 }
      );
    }

    if (rate === undefined || rate === null || typeof rate !== "number" || rate < 0) {
      return NextResponse.json(
        { error: "Interest rate must be a non-negative number" },
        { status: 400 }
      );
    }

    if (!tenure || typeof tenure !== "number" || tenure <= 0 || !Number.isInteger(tenure)) {
      return NextResponse.json(
        { error: "Tenure must be a positive integer (in months)" },
        { status: 400 }
      );
    }

    const validTypes = ["home", "personal", "car", "education"];
    if (!type || !validTypes.includes(type)) {
      return NextResponse.json(
        { error: `Loan type must be one of: ${validTypes.join(", ")}` },
        { status: 400 }
      );
    }

    // Validate against benchmarks
    const benchmark = BENCHMARKS[type as keyof typeof BENCHMARKS];
    if (tenure > benchmark.maxTenure) {
      return NextResponse.json(
        {
          error: `Tenure exceeds maximum for ${type} loan (max ${benchmark.maxTenure} months / ${Math.round(benchmark.maxTenure / 12)} years)`,
        },
        { status: 400 }
      );
    }

    // Cap principal at 10 crore for safety
    if (principal > 100000000) {
      return NextResponse.json(
        { error: "Principal amount exceeds maximum limit of ₹10,00,00,000" },
        { status: 400 }
      );
    }

    // Phase 3.2: Boundary validation for extreme inputs
    if (rate > 50) {
      return NextResponse.json(
        {
          error: "Interest rate exceeds 50%. This appears unusually high — please verify the rate. If this is a non-institutional lender, exercise caution.",
          suggestion: "Standard Indian bank rates: Home 8.5-9.5%, Personal 10.5-16%, Car 8.5-11.5%, Education 8-12%."
        },
        { status: 400 }
      );
    }

    if (tenure > 600) {
      return NextResponse.json(
        {
          error: "Tenure exceeds 50 years (600 months), which is not a standard loan product in India.",
          suggestion: "Most Indian home loans cap at 30 years (360 months). Consider a shorter tenure for lower total interest."
        },
        { status: 400 }
      );
    }

    // Calculate EMI
    const emi = calculateEMI(principal, rate, tenure);
    const totalPayment = Math.round(emi * tenure * 100) / 100;
    const totalInterest = Math.round((totalPayment - principal) * 100) / 100;

    // Generate breakdown and yearly schedule
    const { breakdown, truncated } = generateBreakdown(principal, rate, tenure, emi);
    const schedule = generateYearlySchedule(principal, rate, tenure, emi);

    // Smart suggestion: warn if total interest exceeds principal (high debt burden)
    const debtWarning = totalInterest > principal
      ? `⚠️ Advisory: Total interest (₹${totalInterest.toLocaleString("en-IN")}) exceeds the principal amount. Consider a shorter tenure or prepayment strategy to reduce interest burden.`
      : null;

    const response: EMIResponse = {
      emi,
      totalPayment,
      totalInterest,
      principal,
      breakdown,
      truncated,
      schedule,
      benchmarks: BENCHMARKS,
      ...(debtWarning ? { advisory: debtWarning } : {}),
    } as EMIResponse;

    return NextResponse.json(response);
  } catch (error) {
    console.error("EMI Calculator error:", error);
    return NextResponse.json(
      { error: "Invalid request body. Please provide principal, rate, tenure, and type." },
      { status: 400 }
    );
  }
}
