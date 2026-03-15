import { queryByPK } from "@/lib/aws/dynamo";
import { TABLES } from "@/lib/aws/config";
import { queryFallback } from "@/lib/aws/fallback-benchmarks";
import type {
  CompanyProfile,
  RevenueMetrics,
  SalesMetrics,
  ChannelMix,
  EcosystemMetrics,
  BenchmarkItem,
  DynamoItem,
} from "@/lib/aws/types";

/* ── Types ─────────────────────────────────────────────── */

export interface GTMScoreBreakdown {
  growthEfficiency: number; // max 25
  salesEfficiency: number; // max 25
  retentionHealth: number; // max 20
  channelDiversity: number; // max 15
  ecosystemLeverage: number; // max 15
}

export interface GTMScoreResult {
  totalScore: number; // 0-100
  breakdown: GTMScoreBreakdown;
  percentile: number; // vs stage peers
  grade: "A+" | "A" | "B+" | "B" | "C+" | "C" | "D" | "F";
}

/* ── Helpers ───────────────────────────────────────────── */

function clamp(v: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, v));
}

/** Inverse Herfindahl index — measures channel diversity (0 to 1). */
function inverseHerfindahl(shares: number[]): number {
  const nonZero = shares.filter((s) => s > 0);
  if (nonZero.length <= 1) return 0;
  const total = nonZero.reduce((a, b) => a + b, 0);
  if (total === 0) return 0;
  const normalized = nonZero.map((s) => s / total);
  const hhi = normalized.reduce((a, s) => a + s * s, 0);
  // HHI ranges from 1/n to 1; normalize to 0-1
  const minHHI = 1 / nonZero.length;
  return clamp((1 - hhi) / (1 - minHHI), 0, 1);
}

function scoreToGrade(score: number): GTMScoreResult["grade"] {
  if (score >= 90) return "A+";
  if (score >= 80) return "A";
  if (score >= 70) return "B+";
  if (score >= 60) return "B";
  if (score >= 50) return "C+";
  if (score >= 40) return "C";
  if (score >= 25) return "D";
  return "F";
}

/* ── Stage growth benchmarks (median growth % by stage) ── */

const STAGE_GROWTH_MEDIAN: Record<string, number> = {
  "Pre-Seed": 200,
  Seed: 150,
  "Series A": 100,
  "Series B": 80,
  "Series C": 50,
  "Series D+": 40,
  Growth: 30,
  Public: 20,
};

/* ── Main scoring function ─────────────────────────────── */

export async function calculateGTMScore(companyId: string): Promise<GTMScoreResult> {
  const pk = `COMPANY#${companyId}`;

  // Fetch all company items
  const items = await queryByPK<DynamoItem>(TABLES.COMPANIES, pk);

  let profile: CompanyProfile | null = null;
  let revenue: RevenueMetrics | null = null;
  let sales: SalesMetrics | null = null;
  let channel: ChannelMix | null = null;
  let ecosystem: EcosystemMetrics | null = null;

  for (const item of items) {
    const sk = item.sk;
    if (sk === "PROFILE") profile = item as unknown as CompanyProfile;
    else if (sk.startsWith("REVENUE#")) revenue = item as unknown as RevenueMetrics;
    else if (sk.startsWith("SALES#")) sales = item as unknown as SalesMetrics;
    else if (sk.startsWith("CHANNEL#")) channel = item as unknown as ChannelMix;
    else if (sk.startsWith("ECOSYSTEM#")) ecosystem = item as unknown as EcosystemMetrics;
  }

  if (!profile) {
    return {
      totalScore: 0,
      breakdown: {
        growthEfficiency: 0,
        salesEfficiency: 0,
        retentionHealth: 0,
        channelDiversity: 0,
        ecosystemLeverage: 0,
      },
      percentile: 0,
      grade: "F",
    };
  }

  // Fetch stage benchmarks for comparison
  let benchmarks: BenchmarkItem[];
  const benchPK = `BENCH#STAGE#${profile.stage}`;
  try {
    benchmarks = await queryByPK<BenchmarkItem>(TABLES.BENCHMARKS, benchPK, "METRIC#");
  } catch {
    benchmarks = queryFallback(benchPK, "METRIC#") as unknown as BenchmarkItem[];
  }

  const benchMap = new Map<string, BenchmarkItem>();
  for (const b of benchmarks) benchMap.set(b.metricName, b);

  /* ── 1. Growth Efficiency (25 pts) ─────────────── */
  const expectedGrowth = STAGE_GROWTH_MEDIAN[profile.stage] ?? 50;
  const growthRatio = expectedGrowth > 0 ? profile.growth / expectedGrowth : 0;
  const growthEfficiency = clamp(Math.round(growthRatio * 25), 0, 25);

  /* ── 2. Sales Efficiency (25 pts) ──────────────── */
  let salesEfficiency = 0;
  if (sales) {
    const ltvCacBench = benchMap.get("ltvCacRatio")?.p50 ?? 3;
    const ltvCacScore = ltvCacBench > 0 ? (sales.ltvCacRatio / ltvCacBench) : 0;

    const winRateBench = benchMap.get("winRate")?.p50 ?? 22;
    const winRateScore = winRateBench > 0 ? (sales.winRate / winRateBench) : 0;

    salesEfficiency = clamp(Math.round(((ltvCacScore * 0.6 + winRateScore * 0.4) * 25)), 0, 25);
  }

  /* ── 3. Retention Health (20 pts) ──────────────── */
  let retentionHealth = 0;
  if (revenue) {
    const nrrBench = benchMap.get("nrr")?.p50 ?? 105;
    const nrrScore = nrrBench > 0 ? revenue.nrr / nrrBench : 0;

    const grrScore = revenue.grossRevRetention > 0 ? revenue.grossRevRetention / 90 : 0;

    retentionHealth = clamp(Math.round((nrrScore * 0.6 + grrScore * 0.4) * 20), 0, 20);
  }

  /* ── 4. Channel Diversity (15 pts) ─────────────── */
  let channelDiversity = 0;
  if (channel) {
    const shares = [
      channel.outboundPct,
      channel.inboundPct,
      channel.plgPct,
      channel.partnerPct,
    ];
    const diversity = inverseHerfindahl(shares);
    channelDiversity = clamp(Math.round(diversity * 15), 0, 15);
  }

  /* ── 5. Ecosystem Leverage (15 pts) ────────────── */
  let ecosystemLeverage = 0;
  if (ecosystem) {
    const partnerRevScore = clamp(ecosystem.partnerSourcedRevenuePct / 30, 0, 1); // 30% = perfect
    const marketplaceScore = clamp(ecosystem.marketplaceListings / 3, 0, 1); // 3 = full marks
    const integrationScore = clamp(ecosystem.integrationCount / 50, 0, 1); // 50 = full marks

    ecosystemLeverage = clamp(
      Math.round((partnerRevScore * 0.5 + marketplaceScore * 0.25 + integrationScore * 0.25) * 15),
      0,
      15
    );
  }

  const totalScore = growthEfficiency + salesEfficiency + retentionHealth + channelDiversity + ecosystemLeverage;

  // Estimate percentile (simplified — would compare to all stage peers in production)
  const percentile = clamp(Math.round(totalScore * 0.95), 0, 99);

  return {
    totalScore,
    breakdown: {
      growthEfficiency,
      salesEfficiency,
      retentionHealth,
      channelDiversity,
      ecosystemLeverage,
    },
    percentile,
    grade: scoreToGrade(totalScore),
  };
}
