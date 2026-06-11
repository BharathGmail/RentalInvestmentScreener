import type {
  ComplianceStatus,
  DealQuality,
  InvestorProfile,
  PropertyCandidate,
  RecommendedProperty,
  RecommendationSummary,
  ScreenedProperty,
  ScreeningSummary,
} from "./types";

export const defaultInvestorProfile: InvestorProfile = {
  availableCapital: 425000,
  downPaymentBudget: 325000,
  targetMarket: "San Francisco, CA",
  investmentGoal: "Balanced",
  timeHorizonYears: 7,
  riskTolerance: "Moderate",
  preferredPropertyType: "Any",
  plansPrimaryResidence: true,
};

export function screenProperty(
  candidate: PropertyCandidate,
): ScreenedProperty {
  const monthlyGrossRevenue =
    (candidate.estimatedNightlyRate * 365 * candidate.occupancyRate) / 12;
  const annualGrossRevenue = monthlyGrossRevenue * 12;
  const monthlyOperatingExpenses =
    candidate.cleaningFeesMonthly +
    candidate.platformFeesMonthly +
    candidate.managementFeesMonthly +
    candidate.taxesInsuranceUtilitiesMonthly +
    candidate.maintenanceReserveMonthly;
  const monthlyNetOperatingIncome =
    monthlyGrossRevenue - monthlyOperatingExpenses;
  const monthlyCashFlow =
    monthlyNetOperatingIncome - candidate.estimatedMonthlyDebtService;
  const annualNetOperatingIncome = monthlyNetOperatingIncome * 12;
  const annualCashFlow = monthlyCashFlow * 12;
  const capRate = safeRatio(
    annualNetOperatingIncome,
    candidate.currentEstimatedValue,
  );
  const cashOnCashReturn = safeRatio(annualCashFlow, candidate.cashInvested);
  const valueChange =
    candidate.currentEstimatedValue - candidate.purchasePrice;
  const valueChangeRate = safeRatio(valueChange, candidate.purchasePrice);
  const forecastValue =
    candidate.currentEstimatedValue *
    (1 + candidate.targetAnnualAppreciation);
  const forecastValueChange = forecastValue - candidate.currentEstimatedValue;
  const totalAnnualReturn =
    cashOnCashReturn + candidate.targetAnnualAppreciation;
  const complianceStatus = getPropertyComplianceStatus(candidate);
  const complianceScore = getComplianceScore(complianceStatus);

  return {
    ...candidate,
    monthlyGrossRevenue,
    annualGrossRevenue,
    monthlyOperatingExpenses,
    monthlyNetOperatingIncome,
    monthlyCashFlow,
    annualNetOperatingIncome,
    annualCashFlow,
    capRate,
    cashOnCashReturn,
    valueChange,
    valueChangeRate,
    forecastValue,
    forecastValueChange,
    totalAnnualReturn,
    complianceStatus,
    complianceScore,
    dealQuality: classifyDeal(
      candidate,
      capRate,
      cashOnCashReturn,
      valueChangeRate,
      complianceStatus,
    ),
  };
}

export function recommendProperties(
  candidates: PropertyCandidate[],
  profile: InvestorProfile,
): RecommendedProperty[] {
  return candidates
    .map((candidate) => {
      const screenedProperty = screenProperty(candidate);
      const capitalFitScore = getCapitalFitScore(screenedProperty, profile);
      const returnFitScore = getReturnFitScore(screenedProperty, profile);
      const riskFitScore = getRiskFitScore(screenedProperty, profile);
      const propertyTypeFitScore = getPropertyTypeFitScore(
        screenedProperty,
        profile,
      );
      const complianceFitScore = profile.plansPrimaryResidence
        ? screenedProperty.complianceScore
        : Math.min(screenedProperty.complianceScore, 10);
      const capitalGap = Math.max(
        0,
        screenedProperty.minimumDownPayment - profile.downPaymentBudget,
      );
      const matchScore = Math.round(
        capitalFitScore * 0.2 +
          returnFitScore * 0.25 +
          riskFitScore * 0.15 +
          propertyTypeFitScore * 0.1 +
          complianceFitScore * 0.25 +
          100 * 0.05,
      );

      return {
        ...screenedProperty,
        matchScore,
        capitalFitScore,
        returnFitScore,
        riskFitScore,
        propertyTypeFitScore,
        capitalGap,
        fitReasons: getFitReasons(screenedProperty, profile),
        cautionFlags: getCautionFlags(screenedProperty, profile, capitalGap),
      };
    })
    .sort((first, second) => second.matchScore - first.matchScore);
}

