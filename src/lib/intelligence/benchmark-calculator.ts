import { scanWithFilter, batchWrite } from "@/lib/aws/dynamo";
import { TABLES } from "@/lib/aws/config";
import type {
  CompanyProfile,
  RevenueMetrics,
  SalesMetrics,
  ChannelMix,
  EcosystemMetrics,
  BenchmarkItem,
  DynamoItem,
} from "@/lib/aws/types";

/* ── Stats helpers ─────────────────────────────────────── */

function percentile(sorted: number[], p: number): number {
  if (sorted.length === 0) return 0;
  const idx = (p / 100) * (sorted.length - 1);
  const lower = Math.floor(idx);
  const upper = Math.ceil(idx);
  if (lower === upper) return sorted[lower];
  return sorted[lower] + (sorted[upper] - sorted[lower]) * (idx - lower);
}

function mean(values: number[]): number {
  if (values.length === 0) return 0;
  return values.reduce((a, b) => a + b, 0) / values.length;
}

function stddev(values: number[]): number {
  if (values.length < 2) return 0;
  const m = mean(values);
  const sumSq = values.reduce((a, v) => a + (v - m) ** 2, 0);
  return Math.sqrt(sumSq / (values.length - 1));
}

/* ── Types ─────────────────────────────────────────────── */

interface CompanyBundle {
  profile: CompanyProfile;
  revenue?: RevenueMetrics;
  sales?: SalesMetrics;
  channel?: ChannelMix;
  ecosystem?: EcosystemMetrics;
}

interface MetricExtractor {
  name: string;
  unit: string;
  extract: (b: CompanyBundle) => number | null;
}

/* ── Metric definitions ────────────────────────────────── */

const METRICS: MetricExtractor[] = [
  { name: "growthRate", unit: "%", extract: (b) => b.profile.growth || null },
  { name: "arr", unit: "$", extract: (b) => b.profile.arr || null },
  { name: "employees", unit: "", extract: (b) => b.profile.employees || null },
  { name: "winRate", unit: "%", extract: (b) => b.sales?.winRate ?? null },
  { name: "salesCycleDays", unit: "days", extract: (b) => b.sales?.salesCycleLength ?? null },
  { name: "cac", unit: "$", extract: (b) => b.sales?.cac ?? null },
  { name: "ltv", unit: "$", extract: (b) => b.sales?.ltv ?? null },
  { name: "ltvCacRatio", unit: "x", extract: (b) => b.sales?.ltvCacRatio ?? null },
  { name: "avgDealSize", unit: "$", extract: (b) => b.sales?.avgDealSize ?? null },
  { name: "pipelineCoverage", unit: "x", extract: (b) => b.sales?.pipelineCoverage ?? null },
  { name: "quotaAttainment", unit: "%", extract: (b) => b.sales?.quotaAttainment ?? null },
  { name: "nrr", unit: "%", extract: (b) => b.revenue?.nrr ?? null },
  { name: "grossRevRetention", unit: "%", extract: (b) => b.revenue?.grossRevRetention ?? null },
  { name: "churnRate", unit: "%", extract: (b) => b.revenue?.churnRate ?? null },
  { name: "revenuePerEmployee", unit: "$", extract: (b) => b.revenue?.revenuePerEmployee ?? null },
  { name: "outboundPct", unit: "%", extract: (b) => b.channel?.outboundPct ?? null },
  { name: "inboundPct", unit: "%", extract: (b) => b.channel?.inboundPct ?? null },
  { name: "plgPct", unit: "%", extract: (b) => b.channel?.plgPct ?? null },
  { name: "partnerPct", unit: "%", extract: (b) => b.channel?.partnerPct ?? null },
  { name: "partnerSourcedRevenuePct", unit: "%", extract: (b) => b.ecosystem?.partnerSourcedRevenuePct ?? null },
  { name: "marketplaceListings", unit: "", extract: (b) => b.ecosystem?.marketplaceListings ?? null },
  { name: "integrationCount", unit: "", extract: (b) => b.ecosystem?.integrationCount ?? null },
];

/* ── Grouping logic ────────────────────────────────────── */

type GroupKey = { segmentType: string; segmentValue: string };

