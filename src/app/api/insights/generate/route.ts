import { NextRequest, NextResponse } from "next/server";
import { generateAllInsights } from "@/lib/intelligence/insight-generator";

/**
 * POST /api/insights/generate
 *
 * Triggers Bedrock Claude to analyze current benchmarks and generate insights.
 * Saves to horizon-insights table.
 */
export async function POST(_request: NextRequest) {
  try {
    const result = await generateAllInsights();
    return NextResponse.json(result);
  } catch (error) {
    console.error("Insight generation failed:", error);
    return NextResponse.json(
      { error: "Insight generation failed" },
      { status: 500 }
    );
  }
}