export function summarizeScreeningPipeline(
  candidates: PropertyCandidate[],
): ScreeningSummary {
  const screenedProperties = candidates.map(screenProperty);
  const totalCandidates = screenedProperties.length;
  const totalAnnualGrossRevenue = screenedProperties.reduce(
    (total, property) => total + property.annualGrossRevenue,
    0,
  );
  const totalMonthlyCashFlow = screenedProperties.reduce(
    (total, property) => total + property.monthlyCashFlow,
    0,
  );
  const averageNightlyRate = average(
    screenedProperties.map((property) => property.estimatedNightlyRate),
  );
  const averageOccupancyRate = average(
    screenedProperties.map((property) => property.occupancyRate),
  );
  const averageCapRate = average(
    screenedProperties.map((property) => property.capRate),
  );
  const averageCashOnCashReturn = average(
    screenedProperties.map((property) => property.cashOnCashReturn),
  );
  const averageValueChangeRate = average(
    screenedProperties.map((property) => property.valueChangeRate),
  );
  const averageTotalAnnualReturn = average(
    screenedProperties.map((property) => property.totalAnnualReturn),
  );
  const appreciatingCount = screenedProperties.filter(
    (property) => property.valueChange >= 0,
  ).length;
  const depreciatingCount = screenedProperties.length - appreciatingCount;
  const topCandidate = [...screenedProperties].sort(
    (first, second) => second.totalAnnualReturn - first.totalAnnualReturn,
  )[0];

  return {
    totalCandidates,
    totalAnnualGrossRevenue,
    totalMonthlyCashFlow,
    averageNightlyRate,
    averageOccupancyRate,
    averageCapRate,
    averageCashOnCashReturn,
    averageValueChangeRate,
    averageTotalAnnualReturn,
    appreciatingCount,
    depreciatingCount,
    topCandidate,
  };
}

export function summarizeRecommendations(
  recommendations: RecommendedProperty[],
): RecommendationSummary {
  const baseSummary = summarizeScreeningPipeline(recommendations);
  const averageMatchScore = average(
    recommendations.map((property) => property.matchScore),
  );
  const eligibleCount = recommendations.filter(
    (property) => property.complianceStatus === "Eligible",
  ).length;
  const reviewCount = recommendations.filter(
    (property) => property.complianceStatus === "Review",
  ).length;
  const blockedCount = recommendations.filter(
    (property) => property.complianceStatus === "Blocked",
  ).length;

  return {
    ...baseSummary,
    averageMatchScore,
    eligibleCount,
    reviewCount,
    blockedCount,
    topRecommendation: recommendations[0],
  };
}

function classifyDeal(
  candidate: PropertyCandidate,
  capRate: number,
  cashOnCashReturn: number,
  valueChangeRate: number,
  complianceStatus: ComplianceStatus,
): DealQuality {
  const meetsCapRate = capRate >= candidate.targetCapRate;
  const meetsCashOnCash =
    cashOnCashReturn >= candidate.targetCashOnCashReturn;
  const hasPositiveValueTrend = valueChangeRate >= 0;

  if (
    meetsCapRate &&
    meetsCashOnCash &&
    hasPositiveValueTrend &&
    complianceStatus === "Eligible"
  ) {
    return "Outperform";
  }

  if (
    meetsCapRate ||
    meetsCashOnCash ||
    hasPositiveValueTrend ||
    complianceStatus === "Review"
  ) {
    return "Monitor";
  }

  return "Reprice";
}

function getPropertyComplianceStatus(
  candidate: PropertyCandidate,
): ComplianceStatus {
  if (!candidate.strRegistrationLikely) {
    return "Blocked";
  }

  if (
    !candidate.hoaAllowsShortTermRental ||
    candidate.estimatedUnhostedNights > 90
  ) {
    return "Review";
  }

  return "Eligible";
}

function getComplianceScore(status: ComplianceStatus) {
  if (status === "Eligible") {
    return 100;
  }

  if (status === "Review") {
    return 58;
  }

  return 18;
}

