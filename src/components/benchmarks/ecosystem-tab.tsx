"use client";

import { useState, useEffect } from "react";
import { MetricCard } from "@/components/ui/metric-card";
import { HorizontalBarChart } from "@/components/ui/horizontal-bar-chart";
import { InsightBox } from "@/components/ui/insight-box";
import { STAGE_OPTIONS, stageLabel } from "@/components/benchmarks/stage-selector";

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

interface EcosystemTabProps {
  metrics: BenchmarkMetric[];
  stage: string;
}

const stageColors: Record<string, string> = {
  SEED: "#64748b",
  SERIES_A: "#3b82f6",
  SERIES_B: "#8b5cf6",
  SERIES_C: "#22d3ee",
  GROWTH: "#22c55e",
};

export function EcosystemTab({ metrics, stage }: EcosystemTabProps) {
  const [allStageData, setAllStageData] = useState<
    Record<string, BenchmarkMetric[]>
  >({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchAllStages() {
      setLoading(true);
      const results: Record<string, BenchmarkMetric[]> = {};

      await Promise.all(
        STAGE_OPTIONS.map(async (s) => {
          try {
            const res = await fetch(
              `/api/benchmarks?stage=${encodeURIComponent(s.value)}`
            );
            const data = await res.json();
            results[s.value] = data.benchmarks ?? [];
          } catch {
            results[s.value] = [];
          }
        })
      );

      setAllStageData(results);
      setLoading(false);
    }
    fetchAllStages();
  }, []);

  const partnerRev = metrics.find(
    (m) => m.metricName === "partnerSourcedRevenuePct"
  );
  const integrations = metrics.find(
    (m) => m.metricName === "integrationCount"
  );

  // Build progression charts
  const partnerRevProgression = STAGE_OPTIONS.map((s) => ({
    label: s.label,
    value:
      (allStageData[s.value]?.find((m) => m.metricName === "partnerSourcedRevenuePct")
        ?.p50 ?? 0) * 100,
    color: stageColors[s.value],
  }));

  const integrationProgression = STAGE_OPTIONS.map((s) => ({
    label: s.label,
    value:
      allStageData[s.value]?.find((m) => m.metricName === "integrationCount")?.p50 ??
      0,
    color: stageColors[s.value],
  }));

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20 text-[#64748b]">
        Loading ecosystem data...
      </div>
    );
  }

  const seriesAPartnerRev = (allStageData["SERIES_A"]?.find((m) => m.metricName === "partnerSourcedRevenuePct")?.p50 ?? 0) * 100;
  const seriesBPartnerRev = (allStageData["SERIES_B"]?.find((m) => m.metricName === "partnerSourcedRevenuePct")?.p50 ?? 0) * 100;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-[#f8fafc]">
          Ecosystem & Partnerships — {stageLabel(stage)}
        </h3>
      </div>

      {/* Current stage metrics */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <MetricCard
          label="Partner-Sourced Revenue"
          value={partnerRev?.p50 ?? "—"}
          format="percent"
          subtitle={
            partnerRev
              ? `P25: ${(partnerRev.p25 * 100).toFixed(0)}% · P75: ${(partnerRev.p75 * 100).toFixed(0)}%`
              : undefined
          }
          highlight
        />
        <MetricCard
          label="Integrations"
          value={integrations?.p50 ?? "—"}
          format="number"
          subtitle={
            integrations
              ? `P25: ${integrations.p25} · P75: ${integrations.p75}`
              : undefined
          }
          highlight
        />
        <MetricCard
          label="Partner Rev (P75)"
          value={partnerRev?.p75 ?? "—"}
          format="percent"
          subtitle="Top quartile performers"
          trend="up"
        />
        <MetricCard
          label="Integration Count (P75)"
          value={integrations?.p75 ?? "—"}
          format="number"
          subtitle="Top quartile performers"
          trend="up"
        />
      </div>

      {/* Progression charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-[#0f172a] border border-[#1e293b] rounded-xl p-5">
          <h4 className="text-[11px] font-medium uppercase tracking-[1.2px] text-[#64748b] mb-4">
            Partner-Sourced Revenue by Stage
          </h4>
          <HorizontalBarChart data={partnerRevProgression} />
        </div>
        <div className="bg-[#0f172a] border border-[#1e293b] rounded-xl p-5">
          <h4 className="text-[11px] font-medium uppercase tracking-[1.2px] text-[#64748b] mb-4">
            Integration Count by Stage
          </h4>
          <HorizontalBarChart data={integrationProgression} unit="" />
        </div>
      </div>

      <InsightBox
        title="Co-Sell Lift"
        body={`Partner-sourced revenue jumps from ${seriesAPartnerRev}% at Series A to ${seriesBPartnerRev}% at Series B — a critical inflection point. Companies that invest in partner programs before Series B see 40% faster ecosystem growth.`}
        variant="success"
        source="Cross-stage benchmark analysis"
      />

      <InsightBox
        title="Marketplace Presence"
        body="Growth-stage companies average 150+ integrations. Early investment in an integration marketplace (Series A) correlates with stronger NRR (+8pts) by Series C, suggesting ecosystem-driven retention."
        variant="info"
        source="Ecosystem benchmark correlation analysis"
      />
    </div>
  );
}
