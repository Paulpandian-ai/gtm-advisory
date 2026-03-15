import { NextResponse } from "next/server";
import { scanWithFilter } from "@/lib/aws/dynamo";
import { TABLES } from "@/lib/aws/config";
import { getAllFallbackSources } from "@/lib/aws/fallback-sources";
import type { CompanyProfile, DataSource, InsightItem } from "@/lib/aws/types";

/**
 * GET /api/dashboard — aggregated stats for the dashboard page.
 *
 * Returns:
 * {
 *   stats: { totalCompanies, medianGrowth, dataPoints, activeSources },
 *   companiesByStage: { stage: string, count: number }[],
 *   companiesByMotion: { motion: string, count: number }[],
 *   insights: InsightItem[],
 *   recentActivity: { type, label, timestamp }[],
 *   dataMoatScore: number,
 * }
 */
export async function GET() {
  let companies: CompanyProfile[] = [];
  let sources: DataSource[] = [];
  let insights: InsightItem[] = [];

  // Fetch all data in parallel, with fallbacks
  const [companyResult, sourceResult, insightResult] = await Promise.allSettled([
    scanWithFilter<CompanyProfile>(TABLES.COMPANIES, {
      filterExpression: "sk = :profile",
      expressionValues: { ":profile": "PROFILE" },
    }),
    scanWithFilter<DataSource>(TABLES.SOURCES, {
      filterExpression: "sk = :meta",
      expressionValues: { ":meta": "META" },
    }),
    scanWithFilter<InsightItem>(TABLES.INSIGHTS, {
      filterExpression: "begins_with(sk, :gen)",
      expressionValues: { ":gen": "GENERATED#" },
    }),
  ]);

  if (companyResult.status === "fulfilled") companies = companyResult.value;
  if (sourceResult.status === "fulfilled") sources = sourceResult.value;
  else sources = getAllFallbackSources() as unknown as DataSource[];
  if (insightResult.status === "fulfilled") insights = insightResult.value;

  // Stat cards
  const totalCompanies = companies.length;
  const growthValues = companies.map((c) => c.growth).filter((g) => g > 0).sort((a, b) => a - b);
  const medianGrowth =
    growthValues.length > 0
      ? growthValues[Math.floor(growthValues.length / 2)]
      : 0;
  const activeSources = sources.length;

  // Data points = companies * ~7 sub-items average
  const dataPoints = totalCompanies * 7;

  // Companies by stage
  const stageMap = new Map<string, number>();
  for (const c of companies) {
    stageMap.set(c.stage, (stageMap.get(c.stage) || 0) + 1);
  }
  const companiesByStage = Array.from(stageMap.entries())
    .map(([stage, count]) => ({ stage, count }))
    .sort((a, b) => b.count - a.count);

  // Companies by GTM motion
  const motionMap = new Map<string, number>();
  for (const c of companies) {
    motionMap.set(c.gtmMotion, (motionMap.get(c.gtmMotion) || 0) + 1);
  }
  const companiesByMotion = Array.from(motionMap.entries())
    .map(([motion, count]) => ({ motion, count }))
    .sort((a, b) => b.count - a.count);

  // Recent activity (from companies sorted by createdAt)
  const recentActivity = companies
    .sort((a, b) => (b.createdAt || "").localeCompare(a.createdAt || ""))
    .slice(0, 10)
    .map((c) => ({
      type: "company_added" as const,
      label: `New company: ${c.name}`,
      timestamp: c.createdAt,
    }));

  // Data Moat Score (0-100)
  const companyScore = Math.min(totalCompanies / 100, 1) * 25;
  const sourceScore = Math.min(activeSources / 10, 1) * 25;
  const completenessScore = totalCompanies > 0 ? 20 : 0; // simplified
  const freshnessScore =
    sources.length > 0
      ? Math.min(
          sources.filter((s) => {
            const updated = new Date(s.lastUpdated);
            const daysAgo = (Date.now() - updated.getTime()) / 86_400_000;
            return daysAgo < 90;
          }).length / sources.length,
          1
        ) * 30
      : 0;
  const dataMoatScore = Math.round(
    companyScore + sourceScore + completenessScore + freshnessScore
  );

  return NextResponse.json({
    stats: {
      totalCompanies,
      medianGrowth,
      dataPoints,
      activeSources,
    },
    companiesByStage,
    companiesByMotion,
    insights: insights.slice(0, 5),
    recentActivity,
    dataMoatScore,
  });
}
