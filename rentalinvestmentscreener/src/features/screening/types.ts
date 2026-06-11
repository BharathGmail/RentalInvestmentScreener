export type DealQuality = "Outperform" | "Monitor" | "Reprice";

export type PropertyStatus = "Live" | "Diligence" | "Watchlist";

export type InvestmentGoal = "Cash flow" | "Appreciation" | "Balanced";

export type RiskTolerance = "Conservative" | "Moderate" | "Aggressive";

export type PreferredPropertyType =
  | "Any"
  | "Condo"
  | "Single-family"
  | "Duplex"
  | "Multi-unit";

export type ComplianceStatus = "Eligible" | "Review" | "Blocked";

export type ValuePoint = {
  period: string;
  value: number;
};

export type NeighborhoodNews = {
  headline: string;
  source: string;
  date: string;
};

export type NeighborhoodInsight = {
  description: string;
  pros: string[];
  cons: string[];
  news: NeighborhoodNews[];
};

export type InvestorProfile = {
  availableCapital: number;
  downPaymentBudget: number;
  targetMarket: "San Francisco, CA";
  investmentGoal: InvestmentGoal;
  timeHorizonYears: number;
  riskTolerance: RiskTolerance;
  preferredPropertyType: PreferredPropertyType;
  plansPrimaryResidence: boolean;
};

export type PropertyCandidate = {
  id: string;
  name: string;
  address: string;
  market: "San Francisco, CA";
  neighborhood: string;
  zipCode: string;
  propertyType: Exclude<PreferredPropertyType, "Any">;
  bedroomCount: number;
  bathroomCount: number;
  squareFeet: number;
  status: PropertyStatus;
  strategy: string;
  source: string;
  imageUrls: string[];
  purchasePrice: number;
  currentEstimatedValue: number;
  estimatedNightlyRate: number;
  occupancyRate: number;
  cleaningFeesMonthly: number;
  platformFeesMonthly: number;
  managementFeesMonthly: number;
  taxesInsuranceUtilitiesMonthly: number;
  maintenanceReserveMonthly: number;
  estimatedMonthlyDebtService: number;
  cashInvested: number;
  minimumDownPayment: number;
  targetCapRate: number;
  targetCashOnCashReturn: number;
  targetAnnualAppreciation: number;
  riskRating: RiskTolerance;
  strRegistrationLikely: boolean;
  hoaAllowsShortTermRental: boolean;
  estimatedUnhostedNights: number;
  zoningNotes: string;
  complianceNotes: string[];
  mapPosition: {
    x: number;
    y: number;
  };
  neighborhoodInsight: NeighborhoodInsight;
  valueHistory: ValuePoint[];
};

export type ScreenedProperty = PropertyCandidate & {
  monthlyGrossRevenue: number;
  annualGrossRevenue: number;
  monthlyOperatingExpenses: number;
  monthlyNetOperatingIncome: number;
  monthlyCashFlow: number;
  annualNetOperatingIncome: number;
  annualCashFlow: number;
  capRate: number;
  cashOnCashReturn: number;
  valueChange: number;
  valueChangeRate: number;
  forecastValue: number;
  forecastValueChange: number;
  totalAnnualReturn: number;
  complianceStatus: ComplianceStatus;
  complianceScore: number;
  dealQuality: DealQuality;
};

export type RecommendedProperty = ScreenedProperty & {
  matchScore: number;
  capitalFitScore: number;
  returnFitScore: number;
  riskFitScore: number;
  propertyTypeFitScore: number;
  capitalGap: number;
  fitReasons: string[];
  cautionFlags: string[];
};

export type ScreeningSummary = {
  totalCandidates: number;
  totalAnnualGrossRevenue: number;
  totalMonthlyCashFlow: number;
  averageNightlyRate: number;
  averageOccupancyRate: number;
  averageCapRate: number;
  averageCashOnCashReturn: number;
  averageValueChangeRate: number;
  averageTotalAnnualReturn: number;
  appreciatingCount: number;
  depreciatingCount: number;
  topCandidate?: ScreenedProperty;
};

export type RecommendationSummary = ScreeningSummary & {
  averageMatchScore: number;
  eligibleCount: number;
  reviewCount: number;
  blockedCount: number;
  topRecommendation?: RecommendedProperty;
};
