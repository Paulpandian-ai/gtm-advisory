"use client";

import { useState } from "react";
import { cn } from "@/lib/utils";

interface BenchmarkMetric {
  metricName: string;
  p25: number;
  p50: number;
  p75: number;
  mean: number;
  sampleSize: number;
  unit?: string;
}

interface YourScoreTabProps {
  metrics: BenchmarkMetric[];
  stage: string;
}

interface ScoreField {
  key: string;
  label: string;
  metricName: string;
  format: "percent" | "currency" | "ratio" | "days" | "months";
  placeholder: string;
  parseMultiplier?: number;
}

const fields: ScoreField[] = [
  {
    key: "winRate",
    label: "Win Rate",
    metricName: "winRate",
    format: "percent",
    placeholder: "e.g. 25",
    parseMultiplier: 0.01,
  },
  {
    key: "salesCycle",
    label: "Sales Cycle (days)",
    metricName: "salesCycleLength",
    format: "days",
    placeholder: "e.g. 45",
  },
  {
    key: "cac",
    label: "CAC ($)",
    metricName: "cac",
    format: "currency",
    placeholder: "e.g. 25000",
  },
  {
    key: "nrr",
    label: "Net Revenue Retention (%)",
    metricName: "nrr",
    format: "percent",
    placeholder: "e.g. 115",
    parseMultiplier: 0.01,
  },
  {
    key: "ltvCac",
    label: "LTV:CAC Ratio",
    metricName: "ltvCacRatio",
    format: "ratio",
    placeholder: "e.g. 3.5",
  },
  {
    key: "magicNumber",
    label: "Magic Number",
    metricName: "magicNumber",
    format: "ratio",
    placeholder: "e.g. 0.8",
  },
];

function getPosition(
  value: number,
  metric: BenchmarkMetric,
  isInverse: boolean
): { label: string; color: string } {
  if (isInverse) {
    // Lower is better (CAC, sales cycle, churn)
    if (value <= metric.p25) return { label: "Top Quartile", color: "#22c55e" };
    if (value <= metric.p50) return { label: "Above Median", color: "#22d3ee" };
    if (value <= metric.p75) return { label: "Below Median", color: "#f59e0b" };
    return { label: "Bottom Quartile", color: "#ef4444" };
  }
  // Higher is better (win rate, NRR, LTV:CAC)
  if (value >= metric.p75) return { label: "Top Quartile", color: "#22c55e" };
  if (value >= metric.p50) return { label: "Above Median", color: "#22d3ee" };
  if (value >= metric.p25) return { label: "Below Median", color: "#f59e0b" };
  return { label: "Bottom Quartile", color: "#ef4444" };
}

const inverseMetrics = new Set(["salesCycleLength", "cac"]);

