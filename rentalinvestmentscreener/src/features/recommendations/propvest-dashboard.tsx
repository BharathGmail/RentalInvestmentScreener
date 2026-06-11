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
const heroImages = [
  "/sf-property-search-hero.png",
  "/listing-images/listing_16.png",
  "/sf-property-search-hero.png",
];

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
      <FloatingFilterButton
        isOpen={isFilterPanelOpen}
        openFilters={() => setIsFilterPanelOpen(true)}
      />

      <main className="mx-auto flex w-full max-w-6xl flex-1 flex-col gap-5 px-4 py-5 sm:px-6 lg:py-6">
        <HeroMasthead />

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
      aria-label="Property Search"
      className="relative overflow-hidden rounded-lg border border-zinc-200 bg-zinc-950 shadow-sm"
      id="search"
    >
      <div className="absolute inset-0 grid grid-cols-3">
        {heroImages.map((imageUrl, index) => (
          <div className="relative min-w-0" key={`${imageUrl}-${index}`}>
            <Image
              alt=""
              className={`object-cover ${
                index === 0
                  ? "object-left"
                  : index === 1
                    ? "object-center"
                    : "object-right"
              }`}
              fill
              priority
              sizes="(max-width: 768px) 34vw, 384px"
              src={imageUrl}
            />
          </div>
        ))}
      </div>
      <div className="absolute inset-0 bg-zinc-950/55" />
      <div className="absolute inset-x-0 bottom-0 h-28 bg-gradient-to-t from-zinc-950/70 to-transparent" />
      <div className="relative flex h-44 flex-col items-center justify-center px-5 text-center text-white sm:h-56 lg:h-64">
        <div className="rounded-lg bg-zinc-950/55 px-5 py-4 shadow-xl ring-1 ring-white/15 backdrop-blur-sm sm:px-7">
          <h1 className="text-4xl font-semibold leading-tight tracking-normal sm:text-5xl">
            Property Search
          </h1>
          <p className="mt-3 text-base font-medium leading-6 text-white/90 sm:text-lg">
            Buy your next home in the Bay Area
          </p>
        </div>
      </div>
    </section>
  );
}

