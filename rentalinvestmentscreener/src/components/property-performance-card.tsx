import { ValueTrendChart } from "@/components/value-trend-chart";
import type {
  DealQuality,
  PropertyStatus,
  ScreenedProperty,
} from "@/features/screening/types";
import {
  formatCurrency,
  formatPercent,
  formatSignedCurrency,
  formatSignedPercent,
} from "@/lib/number-format";

const statusStyles: Record<PropertyStatus, string> = {
  Live: "bg-sky-50 text-sky-700 ring-sky-200",
  Diligence: "bg-amber-50 text-amber-700 ring-amber-200",
  Watchlist: "bg-zinc-100 text-zinc-700 ring-zinc-200",
};

const qualityStyles: Record<DealQuality, string> = {
  Outperform: "bg-emerald-50 text-emerald-700 ring-emerald-200",
  Monitor: "bg-amber-50 text-amber-700 ring-amber-200",
  Reprice: "bg-rose-50 text-rose-700 ring-rose-200",
};

type PropertyPerformanceCardProps = {
  property: ScreenedProperty;
};

export function PropertyPerformanceCard({
  property,
}: PropertyPerformanceCardProps) {
  const hasPositiveValueTrend = property.valueChange >= 0;

  return (
    <article className="rounded-lg border border-zinc-200 bg-white p-5 shadow-sm">
      <div className="flex items-start justify-between gap-4">
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <span
              className={`inline-flex rounded-full px-2.5 py-1 text-xs font-semibold ring-1 ${statusStyles[property.status]}`}
            >
              {property.status}
            </span>
            <span
              className={`inline-flex rounded-full px-2.5 py-1 text-xs font-semibold ring-1 ${qualityStyles[property.dealQuality]}`}
            >
              {property.dealQuality}
            </span>
          </div>
          <h3 className="mt-4 text-lg font-semibold tracking-normal text-zinc-950">
            {property.name}
          </h3>
          <p className="mt-1 text-sm text-zinc-500">
            {property.market} | {property.neighborhood}
          </p>
        </div>
        <div className="text-right">
          <p className="text-sm text-zinc-500">Current value</p>
          <p className="mt-1 text-lg font-semibold text-zinc-950">
            {formatCurrency(property.currentEstimatedValue)}
          </p>
        </div>
      </div>

      <div className="mt-5">
        <ValueTrendChart
          points={property.valueHistory}
          positive={hasPositiveValueTrend}
        />
      </div>

      <dl className="mt-5 grid grid-cols-2 gap-x-5 gap-y-4 text-sm">
        <div>
          <dt className="text-zinc-500">Annual revenue</dt>
          <dd className="mt-1 font-semibold text-zinc-950">
            {formatCurrency(property.annualGrossRevenue)}
          </dd>
        </div>
        <div>
          <dt className="text-zinc-500">Occupancy</dt>
          <dd className="mt-1 font-semibold text-zinc-950">
            {formatPercent(property.occupancyRate)}
          </dd>
        </div>
        <div>
          <dt className="text-zinc-500">Monthly cash flow</dt>
          <dd className="mt-1 font-semibold text-zinc-950">
            {formatCurrency(property.monthlyCashFlow)}
          </dd>
        </div>
        <div>
          <dt className="text-zinc-500">Value change</dt>
          <dd
            className={`mt-1 font-semibold ${
              hasPositiveValueTrend ? "text-emerald-700" : "text-rose-700"
            }`}
          >
            {formatSignedCurrency(property.valueChange)}{" "}
            <span className="font-medium">
              ({formatSignedPercent(property.valueChangeRate)})
            </span>
          </dd>
        </div>
      </dl>

      <div className="mt-5 border-t border-zinc-100 pt-4">
        <div className="flex items-center justify-between gap-4 text-sm">
          <span className="text-zinc-500">12-month value forecast</span>
          <span
            className={`font-semibold ${
              property.forecastValueChange >= 0
                ? "text-emerald-700"
                : "text-rose-700"
            }`}
          >
            {formatSignedCurrency(property.forecastValueChange)}
          </span>
        </div>
      </div>
    </article>
  );
}
