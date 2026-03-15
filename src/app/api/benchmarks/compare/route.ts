import { NextRequest, NextResponse } from "next/server";
import { queryByPK } from "@/lib/aws/dynamo";
import { TABLES } from "@/lib/aws/config";
import { queryFallback } from "@/lib/aws/fallback-benchmarks";
import type { BenchmarkItem } from "@/lib/aws/types";
import { z } from "zod/v4";

const CompareSchema = z.object({
  stage: z.string().min(1),
  metrics: z.record(z.string(), z.number()),
});

/**
 * POST /api/benchmarks/compare
 *
 * Body: { stage: "Series A", metrics: { winRate: 0.25, cac: 15000, ... } }
 *
 * For each user metric, returns: value, benchmark median, percentile, status.
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const parsed = CompareSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: "Invalid input", details: parsed.error.issues },
        { status: 400 }
      );
    }

    const { stage, metrics } = parsed.data;
    const pk = `BENCH#STAGE#${stage}`;

    let benchmarks: BenchmarkItem[];
    try {
      benchmarks = await queryByPK<BenchmarkItem>(TABLES.BENCHMARKS, pk, "METRIC#");
    } catch {
      benchmarks = queryFallback(pk, "METRIC#") as unknown as BenchmarkItem[];
    }

    // Build a lookup by metric name
    const benchMap = new Map<string, BenchmarkItem>();
    for (const b of benchmarks) {
      benchMap.set(b.metricName, b);
    }

    // Compare each user metric
    const comparisons = Object.entries(metrics).map(([metricName, value]) => {
      const bench = benchMap.get(metricName);
      if (!bench) {
        return {
          metric: metricName,
          value,
          median: null,
          percentile: null,
          status: "no_benchmark" as const,
        };
      }

      // Estimate percentile from p25/p50/p75
      let percentile: number;
      if (value <= bench.p25) percentile = Math.round((value / bench.p25) * 25);
      else if (value <= bench.p50)
        percentile = 25 + Math.round(((value - bench.p25) / (bench.p50 - bench.p25)) * 25);
      else if (value <= bench.p75)
        percentile = 50 + Math.round(((value - bench.p50) / (bench.p75 - bench.p50)) * 25);
      else percentile = 75 + Math.min(25, Math.round(((value - bench.p75) / bench.p75) * 25));

      percentile = Math.max(0, Math.min(100, percentile));

      return {
        metric: metricName,
        value,
        median: bench.p50,
        p25: bench.p25,
        p75: bench.p75,
        percentile,
        status: value >= bench.p50 ? ("above" as const) : ("below" as const),
      };
    });

    return NextResponse.json({ comparisons, stage });
  } catch (error) {
    console.error("Benchmark compare failed:", error);
    return NextResponse.json(
      { error: "Benchmark comparison failed" },
      { status: 500 }
    );
  }
}
