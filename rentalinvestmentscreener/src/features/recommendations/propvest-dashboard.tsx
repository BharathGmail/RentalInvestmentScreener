"use client";

import { useMemo, useState } from "react";
import { MetricCard } from "@/components/metric-card";
import { ValueTrendChart } from "@/components/value-trend-chart";
import { propertyCandidates } from "@/features/screening/property-candidates";
import {
  defaultInvestorProfile,
  recommendProperties,
  summarizeRecommendations,
} from "@/features/screening/metrics";
import type {
  ComplianceStatus,
  InvestmentGoal,
  InvestorProfile,
  PreferredPropertyType,
  RecommendedProperty,
  RiskTolerance,
} from "@/features/screening/types";
import {
  formatCurrency,
  formatPercent,
  formatSignedPercent,
} from "@/lib/number-format";

type ActiveView = "list" | "map";

const investmentGoals: InvestmentGoal[] = [
  "Balanced",
  "Cash flow",
  "Appreciation",
];
const riskTolerances: RiskTolerance[] = [
  "Conservative",
  "Moderate",
  "Aggressive",
];
const propertyTypes: PreferredPropertyType[] = [
  "Any",
  "Condo",
  "Single-family",
  "Duplex",
  "Multi-unit",
];
const radiusOptions = ["All SF", "1 mile", "3 miles", "5 miles"];

const complianceStyles: Record<ComplianceStatus, string> = {
  Blocked: "bg-rose-50 text-rose-700 ring-rose-200",
  Eligible: "bg-emerald-50 text-emerald-700 ring-emerald-200",
  Review: "bg-amber-50 text-amber-700 ring-amber-200",
};

const scoreStyles = {
  high: "text-emerald-700",
  low: "text-rose-700",
  medium: "text-amber-700",
};

