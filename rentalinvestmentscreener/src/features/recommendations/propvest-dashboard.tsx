"use client";

import Image from "next/image";
import { useMemo, useState } from "react";
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
  high: "bg-emerald-50 text-emerald-700 ring-emerald-200",
  low: "bg-rose-50 text-rose-700 ring-rose-200",
  medium: "bg-amber-50 text-amber-700 ring-amber-200",
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
  const [isFilterPanelOpen, setIsFilterPanelOpen] = useState(false);

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
    setIsFilterPanelOpen(false);
  }

  return (
    <>
      <FilterDrawer
        applySearch={applySearch}
        closePanel={() => setIsFilterPanelOpen(false)}
        hasSearched={hasSearched}
        isOpen={isFilterPanelOpen}
        profile={profile}
        radius={radius}
        resultCount={filteredRecommendations.length}
        setRadius={setRadius}
        setZipCode={setZipCode}
        updateProfile={updateProfile}
        zipCode={zipCode}
      />

      <main className="mx-auto flex w-full max-w-6xl flex-1 flex-col gap-5 px-4 py-5 sm:px-6 lg:py-6">
        <HeroMasthead />

        <DashboardToolbar
          appliedZipCode={appliedZipCode}
          hasSearched={hasSearched}
          isFilterPanelOpen={isFilterPanelOpen}
          openFilters={() => setIsFilterPanelOpen(true)}
          radius={radius}
          resultCount={filteredRecommendations.length}
        />

        <SummaryStrip
          averageMatchScore={summary.averageMatchScore}
          blockedCount={summary.blockedCount}
          eligibleCount={summary.eligibleCount}
          topRecommendation={summary.topRecommendation}
          totalResults={filteredRecommendations.length}
        />

        <section className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_22rem]">
          <section
            className="min-w-0 overflow-hidden rounded-lg border border-zinc-200 bg-white shadow-sm"
            data-refresh-scope="results-workspace"
            id="results"
          >
            <div className="flex flex-col gap-3 border-b border-zinc-200 px-5 py-4 md:flex-row md:items-center md:justify-between">
              <div className="min-w-0">
                <h2 className="text-xl font-semibold tracking-normal text-zinc-950">
                  Recommended properties
                </h2>
                <p className="mt-1 text-sm leading-6 text-zinc-600">
                  {hasSearched
                    ? `Showing ${filteredRecommendations.length} properties within ${radius}${
                        appliedZipCode ? ` of ${appliedZipCode}` : ""
                      }.`
                    : "Review all San Francisco candidates or narrow by ZIP."}
                </p>
              </div>
              <ViewTabs activeView={activeView} setActiveView={setActiveView} />
            </div>

            {activeView === "list" ? (
              <RecommendationList
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

          <aside
            aria-live="polite"
            className="rounded-lg border border-zinc-200 bg-white p-5 shadow-sm"
            data-refresh-scope="selected-property-detail"
            id="details"
          >
            {selectedProperty ? (
              <SelectedPropertyDetail property={selectedProperty} />
            ) : (
              <EmptyState title="No matching properties. Clear the ZIP filter to see all candidates." />
            )}
          </aside>
        </section>

        <section
          className="grid gap-4 rounded-lg border border-zinc-200 bg-white p-5 shadow-sm md:grid-cols-4"
          id="data"
        >
          <ObjectiveCard
            body="San Francisco-only candidate data keeps the launch scope focused."
            title="Market focus"
          />
          <ObjectiveCard
            body="Revenue, cost, capital, and appreciation inputs drive the score."
            title="Financial engine"
          />
          <ObjectiveCard
            body="Registration, HOA, and unhosted-night risks are visible early."
            title="Regulatory layer"
          />
          <ObjectiveCard
            body="Search and profile changes update scoped sections only."
            title="Scoped updates"
          />
        </section>
      </main>
    </>
  );
}

function HeroMasthead() {
  return (
    <section
      className="rounded-lg border border-zinc-200 bg-white px-5 py-6 shadow-sm sm:px-6"
      id="search"
    >
      <p className="text-xs font-semibold uppercase tracking-normal text-zinc-500">
        PropVest AI | San Francisco
      </p>
      <h1 className="mt-2 max-w-3xl text-2xl font-semibold leading-tight tracking-normal text-zinc-950 sm:text-3xl">
        Evaluate SF investment properties with clear recommendations.
      </h1>
      <p className="mt-3 max-w-3xl text-sm leading-6 text-zinc-600 sm:text-base">
        Open filters when you need to refine investor assumptions, then compare
        results and compliance details without visual clutter.
      </p>
    </section>
  );
}

