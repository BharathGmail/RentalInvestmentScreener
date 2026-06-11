type MetricCardProps = {
  label: string;
  value: string;
  description: string;
  trend?: string;
  tone?: "neutral" | "positive" | "negative" | "accent";
};

const toneStyles = {
  accent: "text-sky-700",
  negative: "text-rose-700",
  neutral: "text-zinc-950",
  positive: "text-emerald-700",
};

export function MetricCard({
  label,
  value,
  description,
  tone = "neutral",
  trend,
}: MetricCardProps) {
  return (
    <article className="rounded-lg border border-zinc-200 bg-white p-5 shadow-sm">
      <div className="flex items-start justify-between gap-4">
        <p className="text-sm font-medium text-zinc-500">{label}</p>
        {trend ? (
          <span className={`text-sm font-semibold ${toneStyles[tone]}`}>
            {trend}
          </span>
        ) : null}
      </div>
      <p
        className={`mt-3 text-3xl font-semibold tracking-normal ${toneStyles[tone]}`}
      >
        {value}
      </p>
      <p className="mt-2 text-sm leading-6 text-zinc-600">{description}</p>
    </article>
  );
}