export function PropVestDashboard() {
  const [profile, setProfile] = useState<InvestorProfile>(
    defaultInvestorProfile,
  );
  const [zipCode, setZipCode] = useState("");
  const [appliedZipCode, setAppliedZipCode] = useState("");
  const [radius, setRadius] = useState(radiusOptions[0]);
  const [hasSearched, setHasSearched] = useState(false);
  const [activeView, setActiveView] = useState<ActiveView>("list");

  const recommendations = useMemo(
    () => recommendProperties(propertyCandidates, profile),
    [profile],
  );
  const filteredRecommendations = useMemo(
    () => filterRecommendations(recommendations, appliedZipCode),
    [appliedZipCode, recommendations],
  );
  const summary = useMemo(
    () => summarizeRecommendations(filteredRecommendations),
    [filteredRecommendations],
  );
  const [selectedPropertyId, setSelectedPropertyId] = useState(
    recommendations[0]?.id,
  );
  const selectedProperty =
    filteredRecommendations.find(
      (property) => property.id === selectedPropertyId,
    ) ?? filteredRecommendations[0];

  function updateProfile(partialProfile: Partial<InvestorProfile>) {
    setProfile((currentProfile) => ({
      ...currentProfile,
      ...partialProfile,
    }));
  }

  function applySearch() {
    const normalizedZipCode = zipCode.trim();
    setAppliedZipCode(normalizedZipCode.length === 5 ? normalizedZipCode : "");
    setHasSearched(true);
  }

  return (
    <main className="mx-auto flex w-full max-w-7xl flex-1 flex-col gap-5 px-4 py-5 sm:px-6 lg:py-6">
      <HeroMasthead />

      <section className="grid min-h-[34rem] gap-5 lg:grid-cols-[18rem_minmax(0,1fr)]">
        <aside className="flex flex-col gap-4" id="profile">
          <SearchScopePanel
            applySearch={applySearch}
            hasSearched={hasSearched}
            radius={radius}
            resultCount={filteredRecommendations.length}
            setRadius={setRadius}
            setZipCode={setZipCode}
            zipCode={zipCode}
          />
          <InvestorProfilePanel
            profile={profile}
            updateProfile={updateProfile}
          />
        </aside>

        <div className="flex min-w-0 flex-col gap-5">
          <section className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_23rem]">
            <div className="min-w-0">
              <div
                aria-label="Recommendation metrics"
                className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4"
                data-refresh-scope="recommendation-kpis"
              >
                <MetricCard
                  description="Average investor-fit score for the current result set."
                  label="Match score"
                  tone={getScoreTone(summary.averageMatchScore)}
                  value={`${Math.round(summary.averageMatchScore)}`}
                />
                <MetricCard
                  description="Properties with the cleanest prototype STR compliance signal."
                  label="Eligible signals"
                  tone="positive"
                  trend={`${summary.reviewCount} review / ${summary.blockedCount} blocked`}
                  value={summary.eligibleCount.toString()}
                />
                <MetricCard
                  description="Best projected total return after investor-fit scoring."
                  label="Top return"
                  tone="accent"
                  value={formatPercent(
                    summary.topRecommendation?.totalAnnualReturn ?? 0,
                  )}
                />
                <MetricCard
                  description="Budget shortfall for the current top recommendation."
                  label="Capital gap"
                  tone={
                    (summary.topRecommendation?.capitalGap ?? 0) > 0
                      ? "negative"
                      : "positive"
                  }
                  value={formatCurrency(
                    summary.topRecommendation?.capitalGap ?? 0,
                  )}
                />
              </div>
            </div>

            <aside
              aria-live="polite"
              className="rounded-lg border border-zinc-200 bg-white p-5 shadow-sm"
              data-refresh-scope="top-recommendation"
              id="match"
            >
              {summary.topRecommendation ? (
                <TopRecommendation property={summary.topRecommendation} />
              ) : (
                <EmptyState title="No matching properties for this ZIP." />
              )}
            </aside>
          </section>

          <section
            className="overflow-hidden rounded-lg border border-zinc-200 bg-white shadow-sm"
            data-refresh-scope="results-workspace"
            id="recommendations"
          >
            <div className="flex flex-col gap-3 border-b border-zinc-200 px-5 py-4 sm:flex-row sm:items-end sm:justify-between">
              <div>
                <h2 className="text-xl font-semibold tracking-normal text-zinc-950">
                  San Francisco recommendations
                </h2>
                <p className="mt-1 text-sm leading-6 text-zinc-600">
                  {hasSearched
                    ? `Showing ${filteredRecommendations.length} properties within ${radius}${
                        appliedZipCode ? ` of ${appliedZipCode}` : ""
                      }.`
                    : "Use the search rail to focus by ZIP, or review all San Francisco candidates."}
                </p>
              </div>
              <ViewTabs activeView={activeView} setActiveView={setActiveView} />
            </div>

            {activeView === "list" ? (
              <ListView
                recommendations={filteredRecommendations}
                selectedPropertyId={selectedProperty?.id}
                selectProperty={setSelectedPropertyId}
              />
            ) : (
              <MapView
                recommendations={filteredRecommendations}
                selectedPropertyId={selectedProperty?.id}
                selectProperty={setSelectedPropertyId}
              />
            )}
          </section>

          <section className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_23rem]">
            <RecommendationTable
              recommendations={filteredRecommendations}
              selectedPropertyId={selectedProperty?.id}
              selectProperty={setSelectedPropertyId}
            />

            <aside
              aria-live="polite"
              className="rounded-lg border border-zinc-200 bg-white p-5 shadow-sm"
              data-refresh-scope="selected-property-detail"
              id="compliance"
            >
              {selectedProperty ? (
                <SelectedPropertyDetail property={selectedProperty} />
              ) : (
                <EmptyState title="Select a property" />
              )}
            </aside>
          </section>
        </div>
      </section>

      <section
        className="grid gap-4 rounded-lg border border-zinc-200 bg-white p-5 shadow-sm md:grid-cols-4"
        id="data"
      >
        <ObjectiveCard
          body="The model starts with San Francisco-only candidate data and keeps the market fixed in the investor profile."
          title="Market focus"
        />
        <ObjectiveCard
          body="Each property carries revenue, cost, financing, appreciation, and capital requirement inputs."
          title="Financial engine"
        />
        <ObjectiveCard
          body="Compliance scoring flags primary-residence, registration, HOA, and unhosted-night diligence."
          title="Regulatory layer"
        />
        <ObjectiveCard
          body="Profile changes recompute recommendations through React state without a full browser refresh."
          title="Scoped updates"
        />
      </section>
    </main>
  );
}