function DashboardToolbar({
  appliedZipCode,
  hasSearched,
  isFilterPanelOpen,
  openFilters,
  radius,
  resultCount,
}: {
  appliedZipCode: string;
  hasSearched: boolean;
  isFilterPanelOpen: boolean;
  openFilters: () => void;
  radius: string;
  resultCount: number;
}) {
  return (
    <section className="flex flex-col gap-3 rounded-lg border border-zinc-200 bg-white px-4 py-3 shadow-sm sm:flex-row sm:items-center sm:justify-between">
      <div>
        <p className="text-sm font-semibold text-zinc-950">
          {hasSearched
            ? `${resultCount} matching properties`
            : "All San Francisco candidates"}
        </p>
        <p className="mt-1 text-sm text-zinc-500">
          {hasSearched
            ? `${radius}${appliedZipCode ? ` around ${appliedZipCode}` : ""}`
            : "Open filters to narrow by ZIP, capital, risk, and property type."}
        </p>
      </div>
      <button
        aria-controls="filters-panel"
        aria-expanded={isFilterPanelOpen}
        className="inline-flex items-center justify-center rounded-md bg-zinc-950 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-zinc-800"
        onClick={openFilters}
        type="button"
      >
        Filters
      </button>
    </section>
  );
}

function FilterDrawer({
  applySearch,
  closePanel,
  hasSearched,
  isOpen,
  profile,
  radius,
  resultCount,
  setRadius,
  setZipCode,
  updateProfile,
  zipCode,
}: {
  applySearch: () => void;
  closePanel: () => void;
  hasSearched: boolean;
  isOpen: boolean;
  profile: InvestorProfile;
  radius: string;
  resultCount: number;
  setRadius: (radius: string) => void;
  setZipCode: (zipCode: string) => void;
  updateProfile: (partialProfile: Partial<InvestorProfile>) => void;
  zipCode: string;
}) {
  if (!isOpen) {
    return null;
  }

  return (
    <>
      <button
        aria-label="Close filters"
        className="fixed inset-x-0 bottom-0 top-14 z-30 bg-zinc-950/20"
        onClick={closePanel}
        tabIndex={-1}
        type="button"
      />
      <aside
        aria-label="Search and investor filters"
        aria-modal="true"
        className="fixed bottom-0 left-0 top-14 z-40 w-[calc(100vw-1rem)] max-w-sm border-r border-zinc-200 bg-white shadow-2xl"
        data-refresh-scope="search-profile-controls"
        id="filters-panel"
        role="dialog"
      >
        <div className="flex h-full flex-col">
          <div className="flex items-start justify-between gap-4 border-b border-zinc-200 px-5 py-4">
            <div>
              <h2 className="text-lg font-semibold tracking-normal text-zinc-950">
                Filters
              </h2>
              <p className="mt-1 text-sm leading-6 text-zinc-600">
                Tune the search without changing the dashboard layout.
              </p>
            </div>
            <button
              className="rounded-md px-3 py-2 text-sm font-semibold text-zinc-600 transition hover:bg-zinc-100 hover:text-zinc-950"
              onClick={closePanel}
              type="button"
            >
              Close
            </button>
          </div>

          <div className="flex-1 overflow-y-auto px-5 py-5">
            <div className="rounded-md bg-zinc-50 px-3 py-2 text-sm font-medium text-zinc-600">
              {hasSearched
                ? `${resultCount} matching properties`
                : "All San Francisco candidates"}
            </div>

            <div className="mt-5 space-y-5">
              <TextField
                label="ZIP code"
                maxLength={5}
                onChange={(value) => setZipCode(value.replace(/\D/g, ""))}
                placeholder="e.g. 94114"
                value={zipCode}
              />
              <SelectField
                label="Search radius"
                options={radiusOptions}
                value={radius}
                updateValue={setRadius}
              />
              <NumberField
                label="Available capital"
                min={0}
                step={25000}
                value={profile.availableCapital}
                updateValue={(value) =>
                  updateProfile({ availableCapital: value })
                }
              />
              <NumberField
                label="Down payment"
                min={0}
                step={25000}
                value={profile.downPaymentBudget}
                updateValue={(value) =>
                  updateProfile({ downPaymentBudget: value })
                }
              />
              <SelectField
                label="Goal"
                options={investmentGoals}
                value={profile.investmentGoal}
                updateValue={(value) => updateProfile({ investmentGoal: value })}
              />
              <SelectField
                label="Risk"
                options={riskTolerances}
                value={profile.riskTolerance}
                updateValue={(value) => updateProfile({ riskTolerance: value })}
              />
              <SelectField
                label="Property type"
                options={propertyTypes}
                value={profile.preferredPropertyType}
                updateValue={(value) =>
                  updateProfile({ preferredPropertyType: value })
                }
              />
              <SelectField
                label="Primary residence"
                options={["Yes", "No"]}
                value={profile.plansPrimaryResidence ? "Yes" : "No"}
                updateValue={(value) =>
                  updateProfile({ plansPrimaryResidence: value === "Yes" })
                }
              />
            </div>
          </div>

          <div className="border-t border-zinc-200 p-5">
            <button
              className="w-full rounded-md bg-zinc-950 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-zinc-800"
              onClick={applySearch}
              type="button"
            >
              Apply filters
            </button>
          </div>
        </div>
      </aside>
    </>
  );
}