export function YourScoreTab({ metrics, stage }: YourScoreTabProps) {
  const [values, setValues] = useState<Record<string, string>>({});

  function getBenchmark(metricName: string) {
    return metrics.find((m) => m.metricName === metricName);
  }

  function formatBenchmark(metric: BenchmarkMetric | undefined, format: string): string {
    if (!metric) return "—";
    switch (format) {
      case "percent":
        return `${(metric.p50 * 100).toFixed(0)}%`;
      case "currency":
        return `$${metric.p50.toLocaleString()}`;
      case "ratio":
        return `${metric.p50.toFixed(1)}x`;
      case "days":
        return `${Math.round(metric.p50)}d`;
      case "months":
        return `${Math.round(metric.p50)}mo`;
      default:
        return metric.p50.toString();
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-[#f8fafc]">
          Your GTM Score — vs. {stage}
        </h3>
        <span className="text-xs text-[#64748b]">
          Enter your metrics to compare
        </span>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {fields.map((field) => {
          const benchmark = getBenchmark(field.metricName);
          const rawValue = values[field.key];
          const numValue = rawValue ? parseFloat(rawValue) : null;
          const compareValue =
            numValue !== null && field.parseMultiplier
              ? numValue * field.parseMultiplier
              : numValue;
          const position =
            compareValue !== null && benchmark
              ? getPosition(
                  compareValue,
                  benchmark,
                  inverseMetrics.has(field.metricName)
                )
              : null;

          return (
            <div
              key={field.key}
              className="bg-[#0f172a] border border-[#1e293b] rounded-xl p-5"
            >
              <label className="text-[11px] font-medium uppercase tracking-[1.2px] text-[#64748b] block mb-3">
                {field.label}
              </label>
              <input
                type="number"
                placeholder={field.placeholder}
                value={rawValue ?? ""}
                onChange={(e) =>
                  setValues((prev) => ({
                    ...prev,
                    [field.key]: e.target.value,
                  }))
                }
                className="w-full bg-[#020617] border border-[#1e293b] rounded-lg px-3 py-2 text-lg text-[#f8fafc] placeholder-[#334155] focus:outline-none focus:border-[#3b82f6] focus:ring-1 focus:ring-[#3b82f6]/50 transition-colors"
                style={{ fontFamily: "'JetBrains Mono', monospace" }}
              />
              <div className="flex items-center justify-between mt-3">
                <span className="text-xs text-[#64748b]">
                  Benchmark (P50): {formatBenchmark(benchmark, field.format)}
                </span>
                {position && (
                  <span
                    className="text-[10px] font-semibold uppercase tracking-wider px-2 py-0.5 rounded-full"
                    style={{
                      color: position.color,
                      backgroundColor: `${position.color}15`,
                    }}
                  >
                    {position.label}
                  </span>
                )}
              </div>
              {/* Percentile bar */}
              {benchmark && (
                <div className="mt-2 relative">
                  <div className="h-1.5 rounded-full bg-[#1e293b] overflow-hidden flex">
                    <div className="flex-1 bg-[#ef4444]/30" />
                    <div className="flex-1 bg-[#f59e0b]/30" />
                    <div className="flex-1 bg-[#22d3ee]/30" />
                    <div className="flex-1 bg-[#22c55e]/30" />
                  </div>
                  {compareValue !== null && (
                    <div
                      className="absolute top-[-2px] w-2.5 h-2.5 rounded-full bg-white border-2 border-[#3b82f6] transform -translate-x-1/2 transition-all"
                      style={{
                        left: `${getPercentilePosition(compareValue, benchmark, inverseMetrics.has(field.metricName))}%`,
                      }}
                    />
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* CTA */}
      <div className="bg-gradient-to-r from-[#3b82f6]/10 to-[#22d3ee]/10 border border-[#3b82f6]/30 rounded-xl p-8 text-center">
        <h4 className="text-xl font-semibold text-[#f8fafc] mb-2">
          Want a Full GTM Assessment?
        </h4>
        <p className="text-sm text-[#94a3b8] mb-4 max-w-lg mx-auto">
          Get a comprehensive analysis of your GTM health with personalized
          benchmarks, AI-powered insights, and actionable recommendations.
        </p>
        <button className="px-6 py-2.5 bg-[#3b82f6] text-white rounded-lg font-medium text-sm hover:bg-[#2563eb] transition-colors shadow-[0_0_20px_rgba(59,130,246,0.25)]">
          Book a Full GTM Assessment
        </button>
      </div>
    </div>
  );
}

function getPercentilePosition(
  value: number,
  metric: BenchmarkMetric,
  isInverse: boolean
): number {
  const range = metric.p75 - metric.p25;
  if (range === 0) return 50;

  let position: number;
  if (isInverse) {
    // Invert so lower = higher percentile
    position = ((metric.p75 - value) / (range * 2)) * 100 + 25;
  } else {
    position = ((value - metric.p25) / (range * 2)) * 100 + 25;
  }

  return Math.max(2, Math.min(98, position));
}