function FloatingFilterButton({
  isOpen,
  openFilters,
}: {
  isOpen: boolean;
  openFilters: () => void;
}) {
  if (isOpen) {
    return null;
  }

  return (
    <button
      aria-controls="filters-panel"
      aria-expanded={false}
      className="fixed left-0 top-28 z-30 rounded-r-md bg-zinc-950 px-4 py-3 text-sm font-semibold text-white shadow-lg transition hover:bg-zinc-800 focus:outline-none focus:ring-2 focus:ring-sky-300"
      onClick={openFilters}
      type="button"
    >
      Filters
    </button>
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
        className="fixed bottom-0 left-0 top-14 z-40 w-[22rem] max-w-[calc(100vw-1rem)] overflow-hidden border-r border-zinc-200 bg-white shadow-2xl"
        data-refresh-scope="search-profile-controls"
        id="filters-panel"
        role="dialog"
      >
        <div className="flex h-full min-h-0 flex-col">
          <div className="shrink-0 border-b border-zinc-200 px-4 py-3">
            <div className="flex items-start justify-between gap-4">
              <div>
                <h2 className="text-lg font-semibold tracking-normal text-zinc-950">
                  Filters
                </h2>
                <p className="mt-1 text-sm leading-5 text-zinc-600">
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
          </div>

          <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-4 py-4">
            <div className="rounded-md bg-zinc-50 px-3 py-2 text-sm font-medium text-zinc-600">
              {hasSearched
                ? `${resultCount} matching properties`
                : "All San Francisco candidates"}
            </div>

            <div className="mt-4 space-y-4">
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

          <div className="shrink-0 border-t border-zinc-200 bg-white p-4">
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
    <div className="grid gap-5 p-5 lg:grid-cols-[minmax(0,1fr)_18rem]">
      <div className="relative min-h-[30rem] overflow-hidden rounded-lg border border-zinc-200 bg-[#e8efe3]">
        <div className="absolute inset-0 bg-[linear-gradient(90deg,rgba(255,255,255,0.55)_1px,transparent_1px),linear-gradient(180deg,rgba(255,255,255,0.55)_1px,transparent_1px)] bg-[size:34px_34px]" />
        <div className="absolute inset-y-0 -left-10 w-24 bg-sky-100/90" />
        <div className="absolute inset-y-0 right-0 w-[33%] rounded-l-[45%] bg-sky-100" />
        <div className="absolute bottom-0 right-[24%] h-[30%] w-[26%] rounded-tl-[70%] bg-sky-100/95" />

        <div className="absolute left-[7%] top-[12%] h-[14%] w-[22%] -rotate-6 rounded-[40%] bg-emerald-100 ring-1 ring-emerald-200" />
        <div className="absolute left-[9%] top-[43%] h-[12%] w-[34%] -rotate-6 rounded-lg bg-emerald-100 ring-1 ring-emerald-200" />
        <div className="absolute left-[47%] top-[57%] h-[13%] w-[18%] rotate-12 rounded-[42%] bg-emerald-100 ring-1 ring-emerald-200" />

        <div className="absolute left-[10%] right-[30%] top-[22%] h-2 -rotate-12 rounded-full bg-white/90 shadow-sm" />
        <div className="absolute left-[14%] right-[34%] top-[35%] h-2 rotate-6 rounded-full bg-white/90 shadow-sm" />
        <div className="absolute left-[12%] right-[35%] top-[48%] h-2 -rotate-3 rounded-full bg-white/90 shadow-sm" />
        <div className="absolute left-[20%] right-[38%] top-[64%] h-2 rotate-12 rounded-full bg-white/90 shadow-sm" />
        <div className="absolute bottom-[22%] left-[26%] right-[34%] h-2 -rotate-[18deg] rounded-full bg-white/90 shadow-sm" />

        <div className="absolute bottom-[14%] left-[54%] top-[13%] w-2 rotate-[18deg] rounded-full bg-amber-100 shadow-sm ring-1 ring-amber-200" />
        <div className="absolute bottom-[19%] left-[38%] top-[18%] w-2 -rotate-[10deg] rounded-full bg-white/90 shadow-sm" />
        <div className="absolute bottom-[23%] left-[25%] top-[20%] w-2 rotate-[4deg] rounded-full bg-white/90 shadow-sm" />
        <div className="absolute bottom-[18%] left-[69%] top-[15%] w-2 rotate-[12deg] rounded-full bg-white/90 shadow-sm" />

        <span className="absolute left-[10%] top-[17%] rounded bg-emerald-50/90 px-2 py-1 text-[0.65rem] font-semibold uppercase tracking-normal text-emerald-800 ring-1 ring-emerald-200">
          Presidio
        </span>
        <span className="absolute left-[15%] top-[46%] rounded bg-emerald-50/90 px-2 py-1 text-[0.65rem] font-semibold uppercase tracking-normal text-emerald-800 ring-1 ring-emerald-200">
          Golden Gate Park
        </span>
        <span className="absolute left-[56%] top-[31%] rounded bg-white/85 px-2 py-1 text-[0.65rem] font-semibold uppercase tracking-normal text-zinc-600 ring-1 ring-zinc-200">
          Downtown
        </span>
        <span className="absolute left-[46%] top-[51%] rounded bg-white/85 px-2 py-1 text-[0.65rem] font-semibold uppercase tracking-normal text-zinc-600 ring-1 ring-zinc-200">
          Mission
        </span>
        <span className="absolute bottom-[17%] left-[31%] rounded bg-white/85 px-2 py-1 text-[0.65rem] font-semibold uppercase tracking-normal text-zinc-600 ring-1 ring-zinc-200">
          Sunset
        </span>
        <span className="absolute right-[7%] top-[17%] text-xs font-semibold uppercase tracking-normal text-sky-700/80">
          San Francisco Bay
        </span>
        <span className="absolute bottom-4 left-5 rounded-full bg-white/95 px-3 py-1 text-xs font-semibold text-zinc-600 shadow-sm ring-1 ring-zinc-200">
          San Francisco
        </span>
        <div
          aria-hidden="true"
          className="absolute right-4 top-4 overflow-hidden rounded-md bg-white shadow-sm ring-1 ring-zinc-200"
        >
          <span className="flex h-8 w-8 items-center justify-center text-sm font-semibold text-zinc-700">
            +
          </span>
          <div className="h-px bg-zinc-200" />
          <span className="flex h-8 w-8 items-center justify-center text-sm font-semibold text-zinc-700">
            -
          </span>
        </div>
        <div className="absolute bottom-4 right-4 rounded bg-white/95 px-2 py-1 text-[0.65rem] font-semibold text-zinc-500 shadow-sm ring-1 ring-zinc-200">
          2 mi
        </div>

        {recommendations.map((property) => {
          const isSelected = property.id === selectedPropertyId;

          return (
            <button
              aria-label={`Select ${property.name}`}
              className={`absolute z-20 -translate-x-1/2 -translate-y-full transition hover:scale-105 ${
                isSelected
                  ? "drop-shadow-[0_8px_14px_rgba(2,132,199,0.35)]"
                  : "drop-shadow-[0_6px_10px_rgba(15,23,42,0.18)]"
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
                className={`relative flex h-9 min-w-9 items-center justify-center rounded-full px-2 text-xs font-bold text-white ring-2 ring-white ${
                  property.matchScore >= 80
                    ? "bg-emerald-600"
                    : property.matchScore >= 60
                      ? "bg-amber-500"
                      : "bg-rose-600"
                } ${isSelected ? "outline outline-4 outline-sky-200" : ""}`}
              >
                {property.matchScore}
                <span
                  className={`absolute left-1/2 top-[1.85rem] h-3 w-3 -translate-x-1/2 rotate-45 ring-2 ring-white ${
                    property.matchScore >= 80
                      ? "bg-emerald-600"
                      : property.matchScore >= 60
                        ? "bg-amber-500"
                        : "bg-rose-600"
                  }`}
                />
              </span>
            </button>
          );
        })}
      </div>

      <div className="space-y-2 lg:max-h-[30rem] lg:overflow-y-auto">
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
            <span className="flex items-start justify-between gap-3">
              <span>
                <span className="block font-semibold text-zinc-950">
                  {property.neighborhood}
                </span>
                <span className="mt-1 block text-zinc-500">
                  {property.name}
                </span>
              </span>
              <span
                className={`rounded-full px-2 py-0.5 text-xs font-semibold ring-1 ${getScoreStyle(property.matchScore)}`}
              >
                {property.matchScore}
              </span>
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
