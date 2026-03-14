"use client";

import { useState, useEffect } from "react";
import { MetricCard } from "@/components/ui/metric-card";
import { HorizontalBarChart } from "@/components/ui/horizontal-bar-chart";
import { InsightBox } from "@/components/ui/insight-box";
import { cn } from "@/lib/utils";

interface BenchmarkMetric {
  metricName: string;
  p25: number;
  p50: number;
  p75: number;
  mean: number;
  sampleSize: number;
  unit?: string;
  segmentValue?: string;
}

interface GTMMotionTabProps {
  stage: string;
}

const motions = ["Product-Led", "Sales-Led", "Hybrid"] as const;
const motionColors: Record<string, string> = {
  "Product-Led": "#22d3ee",
  "Sales-Led": "#3b82f6",
  Hybrid: "#a855f7",
};

export function GTMMotionTab({ stage }: GTMMotionTabProps) {
  const [selected, setSelected] = useState<string>("Product-Led");
  const [motionMetrics, setMotionMetrics] = useState<
    Record<string, BenchmarkMetric[]>
  >({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchMotionData() {
      setLoading(true);
      const results: Record<string, BenchmarkMetric[]> = {};

      await Promise.all(
        motions.map(async (motion) => {
          try {
            const res = await fetch(
              `/api/benchmarks?segmentType=GTM_MOTION&segmentValue=${encodeURIComponent(motion)}`
            );
            const data = await res.json();
            results[motion] = data.benchmarks ?? [];
          } catch {
            results[motion] = [];
          }
        })
      );

      setMotionMetrics(results);
      setLoading(false);
    }
    fetchMotionData();
  }, [stage]);

  const currentMetrics = motionMetrics[selected] ?? [];

  function getMetric(name: string) {
    return currentMetrics.find((m) => m.metricName === name);
  }

  // Build comparison data for bar chart
  const winRateData = motions.map((m) => ({
    label: m,
    value: (motionMetrics[m]?.find((x) => x.metricName === "winRate")?.p50 ?? 0) * 100,
    color: motionColors[m],
  }));

  const cacData = motions.map((m) => ({
    label: m,
    value: motionMetrics[m]?.find((x) => x.metricName === "cac")?.p50 ?? 0,
    color: motionColors[m],
  }));

  const paybackData = motions.map((m) => ({
    label: m,
    value: motionMetrics[m]?.find((x) => x.metricName === "paybackMonths")?.p50 ?? 0,
    color: motionColors[m],
  }));

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20 text-[#64748b]">
        Loading GTM motion data...
      </div>
    );
  }

  const winRate = getMetric("winRate");
  const salesCycle = getMetric("salesCycleLength");
  const cac = getMetric("cac");
  const nrr = getMetric("nrr");
  const churn = getMetric("churnRate");
  const payback = getMetric("paybackMonths");

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-[#f8fafc]">
          GTM Motion Comparison
        </h3>
      </div>

      {/* Motion selector */}
      <div className="flex items-center gap-2">
        {motions.map((motion) => (
          <button
            key={motion}
            onClick={() => setSelected(motion)}
            className={cn(
              "px-4 py-1.5 rounded-full text-sm font-medium transition-all",
              selected === motion
                ? "text-white"
                : "bg-[#1e293b] text-[#94a3b8] hover:text-[#e2e8f0]"
            )}
            style={
              selected === motion
                ? { backgroundColor: motionColors[motion] }
                : undefined
            }
          >
            {motion}
          </button>
        ))}
      </div>

      {/* Metric cards for selected motion */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        <MetricCard
          label="Win Rate"
          value={winRate?.p50 ?? "—"}
          format="percent"
          subtitle={winRate ? `n=${winRate.sampleSize}` : undefined}
          highlight
        />
        <MetricCard
          label="Sales Cycle"
          value={salesCycle?.p50 ?? "—"}
          format="days"
          subtitle={salesCycle ? `n=${salesCycle.sampleSize}` : undefined}
        />
        <MetricCard
          label="CAC"
          value={cac?.p50 ?? "—"}
          format="currency"
          subtitle={cac ? `n=${cac.sampleSize}` : undefined}
        />
        <MetricCard
          label="NRR"
          value={nrr?.p50 ?? "—"}
          format="percent"
          subtitle={nrr ? `n=${nrr.sampleSize}` : undefined}
          highlight
        />
        <MetricCard
          label="Monthly Churn"
          value={churn?.p50 ?? "—"}
          format="percent"
          subtitle={churn ? `n=${churn.sampleSize}` : undefined}
        />
        <MetricCard
          label="CAC Payback"
          value={payback?.p50 ?? "—"}
          format="months"
          subtitle={payback ? `n=${payback.sampleSize}` : undefined}
        />
      </div>

      {/* Bar chart comparisons */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="bg-[#0f172a] border border-[#1e293b] rounded-xl p-5">
          <h4 className="text-[11px] font-medium uppercase tracking-[1.2px] text-[#64748b] mb-4">
            Win Rate by Motion
          </h4>
          <HorizontalBarChart data={winRateData} />
        </div>
        <div className="bg-[#0f172a] border border-[#1e293b] rounded-xl p-5">
          <h4 className="text-[11px] font-medium uppercase tracking-[1.2px] text-[#64748b] mb-4">
            CAC by Motion
          </h4>
          <HorizontalBarChart data={cacData} unit="" showValues />
        </div>
        <div className="bg-[#0f172a] border border-[#1e293b] rounded-xl p-5">
          <h4 className="text-[11px] font-medium uppercase tracking-[1.2px] text-[#64748b] mb-4">
            Payback Period
          </h4>
          <HorizontalBarChart data={paybackData} unit="mo" />
        </div>
      </div>

      <InsightBox
        title="PLG Advantage"
        body="Product-Led companies show 2-3x lower CAC and 40% shorter payback periods compared to Sales-Led motions. However, Sales-Led maintains stronger gross retention due to higher-touch relationships."
        variant="info"
        source="Benchmark analysis across 390 companies"
      />
    </div>
  );
}