function HeroMasthead() {
  return (
    <section
      className="relative overflow-hidden rounded-lg border border-zinc-200 bg-zinc-950"
      id="search"
    >
      <div
        className="absolute inset-0 bg-cover bg-top opacity-65"
        style={{
          backgroundImage: "url('/sf-property-search-wireframe.png')",
        }}
      />
      <div className="absolute inset-0 bg-zinc-950/55" />
      <div className="relative flex min-h-44 flex-col justify-end px-5 py-6 text-white sm:min-h-52 sm:px-8">
        <p className="text-sm font-semibold uppercase tracking-normal text-white/75">
          San Francisco property search
        </p>
        <h1 className="mt-2 max-w-3xl text-3xl font-semibold tracking-normal sm:text-4xl">
          Find the right property for your capital, risk, and compliance path.
        </h1>
        <p className="mt-3 max-w-2xl text-sm leading-6 text-white/80 sm:text-base">
          A focused recommendation workspace inspired by the wireframe: simple
          filters, list/map exploration, property cards, and neighborhood
          intelligence in one view.
        </p>
      </div>
    </section>
  );
}

function SearchScopePanel({
  applySearch,
  hasSearched,
  radius,
  resultCount,
  setRadius,
  setZipCode,
  zipCode,
}: {
  applySearch: () => void;
  hasSearched: boolean;
  radius: string;
  resultCount: number;
  setRadius: (radius: string) => void;
  setZipCode: (zipCode: string) => void;
  zipCode: string;
}) {
  return (
    <section
      className="rounded-lg border border-zinc-200 bg-white p-5 shadow-sm"
      data-refresh-scope="search-filters"
    >
      <h2 className="text-xs font-semibold uppercase tracking-wider text-zinc-500">
        Search filters
      </h2>
      <div className="mt-4 space-y-4">
        <label className="block">
          <span className="text-sm font-medium text-zinc-700">ZIP code</span>
          <input
            className="mt-2 w-full rounded-md border border-zinc-200 bg-zinc-50 px-3 py-2 text-sm font-semibold text-zinc-950 outline-none transition focus:border-sky-500 focus:ring-2 focus:ring-sky-100"
            inputMode="numeric"
            maxLength={5}
            onChange={(event) =>
              setZipCode(event.target.value.replace(/\D/g, ""))
            }
            placeholder="e.g. 94114"
            type="text"
            value={zipCode}
          />
        </label>

        <label className="block">
          <span className="text-sm font-medium text-zinc-700">
            Search radius
          </span>
          <select
            className="mt-2 w-full rounded-md border border-zinc-200 bg-zinc-50 px-3 py-2 text-sm font-semibold text-zinc-950 outline-none transition focus:border-sky-500 focus:ring-2 focus:ring-sky-100"
            onChange={(event) => setRadius(event.target.value)}
            value={radius}
          >
            {radiusOptions.map((option) => (
              <option key={option} value={option}>
                {option}
              </option>
            ))}
          </select>
        </label>

        <button
          className="w-full rounded-md bg-zinc-950 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-zinc-800"
          onClick={applySearch}
          type="button"
        >
          Search
        </button>

        <p className="text-xs leading-5 text-zinc-500">
          {hasSearched
            ? `Showing ${resultCount} matching properties.`
            : "Start with a ZIP, or leave blank for all San Francisco."}
        </p>
      </div>
    </section>
  );
}

