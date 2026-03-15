import { NextRequest, NextResponse } from "next/server";
import { calculateGTMScore } from "@/lib/intelligence/gtm-scorer";

/**
 * GET /api/companies/[id]/score — calculate GTM health score.
 */
export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  try {
    const result = await calculateGTMScore(id);
    return NextResponse.json(result);
  } catch (error) {
    console.error("GTM Score calculation failed:", error);
    return NextResponse.json(
      { error: "Score calculation failed" },
      { status: 500 }
    );
  }
}
