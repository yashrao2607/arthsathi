# Task R3-R4: Calculator API Agent

## Task
Build EMI Calculator and Tax Calculator APIs for the ArthSathi financial advisory web app.

## Work Completed

### 1. EMI Calculator API (`/src/app/api/emi-calculator/route.ts`)
- Replaced the existing simple EMI calculator with a comprehensive implementation
- POST endpoint accepting: `principal`, `rate`, `tenure` (months), `type` (home|personal|car|education)
- Standard EMI formula with monthly compounding
- Monthly breakdown (first 12 + last 6 months, with `truncated` flag)
- Yearly amortization schedule
- Indian loan benchmarks for all 4 loan types
- Input validation with tenure limits per loan type and ₹10Cr cap

### 2. Tax Calculator API (`/src/app/api/tax-calculator/route.ts`)
- POST endpoint accepting: `income`, `regime` (old|new|both), `deductions` (optional)
- Old Regime: 4 slabs with standard deduction + 6 deduction categories
- New Regime (Budget 2024): 6 slabs with ₹75K standard deduction
- Section 87A rebate for both regimes
- Surcharge calculation (capped at 25% for new regime)
- 4% Health & Education Cess
- Regime comparison with savings and recommendation
- Effective tax rate calculation

### Test Results
- EMI for ₹50L home loan @9% for 20 years = ₹44,986.30 ✓
- Tax comparison for ₹12L income: Old ₹49,400 vs New ₹71,500 ✓
- Zero-rate EMI verified ✓
- Validation errors verified ✓
- ESLint passes ✓