function InvestorProfilePanel({
  profile,
  updateProfile,
}: {
  profile: InvestorProfile;
  updateProfile: (partialProfile: Partial<InvestorProfile>) => void;
}) {
  return (
    <section
      className="rounded-lg border border-zinc-200 bg-white p-5 shadow-sm"
      data-refresh-scope="investor-profile-controls"
    >
      <div>
        <h2 className="text-xs font-semibold uppercase tracking-wider text-zinc-500">
          Investor profile
        </h2>
        <p className="mt-2 text-sm leading-6 text-zinc-600">
          Target market is fixed to San Francisco.
        </p>
      </div>

      <div className="mt-5 space-y-5">
        <NumberField
          label="Available capital"
          min={0}
          step={25000}
          value={profile.availableCapital}
          updateValue={(value) => updateProfile({ availableCapital: value })}
        />
        <NumberField
          label="Down payment budget"
          min={0}
          step={25000}
          value={profile.downPaymentBudget}
          updateValue={(value) => updateProfile({ downPaymentBudget: value })}
        />
        <NumberField
          label="Time horizon"
          min={1}
          step={1}
          suffix="years"
          value={profile.timeHorizonYears}
          updateValue={(value) => updateProfile({ timeHorizonYears: value })}
        />
        <SegmentedControl
          label="Investment goal"
          options={investmentGoals}
          value={profile.investmentGoal}
          updateValue={(value) => updateProfile({ investmentGoal: value })}
        />
        <SegmentedControl
          label="Risk tolerance"
          options={riskTolerances}
          value={profile.riskTolerance}
          updateValue={(value) => updateProfile({ riskTolerance: value })}
        />
        <SegmentedControl
          label="Property type"
          options={propertyTypes}
          value={profile.preferredPropertyType}
          updateValue={(value) =>
            updateProfile({ preferredPropertyType: value })
          }
        />
        <BinaryToggle
          falseLabel="No"
          label="Primary residence plan"
          trueLabel="Yes"
          updateValue={(value) => updateProfile({ plansPrimaryResidence: value })}
          value={profile.plansPrimaryResidence}
        />
      </div>
    </section>
  );
}

function NumberField({
  label,
  min,
  step,
  suffix,
  updateValue,
  value,
}: {
  label: string;
  min: number;
  step: number;
  suffix?: string;
  updateValue: (value: number) => void;
  value: number;
}) {
  return (
    <label className="block">
      <span className="text-sm font-medium text-zinc-700">{label}</span>
      <div className="mt-2 flex items-center rounded-md border border-zinc-200 bg-zinc-50 px-3 py-2 focus-within:border-sky-500 focus-within:ring-2 focus-within:ring-sky-100">
        <input
          className="min-w-0 flex-1 bg-transparent text-sm font-semibold text-zinc-950 outline-none"
          min={min}
          onChange={(event) => updateValue(Number(event.target.value))}
          step={step}
          type="number"
          value={value}
        />
        {suffix ? (
          <span className="ml-2 text-sm text-zinc-500">{suffix}</span>
        ) : null}
      </div>
    </label>
  );
}

function SegmentedControl<T extends string>({
  label,
  options,
  updateValue,
  value,
}: {
  label: string;
  options: T[];
  updateValue: (value: T) => void;
  value: T;
}) {
  return (
    <div>
      <p className="text-sm font-medium text-zinc-700">{label}</p>
      <div className="mt-2 grid gap-2 rounded-md bg-zinc-100 p-1">
        {options.map((option) => {
          const isSelected = option === value;

          return (
            <button
              className={`rounded-md px-3 py-2 text-left text-sm font-semibold transition ${
                isSelected
                  ? "bg-white text-zinc-950 shadow-sm"
                  : "text-zinc-600 hover:text-zinc-950"
              }`}
              key={option}
              onClick={() => updateValue(option)}
              type="button"
            >
              {option}
            </button>
          );
        })}
      </div>
    </div>
  );
}

function BinaryToggle({
  falseLabel,
  label,
  trueLabel,
  updateValue,
  value,
}: {
  falseLabel: string;
  label: string;
  trueLabel: string;
  updateValue: (value: boolean) => void;
  value: boolean;
}) {
  return (
    <div>
      <p className="text-sm font-medium text-zinc-700">{label}</p>
      <div className="mt-2 grid grid-cols-2 gap-2 rounded-md bg-zinc-100 p-1">
        {[true, false].map((option) => {
          const isSelected = value === option;

          return (
            <button
              className={`rounded-md px-3 py-2 text-sm font-semibold transition ${
                isSelected
                  ? "bg-white text-zinc-950 shadow-sm"
                  : "text-zinc-600 hover:text-zinc-950"
              }`}
              key={option ? "true" : "false"}
              onClick={() => updateValue(option)}
              type="button"
            >
              {option ? trueLabel : falseLabel}
            </button>
          );
        })}
      </div>
    </div>
  );
}

