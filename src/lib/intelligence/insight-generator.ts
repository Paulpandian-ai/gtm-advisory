import { scanWithFilter, putItem, batchWrite } from "@/lib/aws/dynamo";
import { TABLES } from "@/lib/aws/config";
import { generateInsights } from "@/lib/aws/bedrock";
import type { BenchmarkItem, InsightItem, DynamoItem } from "@/lib/aws/types";

/* ── Rule-based insight detection ──────────────────────── */

interface RuleInsight {
  text: string;
  category: string;
  impact: number;
  confidence: number;
  segments: string[];
}

function detectRuleBasedInsights(benchmarks: BenchmarkItem[]): RuleInsight[] {
  const insights: RuleInsight[] = [];

  // Build lookup: segmentType/segmentValue/metricName → benchmark
  const lookup = new Map<string, BenchmarkItem>();
  for (const b of benchmarks) {
    lookup.set(`${b.segmentType}/${b.segmentValue}/${b.metricName}`, b);
  }

  // Helper to get median
  const med = (seg: string, val: string, metric: string): number | null => {
    const b = lookup.get(`${seg}/${val}/${metric}`);
    return b ? b.p50 : null;
  };

  // Rule 1: NRR impact on growth
  const stages = ["Seed", "Series A", "Series B", "Series C", "Growth"];
  for (const stage of stages) {
    const nrr = med("STAGE", stage, "nrr");
    const growth = med("STAGE", stage, "growthRate");
    if (nrr && growth && nrr > 110) {
      insights.push({
        text: `${stage} companies with NRR > 110% show ${growth}% median growth — retention drives compounding.`,
        category: "Growth",
        impact: 8,
        confidence: 0.85,
        segments: [stage],
      });
    }
  }

  // Rule 2: PLG vs SLG CAC comparison
  const plgCac = med("GTM_MOTION", "Product-Led", "cac");
  const slgCac = med("GTM_MOTION", "Sales-Led", "cac");
  if (plgCac && slgCac && slgCac > 0) {
    const diff = Math.round(((slgCac - plgCac) / slgCac) * 100);
    if (diff > 20) {
      insights.push({
        text: `Product-Led companies have ${diff}% lower CAC ($${Math.round(plgCac).toLocaleString()}) than Sales-Led peers ($${Math.round(slgCac).toLocaleString()}).`,
        category: "Sales Efficiency",
        impact: 9,
        confidence: 0.9,
        segments: ["Product-Led", "Sales-Led"],
      });
    }
  }

  // Rule 3: Co-sell win rate uplift
  for (const stage of stages) {
    const winRate = med("STAGE", stage, "winRate");
    const partnerPct = med("STAGE", stage, "partnerPct");
    if (winRate && partnerPct && partnerPct < 25) {
      insights.push({
        text: `Only ${partnerPct}% of ${stage} pipeline is partner-sourced. Companies leveraging co-sell see significantly higher win rates.`,
        category: "Ecosystem",
        impact: 7,
        confidence: 0.75,
        segments: [stage],
      });
    }
  }

  // Rule 4: Sales cycle by stage
  const seedCycle = med("STAGE", "Seed", "salesCycleDays");
  const seriesBCycle = med("STAGE", "Series B", "salesCycleDays");
  if (seedCycle && seriesBCycle && seriesBCycle > seedCycle) {
    insights.push({
      text: `Sales cycles increase ${Math.round(((seriesBCycle - seedCycle) / seedCycle) * 100)}% from Seed (${Math.round(seedCycle)} days) to Series B (${Math.round(seriesBCycle)} days) as deal sizes grow.`,
      category: "Sales Efficiency",
      impact: 6,
      confidence: 0.88,
      segments: ["Seed", "Series B"],
    });
  }

  // Rule 5: Channel diversity
  const motions = ["Product-Led", "Sales-Led", "Hybrid"];
  for (const motion of motions) {
    const outbound = med("GTM_MOTION", motion, "outboundPct");
    const inbound = med("GTM_MOTION", motion, "inboundPct");
    const plg = med("GTM_MOTION", motion, "plgPct");
    if (outbound && inbound && plg) {
      const max = Math.max(outbound, inbound, plg);
      if (max > 60) {
        insights.push({
          text: `${motion} companies are over-concentrated: ${max}% from a single channel. Diversification correlates with resilient growth.`,
          category: "Channel Mix",
          impact: 7,
          confidence: 0.7,
          segments: [motion],
        });
      }
    }
  }

  return insights;
}

/* ── Main generation function ──────────────────────────── */

export async function generateAllInsights(): Promise<{
  ruleBasedCount: number;
  aiGeneratedCount: number;
  totalSaved: number;
}> {
  // 1. Fetch all benchmarks
  let benchmarks: BenchmarkItem[];
  try {
    benchmarks = await scanWithFilter<BenchmarkItem>(TABLES.BENCHMARKS);
  } catch {
    benchmarks = [];
  }

  const now = new Date().toISOString();
  const allItems: Record<string, unknown>[] = [];

  // 2. Rule-based insights
  const ruleInsights = detectRuleBasedInsights(benchmarks);
  for (const insight of ruleInsights) {
    const id = `rule-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
    allItems.push({
      pk: `INSIGHT#${id}`,
      sk: `GENERATED#${now}`,
      id,
      insightText: insight.text,
      category: insight.category,
      impactScore: insight.impact,
      confidence: insight.confidence,
      relatedSegments: insight.segments,
      createdAt: now,
    });
  }

  // 3. AI-generated insights (if we have enough benchmark data)
  let aiCount = 0;
  if (benchmarks.length >= 10) {
    try {
      const { insights: aiInsights } = await generateInsights(benchmarks);
      aiCount = aiInsights.length;

      for (const insight of aiInsights) {
        // Filter for significance
        if (insight.confidence < 0.5) continue;

        const id = `ai-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
        allItems.push({
          pk: `INSIGHT#${id}`,
          sk: `GENERATED#${now}`,
          id,
          insightText: insight.insightText,
          category: insight.category,
          impactScore: insight.impactScore,
          confidence: insight.confidence,
          relatedSegments: insight.relatedSegments,
          createdAt: now,
        });
      }
    } catch (error) {
      console.warn("AI insight generation failed, using rule-based only:", error);
    }
  }

  // 4. Write to DynamoDB
  if (allItems.length > 0) {
    await batchWrite(TABLES.INSIGHTS, allItems as unknown as InsightItem[]);
  }

  return {
    ruleBasedCount: ruleInsights.length,
    aiGeneratedCount: aiCount,
    totalSaved: allItems.length,
  };
}
