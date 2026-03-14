"use client";

import { useState, useEffect } from "react";
import { MetricCard } from "@/components/ui/metric-card";
import { InsightBox } from "@/components/ui/insight-box";

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

interface PricingTabProps {
  metrics: BenchmarkMetric[];
  stage: string;
}

const motions = ["Product-Led", "Sales-Led", "Hybrid"] as const;
const motionColors: Record<string, string> = {
  "Product-Led": "#22d3ee",
  "Sales-Led": "#3b82f6",
  Hybrid: "#a855f7",
};

// Pricing model shift data (static — would come from a timeseries in production)
const pricingModelShift = [
  { year: "2024", perSeat: 45, usageBased: 25, hybrid: 20, freemium: 10 },
  { year: "2025", perSeat: 35, usageBased: 32, hybrid: 23, freemium: 10 },
  { year: "2026", perSeat: 28, usageBased: 38, hybrid: 25, freemium: 9 },
];

const modelColors: Record<string, string> = {
  perSeat: "#3b82f6",
  usageBased: "#22d3ee",
  hybrid: "#a855f7",
  freemium: "#64748b",
};

const modelLabels: Record<string, string> = {
  perSeat: "Per-Seat",
  usageBased: "Usage-Based",
  hybrid: "Hybrid",
  freemium: "Freemium",
};

export function PricingTab({ metrics, stage }: PricingTabProps) {
  const [motionPricing, setMotionPricing] = useState<
    Record<string, BenchmarkMetric[]>
  >({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchMotionPricing() {
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

      setMotionPricing(results);
      setLoading(false);
    }
    fetchMotionPricing();
  }, [stage]);

  const acv = metrics.find((m) => m.metricName === "avgContractValue");

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20 text-[#64748b]">
        Loading pricing data...
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-[#f8fafc]">
          Pricing Intelligence — {stage}
        </h3>
      </div>

      {/* ACV by stage */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        <MetricCard
          label={`ACV — ${stage}`}
          value={acv?.p50 ?? "—"}
          format="currency"
          subtitle={
            acv
              ? `P25: $${acv.p25.toLocaleString()} · P75: $${acv.p75.toLocaleString()}`
              : undefined
          }
          highlight
        />
        {motions.map((motion) => {
          const motionAcv = motionPricing[motion]?.find(
            (m) => m.metricName === "avgContractValue"
          );
          return (
            <MetricCard
              key={motion}
              label={`ACV — ${motion}`}
              value={motionAcv?.p50 ?? "—"}
              format="currency"
              subtitle={
                motionAcv
                  ? `n=${motionAcv.sampleSize}`
                  : undefined
              }
            />
          );
        })}
      </div>

      {/* Discount rates by motion */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {motions.map((motion) => {
          const discount = motionPricing[motion]?.find(
            (m) => m.metricName === "discountRate"
          );
          return (
            <MetricCard
              key={`discount-${motion}`}
              label={`Discount Rate — ${motion}`}
              value={discount?.p50 ?? "—"}
              format="percent"
              subtitle={
                discount
                  ? `P25: ${(discount.p25 * 100).toFixed(0)}% · P75: ${(discount.p75 * 100).toFixed(0)}%`
                  : undefined
              }
            />
          );
        })}
      </div>

      {/* Pricing model shift chart */}
      <div className="bg-[#0f172a] border border-[#1e293b] rounded-xl p-5">
        <h4 className="text-[11px] font-medium uppercase tracking-[1.2px] text-[#64748b] mb-4">
          Pricing Model Shift (2024 → 2026)
        </h4>
        <div className="space-y-3">
          {pricingModelShift.map((row) => (
            <div key={row.year} className="space-y-1">
              <div className="flex items-center justify-between text-xs">
                <span
                  className="text-[#e2e8f0] font-medium w-10"
                  style={{ fontFamily: "'JetBrains Mono', monospace" }}
                >
                  {row.year}
                </span>
              </div>
              <div className="flex h-6 rounded-md overflow-hidden">
                {(["perSeat", "usageBased", "hybrid", "freemium"] as const).map(
                  (model) => (
                    <div
                      key={model}
                      className="flex items-center justify-center text-[10px] font-medium text-white/80 transition-all duration-500"
                      style={{
                        width: `${row[model]}%`,
                        backgroundColor: modelColors[model],
                      }}
                      title={`${modelLabels[model]}: ${row[model]}%`}
                    >
                      {row[model] >= 15 ? `${row[model]}%` : ""}
                    </div>
                  )
                )}
              </div>
            </div>
          ))}
        </div>
        {/* Legend */}
        <div className="flex flex-wrap gap-4 mt-4">
          {Object.entries(modelLabels).map(([key, label]) => (
            <div key={key} className="flex items-center gap-1.5">
              <div
                className="w-2.5 h-2.5 rounded-sm"
                style={{ backgroundColor: modelColors[key] }}
              />
              <span className="text-[11px] text-[#94a3b8]">{label}</span>
            </div>
          ))}
        </div>
      </div>

      <InsightBox
        title="The SaaSpocalypse: Per-Seat Pricing Is Dying"
        body="Per-seat pricing has declined from 45% market share in 2024 to a projected 28% by 2026. Usage-based models are the clear winner, growing from 25% to 38%. Companies still on per-seat pricing face increasing pressure from competitors offering consumption-based alternatives. The shift accelerated post-AI as workloads became less tied to headcount."
        variant="warning"
        source="SaaS Pricing Index 2024-2026 projections"
      />
    </div>
  );
}