function getGroups(profile: CompanyProfile): GroupKey[] {
  const groups: GroupKey[] = [];
  if (profile.stage) groups.push({ segmentType: "STAGE", segmentValue: profile.stage });
  if (profile.industry) groups.push({ segmentType: "INDUSTRY", segmentValue: profile.industry });
  if (profile.gtmMotion) groups.push({ segmentType: "GTM_MOTION", segmentValue: profile.gtmMotion });
  if (profile.arrRange) groups.push({ segmentType: "ARR_RANGE", segmentValue: profile.arrRange });
  return groups;
}

/* ── Main recalculation ────────────────────────────────── */

export async function recalculateBenchmarks(): Promise<{
  groupsProcessed: number;
  metricsWritten: number;
}> {
  // 1. Fetch all company data
  const allItems = await scanWithFilter<DynamoItem>(TABLES.COMPANIES);

  // 2. Bundle items by company
  const bundles = new Map<string, CompanyBundle>();

  for (const item of allItems) {
    const pk = item.pk;
    if (!pk.startsWith("COMPANY#")) continue;

    if (!bundles.has(pk)) {
      bundles.set(pk, { profile: null as unknown as CompanyProfile });
    }
    const bundle = bundles.get(pk)!;
    const sk = item.sk;

    if (sk === "PROFILE") bundle.profile = item as unknown as CompanyProfile;
    else if (sk.startsWith("REVENUE#")) bundle.revenue = item as unknown as RevenueMetrics;
    else if (sk.startsWith("SALES#")) bundle.sales = item as unknown as SalesMetrics;
    else if (sk.startsWith("CHANNEL#")) bundle.channel = item as unknown as ChannelMix;
    else if (sk.startsWith("ECOSYSTEM#")) bundle.ecosystem = item as unknown as EcosystemMetrics;
  }

  // Filter out bundles without profiles
  const companies = Array.from(bundles.values()).filter((b) => b.profile?.name);

  // 3. Group companies and calculate benchmarks
  const benchmarkItems: Record<string, unknown>[] = [];
  const now = new Date().toISOString();

  // Collect values by group+metric
  const grouped = new Map<string, Map<string, number[]>>();

  for (const bundle of companies) {
    const groups = getGroups(bundle.profile);

    for (const group of groups) {
      const groupKey = `${group.segmentType}#${group.segmentValue}`;

      if (!grouped.has(groupKey)) grouped.set(groupKey, new Map());
      const metricMap = grouped.get(groupKey)!;

      for (const metric of METRICS) {
        const val = metric.extract(bundle);
        if (val !== null && val !== 0) {
          if (!metricMap.has(metric.name)) metricMap.set(metric.name, []);
          metricMap.get(metric.name)!.push(val);
        }
      }
    }
  }

  // 4. Calculate stats and build DynamoDB items
  let groupsProcessed = 0;

  for (const [groupKey, metricMap] of grouped) {
    const [segType, ...segValParts] = groupKey.split("#");
    const segVal = segValParts.join("#");
    groupsProcessed++;

    for (const [metricName, values] of metricMap) {
      if (values.length < 2) continue; // Need at least 2 data points

      const sorted = [...values].sort((a, b) => a - b);
      const metricDef = METRICS.find((m) => m.name === metricName);

      benchmarkItems.push({
        pk: `BENCH#${segType}#${segVal}`,
        sk: `METRIC#${metricName}`,
        segmentType: segType,
        segmentValue: segVal,
        metricName,
        p25: Math.round(percentile(sorted, 25) * 100) / 100,
        p50: Math.round(percentile(sorted, 50) * 100) / 100,
        p75: Math.round(percentile(sorted, 75) * 100) / 100,
        mean: Math.round(mean(sorted) * 100) / 100,
        sampleSize: values.length,
        unit: metricDef?.unit ?? "",
        updatedAt: now,
      });
    }
  }

  // 5. Write to DynamoDB
  if (benchmarkItems.length > 0) {
    await batchWrite(TABLES.BENCHMARKS, benchmarkItems as unknown as BenchmarkItem[]);
  }

  return {
    groupsProcessed,
    metricsWritten: benchmarkItems.length,
  };
}