function TextField({
  label,
  maxLength,
  onChange,
  placeholder,
  value,
}: {
  label: string;
  maxLength?: number;
  onChange: (value: string) => void;
  placeholder?: string;
  value: string;
}) {
  return (
    <label className="block">
      <span className="text-sm font-medium text-zinc-700">{label}</span>
      <input
        className="mt-2 w-full rounded-md border border-zinc-200 bg-zinc-50 px-3 py-2 text-sm font-semibold text-zinc-950 outline-none transition focus:border-sky-500 focus:ring-2 focus:ring-sky-100"
        inputMode="numeric"
        maxLength={maxLength}
        onChange={(event) => onChange(event.target.value)}
        placeholder={placeholder}
        type="text"
        value={value}
      />
    </label>
  );
}

function NumberField({
  label,
  min,
  step,
  updateValue,
  value,
}: {
  label: string;
  min: number;
  step: number;
  updateValue: (value: number) => void;
  value: number;
}) {
  return (
    <label className="block">
      <span className="text-sm font-medium text-zinc-700">{label}</span>
      <input
        className="mt-2 w-full rounded-md border border-zinc-200 bg-zinc-50 px-3 py-2 text-sm font-semibold text-zinc-950 outline-none transition focus:border-sky-500 focus:ring-2 focus:ring-sky-100"
        min={min}
        onChange={(event) => updateValue(Number(event.target.value))}
        step={step}
        type="number"
        value={value}
      />
    </label>
  );
}

function SelectField<T extends string>({
  label,
  options,
  updateValue,
  value,
}: {
  label: string;
  options: readonly T[];
  updateValue: (value: T) => void;
  value: T;
}) {
  return (
    <label className="block">
      <span className="text-sm font-medium text-zinc-700">{label}</span>
      <select
        className="mt-2 w-full rounded-md border border-zinc-200 bg-zinc-50 px-3 py-2 text-sm font-semibold text-zinc-950 outline-none transition focus:border-sky-500 focus:ring-2 focus:ring-sky-100"
        onChange={(event) => updateValue(event.target.value as T)}
        value={value}
      >
        {options.map((option) => (
          <option key={option} value={option}>
            {option}
          </option>
        ))}
      </select>
    </label>
  );
}

function SummaryStrip({
  averageMatchScore,
  blockedCount,
  eligibleCount,
  topRecommendation,
  totalResults,
}: {
  averageMatchScore: number;
  blockedCount: number;
  eligibleCount: number;
  topRecommendation?: RecommendedProperty;
  totalResults: number;
}) {
  return (
    <section
      className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4"
      data-refresh-scope="recommendation-kpis"
    >
      <SummaryItem
        label="Average match"
        tone={getScoreTone(averageMatchScore)}
        value={`${Math.round(averageMatchScore)}`}
      />
      <SummaryItem
        label="Top property"
        value={topRecommendation?.name ?? "None"}
      />
      <SummaryItem
        label="Eligible"
        tone="positive"
        value={`${eligibleCount} of ${totalResults}`}
      />
      <SummaryItem
        label="Blocked"
        tone={blockedCount > 0 ? "negative" : "neutral"}
        value={blockedCount.toString()}
      />
    </section>
  );
}

