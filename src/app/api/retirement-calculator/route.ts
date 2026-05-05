import { NextRequest, NextResponse } from "next/server";

// ---------------------------------------------------------------------------
// Retirement Calculator API
// POST /api/retirement-calculator
// Body: { currentAge, retirementAge, lifeExpectancy, monthlyExpenses,
//         currentSavings, monthlyContribution, expectedReturnRate?,
//         inflationRate?, epfMonthly?, npsMonthly? }
// Returns: corpus calculations, yearly breakdown, recommendations
// ---------------------------------------------------------------------------

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface RetirementRequest {
  currentAge: number;
  retirementAge: number;
  lifeExpectancy: number;
  monthlyExpenses: number;
  currentSavings: number;
  monthlyContribution: number;
  expectedReturnRate?: number;
  inflationRate?: number;
  epfMonthly?: number;
  npsMonthly?: number;
}

interface YearlyProjection {
  year: number;
  age: number;
  contribution: number;
  returns: number;
  totalCorpus: number;
}

interface Recommendation {
  type: "surplus" | "shortfall" | "balanced";
  message: string;
  suggestions: string[];
}

interface RetirementResponse {
  currentAge: number;
  retirementAge: number;
  lifeExpectancy: number;
  yearsToRetire: number;
  yearsInRetirement: number;
  inflatedMonthlyExpenses: number;
  inflatedAnnualExpenses: number;
  corpusNeeded: number;
  withdrawalRate: number;
  futureValueCurrentSavings: number;
  futureValueEpf: number;
  futureValueNps: number;
  futureValueMonthlyInvestments: number;
  totalAccumulated: number;
  shortfallSurplus: number;
  isShortfall: boolean;
  additionalMonthlyNeeded: number;
  yearlyProjection: YearlyProjection[];
  recommendations: Recommendation;
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function round2(n: number): number {
  return Math.round(n * 100) / 100;
}

// Future value of a lump sum: PV × (1 + r)^n
function futureValueLumpSum(
  presentValue: number,
  annualRate: number,
  years: number,
): number {
  return presentValue * Math.pow(1 + annualRate / 100, years);
}

// Future value of monthly SIP: PMT × [((1 + r)^n - 1) / r] × (1 + r)
function futureValueSip(
  monthlyAmount: number,
  annualRate: number,
  years: number,
): number {
  if (annualRate === 0) {
    return monthlyAmount * years * 12;
  }
  const r = annualRate / 100 / 12;
  const n = years * 12;
  return monthlyAmount * ((Math.pow(1 + r, n) - 1) / r) * (1 + r);
}

// Future value of annual contributions with annual compounding
// (Used for EPF and NPS: monthly contribution × 12 per year, compounded annually)
function futureValueAnnualContrib(
  monthlyAmount: number,
  annualRate: number,
  years: number,
): number {
  if (years === 0) return 0;
  const annualContrib = monthlyAmount * 12;
  if (annualRate === 0) {
    return annualContrib * years;
  }
  const r = annualRate / 100;
  return annualContrib * ((Math.pow(1 + r, years) - 1) / r);
}

// ---------------------------------------------------------------------------
// POST handler
// ---------------------------------------------------------------------------

export async function POST(request: NextRequest) {
  try {
    let body: RetirementRequest;
    try {
      body = await request.json();
    } catch {
      return NextResponse.json(
        { error: "Invalid JSON in request body" },
        { status: 400 },
      );
    }

    const {
      currentAge,
      retirementAge,
      lifeExpectancy,
      monthlyExpenses,
      currentSavings,
      monthlyContribution,
      expectedReturnRate = 10,
      inflationRate = 6,
      epfMonthly = 0,
      npsMonthly = 0,
    } = body;

    // ------------------------------------------------------------------
    // Input validation
    // ------------------------------------------------------------------

    if (
      currentAge === undefined ||
      currentAge === null ||
      typeof currentAge !== "number" ||
      !Number.isInteger(currentAge) ||
      currentAge < 18 ||
      currentAge > 60
    ) {
      return NextResponse.json(
        { error: "Current age must be an integer between 18 and 60" },
        { status: 400 },
      );
    }

    if (
      retirementAge === undefined ||
      retirementAge === null ||
      typeof retirementAge !== "number" ||
      !Number.isInteger(retirementAge) ||
      retirementAge < 40 ||
      retirementAge > 80
    ) {
      return NextResponse.json(
        { error: "Retirement age must be an integer between 40 and 80" },
        { status: 400 },
      );
    }

    if (retirementAge <= currentAge) {
      return NextResponse.json(
        { error: "Retirement age must be greater than current age" },
        { status: 400 },
      );
    }

    if (
      lifeExpectancy === undefined ||
      lifeExpectancy === null ||
      typeof lifeExpectancy !== "number" ||
      !Number.isInteger(lifeExpectancy) ||
      lifeExpectancy < 60 ||
      lifeExpectancy > 100
    ) {
      return NextResponse.json(
        { error: "Life expectancy must be an integer between 60 and 100" },
        { status: 400 },
      );
    }

    if (lifeExpectancy <= retirementAge) {
      return NextResponse.json(
        { error: "Life expectancy must be greater than retirement age" },
        { status: 400 },
      );
    }

    if (
      monthlyExpenses === undefined ||
      monthlyExpenses === null ||
      typeof monthlyExpenses !== "number" ||
      monthlyExpenses <= 0
    ) {
      return NextResponse.json(
        { error: "Monthly expenses must be a positive number (in ₹)" },
        { status: 400 },
      );
    }

    if (
      currentSavings === undefined ||
      currentSavings === null ||
      typeof currentSavings !== "number" ||
      currentSavings < 0
    ) {
      return NextResponse.json(
        { error: "Current savings must be a non-negative number (in ₹)" },
        { status: 400 },
      );
    }

    if (
      monthlyContribution === undefined ||
      monthlyContribution === null ||
      typeof monthlyContribution !== "number" ||
      monthlyContribution < 0
    ) {
      return NextResponse.json(
        { error: "Monthly contribution must be a non-negative number (in ₹)" },
        { status: 400 },
      );
    }

    if (
      typeof expectedReturnRate !== "number" ||
      expectedReturnRate < 0 ||
      expectedReturnRate > 30
    ) {
      return NextResponse.json(
        { error: "Expected return rate must be between 0% and 30%" },
        { status: 400 },
      );
    }

    if (
      typeof inflationRate !== "number" ||
      inflationRate < 0 ||
      inflationRate > 20
    ) {
      return NextResponse.json(
        { error: "Inflation rate must be between 0% and 20%" },
        { status: 400 },
      );
    }

    if (
      epfMonthly !== undefined &&
      epfMonthly !== null &&
      (typeof epfMonthly !== "number" || epfMonthly < 0)
    ) {
      return NextResponse.json(
        { error: "EPF monthly contribution must be a non-negative number (in ₹)" },
        { status: 400 },
      );
    }

    if (
      npsMonthly !== undefined &&
      npsMonthly !== null &&
      (typeof npsMonthly !== "number" || npsMonthly < 0)
    ) {
      return NextResponse.json(
        { error: "NPS monthly contribution must be a non-negative number (in ₹)" },
        { status: 400 },
      );
    }

    const epf = epfMonthly ?? 0;
    const nps = npsMonthly ?? 0;

    // ------------------------------------------------------------------
    // Calculations
    // ------------------------------------------------------------------

    const yearsToRetire = retirementAge - currentAge;
    const yearsInRetirement = lifeExpectancy - retirementAge;
    const withdrawalRate = 4; // 4% safe withdrawal rate

    // Inflation-adjusted monthly expenses at retirement
    const inflatedMonthlyExpenses = round2(
      monthlyExpenses * Math.pow(1 + inflationRate / 100, yearsToRetire),
    );
    const inflatedAnnualExpenses = round2(inflatedMonthlyExpenses * 12);

    // Total corpus needed: inflatedAnnualExpenses / (withdrawalRate / 100)
    const corpusNeeded = round2(
      inflatedAnnualExpenses / (withdrawalRate / 100),
    );

    // Future value of current savings (lump sum compounded at expected return)
    const fvCurrentSavings = round2(
      futureValueLumpSum(currentSavings, expectedReturnRate, yearsToRetire),
    );

    // Future value of EPF at 8.1% annual, compounded annually
    const fvEpf = round2(
      futureValueAnnualContrib(epf, 8.1, yearsToRetire),
    );

    // Future value of NPS at 10% annual, compounded annually
    const fvNps = round2(
      futureValueAnnualContrib(nps, 10, yearsToRetire),
    );

    // Future value of monthly investments (SIP formula)
    const fvMonthlyInvestments = round2(
      futureValueSip(monthlyContribution, expectedReturnRate, yearsToRetire),
    );

    // Total accumulated
    const totalAccumulated = round2(
      fvCurrentSavings + fvEpf + fvNps + fvMonthlyInvestments,
    );

    // Shortfall/Surplus
    const shortfallSurplus = round2(totalAccumulated - corpusNeeded);
    const isShortfall = shortfallSurplus < 0;

    // Additional monthly amount needed if shortfall
    let additionalMonthlyNeeded = 0;
    if (isShortfall) {
      const deficit = Math.abs(shortfallSurplus);
      if (expectedReturnRate > 0) {
        const r = expectedReturnRate / 100 / 12;
        const n = yearsToRetire * 12;
        const sipFactor = ((Math.pow(1 + r, n) - 1) / r) * (1 + r);
        additionalMonthlyNeeded = round2(deficit / sipFactor);
      } else {
        additionalMonthlyNeeded = round2(deficit / (yearsToRetire * 12));
      }
    }

    // ------------------------------------------------------------------
    // Year-by-year projection
    // ------------------------------------------------------------------

    const yearlyProjection: YearlyProjection[] = [];
    let runningCorpus = currentSavings;

    for (let year = 1; year <= yearsToRetire; year++) {
      const age = currentAge + year;

      // Total contribution this year
      const yearContribution = round2(
        (monthlyContribution + epf + nps) * 12,
      );

      // Returns this year on existing corpus at expected return rate
      const yearReturns = round2(
        runningCorpus * (expectedReturnRate / 100),
      );

      // Add EPF contribution returns at 8.1%
      const epfContribReturns = round2(
        epf * 12 * (8.1 / 100),
      );

      // Add NPS contribution returns at 10%
      const npsContribReturns = round2(
        nps * 12 * (10 / 100),
      );

      // Monthly SIP contributions earn returns throughout the year (approx half-year average)
      const sipContribReturns = round2(
        monthlyContribution * 12 * (expectedReturnRate / 100) * 0.5,
      );

      const totalReturns = round2(
        yearReturns + epfContribReturns + npsContribReturns + sipContribReturns,
      );

      runningCorpus = round2(
        runningCorpus + yearContribution + totalReturns,
      );

      yearlyProjection.push({
        year,
        age,
        contribution: yearContribution,
        returns: totalReturns,
        totalCorpus: runningCorpus,
      });
    }

    // ------------------------------------------------------------------
    // Recommendations
    // ------------------------------------------------------------------

    const suggestions: string[] = [];

    if (isShortfall) {
      if (nps < 5000) {
        suggestions.push(
          "Consider increasing NPS contribution under Section 80CCD(1B) — additional ₹50,000 tax deduction available",
        );
      }
      if (monthlyContribution < inflatedMonthlyExpenses * 0.3) {
        suggestions.push(
          `Your monthly investment of ₹${monthlyContribution.toLocaleString("en-IN")} is less than 30% of your future monthly expenses. Try to increase it to at least ₹${round2(inflatedMonthlyExpenses * 0.3).toLocaleString("en-IN")}`,
        );
      }
      suggestions.push(
        `You need to invest an additional ₹${additionalMonthlyNeeded.toLocaleString("en-IN")} per month to meet your retirement goal`,
      );
      suggestions.push(
        "Consider equity-oriented mutual funds (large cap, index funds) for long-term wealth creation — historically 12-15% returns over 10+ years",
      );
      if (currentAge < 40) {
        suggestions.push(
          "At your age, you can afford higher equity allocation (70-80%) for better long-term returns",
        );
      }
      if (epf === 0) {
        suggestions.push(
          "If employed, ensure you're contributing to EPF — employer contribution is essentially free money (8.1% guaranteed returns)",
        );
      }
      suggestions.push(
        "Public Provident Fund (PPF) offers 7.1% tax-free returns with 15-year lock-in — excellent for retirement planning",
      );
    } else {
      suggestions.push(
        `Great news! Your projected corpus exceeds your requirement by ₹${shortfallSurplus.toLocaleString("en-IN")}`,
      );
      suggestions.push(
        "Consider diversifying surplus into debt funds and gold for stability during market downturns",
      );
      if (currentAge > 45) {
        suggestions.push(
          "As you approach retirement, gradually shift from equity to debt (reduce equity to 40-50%) to protect your corpus",
        );
      }
      suggestions.push(
        "Consider purchasing a health insurance policy early — medical costs rise 12-15% annually in India",
      );
      suggestions.push(
        "You may consider early retirement or part-time work to enjoy a better quality of life",
      );
    }

    if (yearsInRetirement > 25) {
      suggestions.push(
        `With ${yearsInRetirement} years in retirement, ensure you plan for healthcare costs which can be 2-3x regular inflation`,
      );
    }

    const recommendationType = isShortfall
      ? "shortfall"
      : shortfallSurplus < corpusNeeded * 0.1
        ? "balanced"
        : "surplus";

    const recommendationMessage = isShortfall
      ? `You have a shortfall of ₹${Math.abs(shortfallSurplus).toLocaleString("en-IN")}. Additional ₹${additionalMonthlyNeeded.toLocaleString("en-IN")}/month needed.`
      : shortfallSurplus < corpusNeeded * 0.1
        ? `Your retirement plan is nearly balanced with a small surplus of ₹${shortfallSurplus.toLocaleString("en-IN")}. Consider a small buffer.`
        : `Your retirement plan looks healthy with a surplus of ₹${shortfallSurplus.toLocaleString("en-IN")}.`;

    const recommendations: Recommendation = {
      type: recommendationType,
      message: recommendationMessage,
      suggestions,
    };

    // ------------------------------------------------------------------
    // Response
    // ------------------------------------------------------------------

    const response: RetirementResponse = {
      currentAge,
      retirementAge,
      lifeExpectancy,
      yearsToRetire,
      yearsInRetirement,
      inflatedMonthlyExpenses,
      inflatedAnnualExpenses,
      corpusNeeded,
      withdrawalRate,
      futureValueCurrentSavings: fvCurrentSavings,
      futureValueEpf: fvEpf,
      futureValueNps: fvNps,
      futureValueMonthlyInvestments: fvMonthlyInvestments,
      totalAccumulated,
      shortfallSurplus,
      isShortfall,
      additionalMonthlyNeeded,
      yearlyProjection,
      recommendations,
    };

    return NextResponse.json(response);
  } catch (error) {
    console.error("[ArthSathi Retirement Calculator] Error:", error);
    return NextResponse.json(
      {
        error:
          "Failed to calculate retirement plan. Please check your inputs and try again.",
      },
      { status: 500 },
    );
  }
}