function ViewTabs({
  activeView,
  setActiveView,
}: {
  activeView: ActiveView;
  setActiveView: (view: ActiveView) => void;
}) {
  return (
    <div className="grid grid-cols-2 gap-1 rounded-md bg-zinc-100 p-1">
      {(["list", "map"] as ActiveView[]).map((view) => {
        const isActive = activeView === view;

        return (
          <button
            className={`rounded-md px-4 py-2 text-sm font-semibold capitalize transition ${
              isActive
                ? "bg-white text-zinc-950 shadow-sm"
                : "text-zinc-600 hover:text-zinc-950"
            }`}
            key={view}
            onClick={() => setActiveView(view)}
            type="button"
          >
            {view} view
          </button>
        );
      })}
    </div>
  );
}

function ListView({
  recommendations,
  selectedPropertyId,
  selectProperty,
}: {
  recommendations: RecommendedProperty[];
  selectedPropertyId?: string;
  selectProperty: (propertyId: string) => void;
}) {
  if (recommendations.length === 0) {
    return (
      <div className="p-5">
        <EmptyState title="No properties match the current ZIP filter." />
      </div>
    );
  }

  return (
    <div className="grid gap-4 p-5 xl:grid-cols-3">
      {recommendations.slice(0, 3).map((property) => (
        <RecommendationCard
          isSelected={property.id === selectedPropertyId}
          key={property.id}
          property={property}
          selectProperty={selectProperty}
        />
      ))}
    </div>
  );
}

function MapView({
  recommendations,
  selectedPropertyId,
  selectProperty,
}: {
  recommendations: RecommendedProperty[];
  selectedPropertyId?: string;
  selectProperty: (propertyId: string) => void;
}) {
  if (recommendations.length === 0) {
    return (
      <div className="p-5">
        <EmptyState title="No map markers for the current ZIP filter." />
      </div>
    );
  }

  return (
    <div className="grid gap-5 p-5 lg:grid-cols-[minmax(0,1fr)_18rem]">
      <div className="relative min-h-80 overflow-hidden rounded-lg border border-zinc-200 bg-zinc-100">
        <div className="absolute inset-0 bg-[linear-gradient(90deg,rgba(255,255,255,0.55)_1px,transparent_1px),linear-gradient(180deg,rgba(255,255,255,0.55)_1px,transparent_1px)] bg-[size:48px_48px]" />
        <div className="absolute inset-x-8 top-12 h-14 rotate-[-12deg] rounded-full bg-sky-100/80" />
        <div className="absolute bottom-10 left-8 right-8 h-16 rotate-[8deg] rounded-full bg-emerald-100/80" />
        <span className="absolute left-5 top-4 rounded-full bg-white px-3 py-1 text-xs font-semibold text-zinc-600 shadow-sm ring-1 ring-zinc-200">
          Schematic SF map
        </span>
        {recommendations.map((property) => {
          const isSelected = property.id === selectedPropertyId;

          return (
            <button
              className={`absolute -translate-x-1/2 -translate-y-1/2 rounded-full border-2 bg-white p-1 shadow-sm transition hover:scale-105 ${
                isSelected
                  ? "border-sky-500 ring-4 ring-sky-100"
                  : "border-white"
              }`}
              key={property.id}
              onClick={() => selectProperty(property.id)}
              style={{
                left: `${property.mapPosition.x}%`,
                top: `${property.mapPosition.y}%`,
              }}
              type="button"
            >
              <span
                className={`flex h-10 w-10 items-center justify-center rounded-full text-xs font-bold ${
                  property.matchScore >= 80
                    ? "bg-emerald-100 text-emerald-700"
                    : property.matchScore >= 60
                      ? "bg-amber-100 text-amber-700"
                      : "bg-rose-100 text-rose-700"
                }`}
              >
                {property.matchScore}
              </span>
            </button>
          );
        })}
      </div>

      <div className="space-y-3">
        {recommendations.map((property) => (
          <button
            className={`w-full rounded-md border px-3 py-2 text-left text-sm transition ${
              property.id === selectedPropertyId
                ? "border-sky-300 bg-sky-50"
                : "border-zinc-200 bg-white hover:border-sky-300"
            }`}
            key={property.id}
            onClick={() => selectProperty(property.id)}
            type="button"
          >
            <span className="block font-semibold text-zinc-950">
              {property.neighborhood}
            </span>
            <span className="mt-1 block text-zinc-500">
              {property.name} | {property.matchScore} match
            </span>
          </button>
        ))}
      </div>
    </div>
  );
}