function SummaryItem({
  label,
  tone = "neutral",
  value,
}: {
  label: string;
  tone?: "neutral" | "positive" | "negative" | "accent";
  value: string;
}) {
  const toneClass =
    tone === "positive"
      ? "text-emerald-700"
      : tone === "negative"
        ? "text-rose-700"
        : tone === "accent"
          ? "text-sky-700"
          : "text-zinc-950";

  return (
    <article className="rounded-lg border border-zinc-200 bg-white px-4 py-3 shadow-sm">
      <p className="text-xs font-semibold uppercase tracking-normal text-zinc-500">
        {label}
      </p>
      <p
        className={`mt-2 break-words text-xl font-semibold tracking-normal sm:text-2xl ${toneClass}`}
      >
        {value}
      </p>
    </article>
  );
}

function ViewTabs({
  activeView,
  setActiveView,
}: {
  activeView: ActiveView;
  setActiveView: (view: ActiveView) => void;
}) {
  const labels: Record<ActiveView, string> = {
    list: "List",
    map: "Map",
  };

  return (
    <div
      aria-label="Recommendation view"
      className="grid w-full grid-cols-2 gap-1 rounded-md bg-zinc-100 p-1 sm:w-auto"
      role="tablist"
    >
      {(["list", "map"] as ActiveView[]).map((view) => {
        const isActive = activeView === view;

        return (
          <button
            aria-selected={isActive}
            className={`min-w-20 rounded-md px-4 py-2 text-sm font-semibold transition ${
              isActive
                ? "bg-white text-zinc-950 shadow-sm"
                : "text-zinc-600 hover:text-zinc-950"
            }`}
            key={view}
            onClick={() => setActiveView(view)}
            role="tab"
            type="button"
          >
            {labels[view]}
          </button>
        );
      })}
    </div>
  );
}

function RecommendationList({
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
    <div className="divide-y divide-zinc-100">
      {recommendations.map((property) => (
        <RecommendationRow
          isSelected={property.id === selectedPropertyId}
          key={property.id}
          property={property}
          selectProperty={selectProperty}
        />
      ))}
    </div>
  );
}

