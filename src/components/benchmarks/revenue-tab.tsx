"use client";

import { MetricCard } from "@/components/ui/metric-card";

interface BenchmarkMetric {
  metricName: string;
  p25: number;
  p50: number;
  p75: number;
  mean: number;
  sampleSize: number;
  unit?: string;
}

interface RevenueTabProps {
  metrics: BenchmarkMetric[];
  stage: string;
}

function getMetric(metrics: BenchmarkMetric[], name: string) {
  return metrics.find((m) => m.metricName === name);
}

function formatForCard(
  metric: BenchmarkMetric | undefined,
  format: "percent" | "currency" | "ratio" | "days" | "months" | "number"
): { value: string | number; subtitle: string; format: typeof format } {
  if (!metric) {
    return { value: "—", subtitle: "No data", format };
  }
  return {
    value: metric.p50,
    subtitle: `P25: ${formatInline(metric.p25, format)} · P75: ${formatInline(metric.p75, format)} · n=${metric.sampleSize}`,
    format,
  };
}

function formatInline(value: number, format: string): string {
  switch (format) {
    case "percent":
      return `${(value * 100).toFixed(1)}%`;
    case "currency":
      return new Intl.NumberFormat("en-US", {
        style: "currency",
        currency: "USD",
        minimumFractionDigits: 0,
        maximumFractionDigits: 0,
      }).format(value);
    case "ratio":
      return `${value.toFixed(1)}x`;
    case "days":
      return `${Math.round(value)}d`;
    case "months":
      return `${Math.round(value)}mo`;
    default:
      return new Intl.NumberFormat("en-US").format(value);
  }
}

export function RevenueTab({ metrics, stage }: RevenueTabProps) {
  const winRate = formatForCard(getMetric(metrics, "winRate"), "percent");
  const salesCycle = formatForCard(getMetric(metrics, "salesCycleLength"), "days");
  const cac = formatForCard(getMetric(metrics, "cac"), "currency");
  const ltvCac = formatForCard(getMetric(metrics, "ltvCacRatio"), "ratio");
  const nrr = formatForCard(getMetric(metrics, "nrr"), "percent");
  const churn = formatForCard(getMetric(metrics, "churnRate"), "percent");
  const magic = formatForCard(getMetric(metrics, "magicNumber"), "ratio");
  const payback = formatForCard(getMetric(metrics, "paybackMonths"), "months");
  const acv = formatForCard(getMetric(metrics, "avgContractValue"), "currency");
  const partnerRev = formatForCard(getMetric(metrics, "partnerSourcedRevenuePct"), "percent");
  const integrations = formatForCard(getMetric(metrics, "integrationCount"), "number");

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-[#f8fafc]">
          Revenue & Growth — {stage}
        </h3>
        <span className="text-xs text-[#64748b]">Median (P50) values shown</span>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <MetricCard
          label="Win Rate"
          value={winRate.value}
          subtitle={winRate.subtitle}
          format={winRate.format}
          highlight
        />
        <MetricCard
          label="Sales Cycle"
          value={salesCycle.value}
          subtitle={salesCycle.subtitle}
          format={salesCycle.format}
        />
        <MetricCard
          label="CAC"
          value={cac.value}
          subtitle={cac.subtitle}
          format={cac.format}
        />
        <MetricCard
          label="LTV:CAC"
          value={ltvCac.value}
          subtitle={ltvCac.subtitle}
          format={ltvCac.format}
          highlight
        />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <MetricCard
          label="Net Revenue Retention"
          value={nrr.value}
          subtitle={nrr.subtitle}
          format={nrr.format}
          highlight
        />
        <MetricCard
          label="Monthly Churn"
          value={churn.value}
          subtitle={churn.subtitle}
          format={churn.format}
        />
        <MetricCard
          label="Magic Number"
          value={magic.value}
          subtitle={magic.subtitle}
          format={magic.format}
        />
        <MetricCard
          label="CAC Payback"
          value={payback.value}
          subtitle={payback.subtitle}
          format={payback.format}
        />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        <MetricCard
          label="Avg Contract Value"
          value={acv.value}
          subtitle={acv.subtitle}
          format={acv.format}
        />
        <MetricCard
          label="Partner-Sourced Rev"
          value={partnerRev.value}
          subtitle={partnerRev.subtitle}
          format={partnerRev.format}
        />
        <MetricCard
          label="Integrations"
          value={integrations.value}
          subtitle={integrations.subtitle}
          format={integrations.format}
        />
      </div>
    </div>
  );
}
