import { NextRequest, NextResponse } from "next/server";
import { recalculateBenchmarks } from "@/lib/intelligence/benchmark-calculator";

/**
 * POST /api/benchmarks/recalculate
 *
 * Triggers a full recalculation of benchmarks from company data.
 */
export async function POST(_request: NextRequest) {
  try {
    const result = await recalculateBenchmarks();
    return NextResponse.json(result);
  } catch (error) {
    console.error("Benchmark recalculation failed:", error);
    return NextResponse.json(
      { error: "Recalculation failed" },
      { status: 500 }
    );
  }
}