function getCapitalFitScore(
  property: ScreenedProperty,
  profile: InvestorProfile,
) {
  const downPaymentFit = Math.min(
    profile.downPaymentBudget / property.minimumDownPayment,
    1,
  );
  const totalCapitalFit = Math.min(
    profile.availableCapital / property.cashInvested,
    1,
  );

  return Math.round((downPaymentFit * 0.55 + totalCapitalFit * 0.45) * 100);
}

function getReturnFitScore(
  property: ScreenedProperty,
  profile: InvestorProfile,
) {
  const cashFlowScore = clamp(
    safeRatio(property.cashOnCashReturn, property.targetCashOnCashReturn) * 100,
    0,
    120,
  );
  const appreciationScore = clamp(
    safeRatio(
      property.targetAnnualAppreciation,
      profile.timeHorizonYears >= 7 ? 0.04 : 0.05,
    ) * 100,
    0,
    120,
  );
  const balancedScore = clamp(
    safeRatio(property.totalAnnualReturn, 0.09) * 100,
    0,
    120,
  );

  if (profile.investmentGoal === "Cash flow") {
    return Math.round(cashFlowScore * 0.72 + balancedScore * 0.28);
  }

  if (profile.investmentGoal === "Appreciation") {
    return Math.round(appreciationScore * 0.72 + balancedScore * 0.28);
  }

  return Math.round(
    balancedScore * 0.55 + cashFlowScore * 0.25 + appreciationScore * 0.2,
  );
}

function getRiskFitScore(
  property: ScreenedProperty,
  profile: InvestorProfile,
) {
  if (profile.riskTolerance === property.riskRating) {
    return 100;
  }

  if (profile.riskTolerance === "Conservative") {
    return property.riskRating === "Moderate" ? 72 : 38;
  }

  if (profile.riskTolerance === "Moderate") {
    return property.riskRating === "Conservative" ? 86 : 66;
  }

  return property.riskRating === "Moderate" ? 90 : 74;
}

function getPropertyTypeFitScore(
  property: ScreenedProperty,
  profile: InvestorProfile,
) {
  if (profile.preferredPropertyType === "Any") {
    return 100;
  }

  return profile.preferredPropertyType === property.propertyType ? 100 : 52;
}

function getFitReasons(
  property: ScreenedProperty,
  profile: InvestorProfile,
) {
  const reasons: string[] = [];

  if (profile.downPaymentBudget >= property.minimumDownPayment) {
    reasons.push("Fits the down payment budget");
  }

  if (
    profile.preferredPropertyType === "Any" ||
    profile.preferredPropertyType === property.propertyType
  ) {
    reasons.push("Matches the preferred property type");
  }

  if (profile.investmentGoal === "Cash flow" && property.cashOnCashReturn > 0) {
    reasons.push("Positive cash-on-cash return");
  }

  if (
    profile.investmentGoal === "Appreciation" &&
    property.targetAnnualAppreciation >= 0.04
  ) {
    reasons.push("Above-threshold appreciation outlook");
  }

  if (profile.investmentGoal === "Balanced") {
    reasons.push("Balances yield and appreciation");
  }

  if (
    property.complianceStatus === "Eligible" &&
    profile.plansPrimaryResidence
  ) {
    reasons.push("Cleaner San Francisco STR compliance profile");
  }

  return reasons.slice(0, 3);
}

function getCautionFlags(
  property: ScreenedProperty,
  profile: InvestorProfile,
  capitalGap: number,
) {
  const flags: string[] = [];

  if (capitalGap > 0) {
    flags.push("Down payment gap");
  }

  if (!profile.plansPrimaryResidence) {
    flags.push("SF STR path assumes primary residence");
  }

  if (!property.strRegistrationLikely) {
    flags.push("Registration eligibility risk");
  }

  if (!property.hoaAllowsShortTermRental) {
    flags.push("HOA restriction risk");
  }

  if (property.estimatedUnhostedNights > 90) {
    flags.push("Unhosted nights exceed guardrail");
  }

  if (
    profile.riskTolerance === "Conservative" &&
    property.riskRating === "Aggressive"
  ) {
    flags.push("Risk above profile");
  }

  return flags.slice(0, 4);
}

function average(values: number[]) {
  if (values.length === 0) {
    return 0;
  }

  return values.reduce((total, value) => total + value, 0) / values.length;
}

function safeRatio(numerator: number, denominator: number) {
  if (denominator === 0) {
    return 0;
  }

  return numerator / denominator;
}

function clamp(value: number, min: number, max: number) {
  return Math.min(Math.max(value, min), max);
}
