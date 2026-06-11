import type { ValuePoint } from "@/features/screening/types";

type ValueTrendChartProps = {
  points: ValuePoint[];
  positive: boolean;
  className?: string;
};

export function ValueTrendChart({
  points,
  positive,
  className = "",
}: ValueTrendChartProps) {
  if (points.length === 0) {
    return (
      <div
        className={`h-28 rounded-md border border-dashed border-zinc-300 ${className}`}
      />
    );
  }

  const width = 360;
  const height = 128;
  const paddingX = 18;
  const paddingY = 18;
  const values = points.map((point) => point.value);
  const minValue = Math.min(...values);
  const maxValue = Math.max(...values);
  const range = maxValue - minValue || 1;
  const chartWidth = width - paddingX * 2;
  const chartHeight = height - paddingY * 2;
  const coordinates = points.map((point, index) => {
    const x =
      points.length === 1
        ? width / 2
        : paddingX + (index / (points.length - 1)) * chartWidth;
    const y =
      height -
      paddingY -
      ((point.value - minValue) / range) * chartHeight;

    return { ...point, x, y };
  });
  const linePoints = coordinates
    .map((coordinate) => `${coordinate.x},${coordinate.y}`)
    .join(" ");
  const areaPoints = `${paddingX},${height - paddingY} ${linePoints} ${
    width - paddingX
  },${height - paddingY}`;
  const toneClass = positive ? "text-emerald-600" : "text-rose-600";

  return (
    <svg
      aria-hidden="true"
      className={`h-28 w-full ${toneClass} ${className}`}
      preserveAspectRatio="none"
      viewBox={`0 0 ${width} ${height}`}
    >
      <line
        className="stroke-zinc-200"
        strokeWidth="1"
        x1={paddingX}
        x2={width - paddingX}
        y1={height - paddingY}
        y2={height - paddingY}
      />
      <line
        className="stroke-zinc-200"
        strokeWidth="1"
        x1={paddingX}
        x2={width - paddingX}
        y1={paddingY}
        y2={paddingY}
      />
      <polygon className="fill-current opacity-10" points={areaPoints} />
      <polyline
        className="fill-none stroke-current"
        points={linePoints}
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="4"
      />
      {coordinates.map((coordinate) => (
        <circle
          className="fill-white stroke-current"
          cx={coordinate.x}
          cy={coordinate.y}
          key={coordinate.period}
          r="4"
          strokeWidth="3"
        />
      ))}
    </svg>
  );
}