function RecommendationRow({
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
      className={`grid w-full gap-4 px-4 py-4 text-left transition hover:bg-zinc-50 sm:grid-cols-[6rem_minmax(0,1fr)] lg:grid-cols-[7rem_minmax(0,1fr)_auto] lg:items-center ${
        isSelected ? "bg-sky-50/70" : "bg-white"
      }`}
      onClick={() => selectProperty(property.id)}
      type="button"
    >
      <ListingImage
        alt={`${property.name} listing photo`}
        className="aspect-[16/9] sm:aspect-square lg:aspect-[4/3]"
        imageUrl={property.imageUrls[0]}
        sizes="(max-width: 640px) 100vw, 112px"
      />
      <div className="min-w-0">
        <div className="flex flex-wrap items-center gap-2">
          <h3 className="font-semibold text-zinc-950">{property.name}</h3>
          <ScorePill score={property.matchScore} />
          <span
            className={`rounded-full px-2 py-0.5 text-xs font-semibold ring-1 ${complianceStyles[property.complianceStatus]}`}
          >
            {property.complianceStatus}
          </span>
        </div>
        <p className="mt-1 text-sm leading-6 text-zinc-500">
          {property.address} | {property.zipCode} | {property.bedroomCount} bd
          | {property.squareFeet.toLocaleString()} sqft
        </p>
        <p className="mt-2 max-w-2xl text-sm leading-6 text-zinc-600">
          {property.neighborhoodInsight.description}
        </p>
      </div>
      <div className="grid gap-3 text-sm sm:col-start-2 sm:grid-cols-3 lg:col-start-auto lg:min-w-72">
        <Metric
          label="Return"
          value={formatPercent(property.totalAnnualReturn)}
        />
        <Metric
          label="Cash flow"
          value={formatCurrency(property.monthlyCashFlow)}
        />
        <Metric
          label="Capital"
          value={formatCurrency(property.minimumDownPayment)}
        />
      </div>
    </button>
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
    <div className="grid gap-5 p-5 lg:grid-cols-[minmax(0,1fr)_17rem]">
      <div className="relative min-h-96 overflow-hidden rounded-lg border border-zinc-200 bg-zinc-100">
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

function SelectedPropertyDetail({ property }: { property: RecommendedProperty }) {
  return (
    <div>
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-sm font-medium text-zinc-500">Selected property</p>
          <h2 className="mt-2 text-xl font-semibold tracking-normal text-zinc-950">
            {property.name}
          </h2>
          <p className="mt-1 text-sm text-zinc-500">
            {property.neighborhood} | {property.propertyType}
          </p>
        </div>
        <span
          className={`rounded-full px-2.5 py-1 text-xs font-semibold ring-1 ${complianceStyles[property.complianceStatus]}`}
        >
          {property.complianceStatus}
        </span>
      </div>

      <ListingImageGallery property={property} />

      <div className="mt-5">
        <ValueTrendChart
          points={property.valueHistory}
          positive={property.valueChange >= 0}
        />
      </div>

      <div className="mt-5 grid grid-cols-2 gap-4 text-sm">
        <Metric label="Match" value={property.matchScore.toString()} />
        <Metric
          label="Total return"
          value={formatPercent(property.totalAnnualReturn)}
        />
        <Metric
          label="Cash-on-cash"
          value={formatPercent(property.cashOnCashReturn)}
        />
        <Metric
          label="Value move"
          tone={property.valueChange >= 0 ? "positive" : "negative"}
          value={formatSignedPercent(property.valueChangeRate)}
        />
      </div>

      <div className="mt-5 rounded-lg bg-zinc-50 p-4">
        <h3 className="text-sm font-semibold text-zinc-950">
          Neighborhood readout
        </h3>
        <p className="mt-2 text-sm leading-6 text-zinc-700">
          {property.neighborhoodInsight.description}
        </p>
      </div>

      <ProsCons property={property} />

      <div className="mt-5 grid grid-cols-2 gap-4 border-t border-zinc-100 pt-4 text-sm">
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
}: {
  label: string;
  tone?: "neutral" | "positive" | "negative";
  value: string;
}) {
  const toneClass =
    tone === "positive"
      ? "text-emerald-700"
      : tone === "negative"
        ? "text-rose-700"
        : "text-zinc-950";

  return (
    <div>
      <p className="text-zinc-500">{label}</p>
      <p className={`mt-1 font-semibold ${toneClass}`}>{value}</p>
    </div>
  );
}

function ListingImage({
  alt,
  className,
  imageUrl,
  sizes,
}: {
  alt: string;
  className: string;
  imageUrl?: string;
  sizes: string;
}) {
  if (!imageUrl) {
    return (
      <div
        className={`flex items-center justify-center rounded-md bg-zinc-100 text-xs font-medium text-zinc-500 ${className}`}
      >
        No image
      </div>
    );
  }

  return (
    <div className={`relative overflow-hidden rounded-md bg-zinc-100 ${className}`}>
      <Image
        alt={alt}
        className="object-cover"
        fill
        sizes={sizes}
        src={imageUrl}
      />
    </div>
  );
}

function ListingImageGallery({ property }: { property: RecommendedProperty }) {
  const [primaryImage, ...secondaryImages] = property.imageUrls;

  return (
    <div className="mt-5 grid gap-2">
      <ListingImage
        alt={`${property.name} primary listing photo`}
        className="aspect-[4/3]"
        imageUrl={primaryImage}
        sizes="(max-width: 1024px) 100vw, 352px"
      />
      {secondaryImages.length > 0 ? (
        <div className="grid grid-cols-2 gap-2">
          {secondaryImages.slice(0, 2).map((imageUrl, index) => (
            <ListingImage
              alt={`${property.name} listing photo ${index + 2}`}
              className="aspect-[4/3]"
              imageUrl={imageUrl}
              key={imageUrl}
              sizes="(max-width: 1024px) 50vw, 172px"
            />
          ))}
        </div>
      ) : null}
    </div>
  );
}

function ScorePill({ score }: { score: number }) {
  return (
    <span
      className={`rounded-full px-2 py-0.5 text-xs font-semibold ring-1 ${getScoreStyle(score)}`}
    >
      {score} match
    </span>
  );
}

function getScoreStyle(score: number) {
  const toneClass =
    score >= 80
      ? scoreStyles.high
      : score >= 60
        ? scoreStyles.medium
        : scoreStyles.low;

  return toneClass;
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