function TopRecommendation({ property }: { property: RecommendedProperty }) {
  return (
    <div>
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-sm font-medium text-zinc-500">Best match</p>
          <h2 className="mt-2 text-2xl font-semibold tracking-normal text-zinc-950">
            {property.name}
          </h2>
          <p className="mt-1 text-sm text-zinc-500">
            {property.neighborhood} | {property.propertyType}
          </p>
        </div>
        <ScoreBadge score={property.matchScore} />
      </div>
      <div className="mt-5">
        <ValueTrendChart
          points={property.valueHistory}
          positive={property.valueChange >= 0}
        />
      </div>
      <div className="mt-5 grid grid-cols-2 gap-4 text-sm">
        <Metric
          label="Total return"
          value={formatPercent(property.totalAnnualReturn)}
        />
        <Metric
          label="Cash-on-cash"
          value={formatPercent(property.cashOnCashReturn)}
        />
        <Metric
          label="Capital needed"
          value={formatCurrency(property.minimumDownPayment)}
        />
        <Metric
          label="Value move"
          tone={property.valueChange >= 0 ? "positive" : "negative"}
          value={formatSignedPercent(property.valueChangeRate)}
        />
      </div>
    </div>
  );
}

function RecommendationCard({
  isSelected,
  property,
  selectProperty,
}: {
  isSelected: boolean;
  property: RecommendedProperty;
  selectProperty: (propertyId: string) => void;
}) {
  return (
    <button
      className={`rounded-lg border bg-white p-5 text-left transition hover:border-sky-300 ${
        isSelected ? "border-sky-400 ring-2 ring-sky-100" : "border-zinc-200"
      }`}
      onClick={() => selectProperty(property.id)}
      type="button"
    >
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-sm font-medium text-zinc-500">
            {property.address}
          </p>
          <h3 className="mt-2 text-lg font-semibold tracking-normal text-zinc-950">
            {property.name}
          </h3>
          <p className="mt-1 text-sm text-zinc-500">
            {property.bedroomCount} bd | {property.bathroomCount} ba |{" "}
            {property.squareFeet.toLocaleString()} sqft
          </p>
        </div>
        <ScoreBadge score={property.matchScore} />
      </div>
      <div className="mt-4 grid grid-cols-2 gap-3 text-sm">
        <Metric
          label="Price"
          value={formatCurrency(property.currentEstimatedValue)}
        />
        <Metric label="ZIP" value={property.zipCode} />
        <Metric
          label="Cash flow"
          value={formatCurrency(property.monthlyCashFlow)}
        />
        <Metric
          label="Compliance"
          value={property.complianceStatus}
          valueClassName={
            property.complianceStatus === "Eligible"
              ? "text-emerald-700"
              : property.complianceStatus === "Review"
                ? "text-amber-700"
                : "text-rose-700"
          }
        />
      </div>
      <p className="mt-4 text-sm leading-6 text-zinc-600">
        {property.neighborhoodInsight.description}
      </p>
    </button>
  );
}

