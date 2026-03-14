"use client";

interface BarData {
  label: string;
  value: number;
  color: string;
}

interface HorizontalBarChartProps {
  data: BarData[];
  showValues?: boolean;
  unit?: string;
}

export function HorizontalBarChart({
  data,
  showValues = true,
  unit = "%",
}: HorizontalBarChartProps) {
  const maxValue = Math.max(...data.map((d) => d.value), 1);

  return (
    <div className="space-y-3">
      {data.map((item) => (
        <div key={item.label} className="space-y-1">
          <div className="flex items-center justify-between text-xs">
            <span className="text-[#e2e8f0]">{item.label}</span>
            {showValues && (
              <span
                className="text-[#94a3b8] font-medium"
                style={{ fontFamily: "'JetBrains Mono', monospace" }}
              >
                {typeof item.value === "number"
                  ? `${item.value.toFixed(1)}${unit}`
                  : item.value}
              </span>
            )}
          </div>
          <div className="h-2 rounded-full bg-[#1e293b] overflow-hidden">
            <div
              className="h-full rounded-full transition-all duration-500 ease-out"
              style={{
                width: `${(item.value / maxValue) * 100}%`,
                backgroundColor: item.color,
              }}
            />
          </div>
        </div>
      ))}
    </div>
  );
}