function RecommendationTable({
  recommendations,
  selectProperty,
  selectedPropertyId,
}: {
  recommendations: RecommendedProperty[];
  selectProperty: (propertyId: string) => void;
  selectedPropertyId?: string;
}) {
  return (
    <section
      className="overflow-hidden rounded-lg border border-zinc-200 bg-white shadow-sm"
      data-refresh-scope="recommendation-table"
    >
      <div className="flex flex-col gap-2 border-b border-zinc-200 px-5 py-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h2 className="text-xl font-semibold tracking-normal text-zinc-950">
            Ranked details
          </h2>
          <p className="mt-1 text-sm leading-6 text-zinc-600">
            Scores combine investor fit, returns, capital fit, risk, and SF
            compliance constraints.
          </p>
        </div>
        <p className="text-sm font-medium text-zinc-500">
          {recommendations.length} results
        </p>
      </div>

      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-zinc-200 text-left text-sm">
          <thead className="bg-zinc-50 text-xs font-semibold uppercase tracking-normal text-zinc-500">
            <tr>
              <th scope="col" className="px-5 py-3">
                Property
              </th>
              <th scope="col" className="px-5 py-3">
                Match
              </th>
              <th scope="col" className="px-5 py-3">
                Capital
              </th>
              <th scope="col" className="px-5 py-3">
                Return
              </th>
              <th scope="col" className="px-5 py-3">
                Compliance
              </th>
              <th scope="col" className="px-5 py-3">
                Action
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-zinc-100">
            {recommendations.map((property) => (
              <tr
                className={`align-top ${
                  property.id === selectedPropertyId ? "bg-sky-50/40" : ""
                }`}
                key={property.id}
              >
                <td className="px-5 py-4">
                  <div className="font-medium text-zinc-950">
                    {property.name}
                  </div>
                  <div className="mt-1 text-zinc-500">
                    {property.neighborhood} | {property.zipCode} |{" "}
                    {property.propertyType}
                  </div>
                </td>
                <td className="px-5 py-4 font-semibold text-zinc-950">
                  {property.matchScore}
                </td>
                <td className="px-5 py-4 text-zinc-700">
                  {formatCurrency(property.minimumDownPayment)}
                  {property.capitalGap > 0 ? (
                    <div className="mt-1 text-xs font-semibold text-rose-700">
                      {formatCurrency(property.capitalGap)} gap
                    </div>
                  ) : null}
                </td>
                <td className="px-5 py-4">
                  <div className="font-medium text-zinc-950">
                    {formatPercent(property.totalAnnualReturn)}
                  </div>
                  <div className="mt-1 text-zinc-500">
                    {formatCurrency(property.monthlyCashFlow)} monthly
                  </div>
                </td>
                <td className="px-5 py-4">
                  <span
                    className={`inline-flex rounded-full px-2.5 py-1 text-xs font-semibold ring-1 ${complianceStyles[property.complianceStatus]}`}
                  >
                    {property.complianceStatus}
                  </span>
                </td>
                <td className="px-5 py-4">
                  <button
                    className="rounded-md bg-zinc-950 px-3 py-2 text-xs font-semibold text-white transition hover:bg-zinc-800"
                    onClick={() => selectProperty(property.id)}
                    type="button"
                  >
                    Inspect
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}

function SelectedPropertyDetail({ property }: { property: RecommendedProperty }) {
  return (
    <div>
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-sm font-medium text-zinc-500">
            Neighborhood intelligence
          </p>
          <h2 className="mt-2 text-xl font-semibold tracking-normal text-zinc-950">
            {property.neighborhood}
          </h2>
        </div>
        <span
          className={`rounded-full px-2.5 py-1 text-xs font-semibold ring-1 ${complianceStyles[property.complianceStatus]}`}
        >
          {property.complianceStatus}
        </span>
      </div>

      <p className="mt-4 text-sm leading-6 text-zinc-700">
        {property.neighborhoodInsight.description}
      </p>

      <div className="mt-5 grid grid-cols-2 gap-4 text-sm">
        <Metric
          label="Registration"
          value={property.strRegistrationLikely ? "Likely" : "Risk"}
        />
        <Metric
          label="HOA"
          value={property.hoaAllowsShortTermRental ? "Allows" : "Review"}
        />
        <Metric
          label="Unhosted nights"
          value={property.estimatedUnhostedNights.toString()}
        />
        <Metric label="Risk profile" value={property.riskRating} />
      </div>

      <ProsCons property={property} />

      <div className="mt-5 rounded-lg bg-zinc-50 p-4">
        <h3 className="text-sm font-semibold text-zinc-950">Recent signals</h3>
        <div className="mt-3 space-y-3">
          {property.neighborhoodInsight.news.map((item) => (
            <article
              className="rounded-md border border-zinc-200 bg-white px-3 py-2"
              key={item.headline}
            >
              <p className="text-sm font-medium leading-5 text-zinc-950">
                {item.headline}
              </p>
              <p className="mt-1 text-xs text-zinc-500">
                {item.source} | {item.date}
              </p>
            </article>
          ))}
        </div>
      </div>

      <div className="mt-5 border-t border-zinc-100 pt-4">
        <p className="text-sm font-medium text-zinc-500">Zoning notes</p>
        <p className="mt-2 text-sm leading-6 text-zinc-700">
          {property.zoningNotes}
        </p>
      </div>

      <div className="mt-5 border-t border-zinc-100 pt-4">
        <p className="text-sm font-medium text-zinc-500">Diligence notes</p>
        <ul className="mt-2 list-disc space-y-2 pl-5 text-sm leading-6 text-zinc-700">
          {property.complianceNotes.map((note) => (
            <li key={note}>{note}</li>
          ))}
        </ul>
      </div>
    </div>
  );
}

function ProsCons({ property }: { property: RecommendedProperty }) {
  return (
    <div className="mt-5 grid gap-4 sm:grid-cols-2">
      <div>
        <h3 className="text-xs font-semibold uppercase tracking-wider text-emerald-700">
          Pros
        </h3>
        <ul className="mt-3 space-y-2 text-sm leading-6 text-zinc-700">
          {property.neighborhoodInsight.pros.map((item) => (
            <li className="flex gap-2" key={item}>
              <span className="font-semibold text-emerald-600">+</span>
              <span>{item}</span>
            </li>
          ))}
        </ul>
      </div>
      <div>
        <h3 className="text-xs font-semibold uppercase tracking-wider text-rose-700">
          Cons
        </h3>
        <ul className="mt-3 space-y-2 text-sm leading-6 text-zinc-700">
          {property.neighborhoodInsight.cons.map((item) => (
            <li className="flex gap-2" key={item}>
              <span className="font-semibold text-rose-600">-</span>
              <span>{item}</span>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}

function ObjectiveCard({ body, title }: { body: string; title: string }) {
  return (
    <article>
      <h2 className="text-sm font-semibold text-zinc-950">{title}</h2>
      <p className="mt-2 text-sm leading-6 text-zinc-600">{body}</p>
    </article>
  );
}

function Metric({
  label,
  tone = "neutral",
  value,
  valueClassName,
}: {
  label: string;
  tone?: "neutral" | "positive" | "negative";
  value: string;
  valueClassName?: string;
}) {
  const toneClass =
    valueClassName ??
    (tone === "positive"
      ? "text-emerald-700"
      : tone === "negative"
        ? "text-rose-700"
        : "text-zinc-950");

  return (
    <div>
      <p className="text-zinc-500">{label}</p>
      <p className={`mt-1 font-semibold ${toneClass}`}>{value}</p>
    </div>
  );
}

function ScoreBadge({ score }: { score: number }) {
  const toneClass =
    score >= 80
      ? scoreStyles.high
      : score >= 60
        ? scoreStyles.medium
        : scoreStyles.low;

  return (
    <span
      className={`inline-flex h-12 w-12 items-center justify-center rounded-full bg-zinc-50 text-sm font-bold ring-1 ring-zinc-200 ${toneClass}`}
    >
      {score}
    </span>
  );
}

function EmptyState({ title }: { title: string }) {
  return (
    <div className="rounded-lg border border-dashed border-zinc-300 p-5 text-sm text-zinc-500">
      {title}
    </div>
  );
}

function filterRecommendations(
  recommendations: RecommendedProperty[],
  zipCode: string,
) {
  if (zipCode.length !== 5) {
    return recommendations;
  }

  return recommendations.filter((property) => property.zipCode === zipCode);
}

function getScoreTone(score: number): "positive" | "accent" | "negative" {
  if (score >= 80) {
    return "positive";
  }

  if (score >= 60) {
    return "accent";
  }

  return "negative";
}
