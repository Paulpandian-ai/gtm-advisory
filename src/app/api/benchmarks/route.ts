import { NextRequest, NextResponse } from "next/server";
import { queryItems } from "@/lib/aws/dynamo";
import { TABLES } from "@/lib/aws/config";
import type { BenchmarkItem } from "@/lib/aws/types";

export async function GET(request: NextRequest) {
  const { searchParams } = request.nextUrl;
  const stage = searchParams.get("stage");
  const segmentType = searchParams.get("segmentType");
  const segmentValue = searchParams.get("segmentValue");

  try {
    // Query by specific segment
    if (segmentType && segmentValue) {
      const pk = `BENCH#${segmentType}#${segmentValue}`;
      const items = await queryItems<BenchmarkItem>(
        TABLES.BENCHMARKS,
        "pk = :pk",
        { ":pk": pk }
      );
      return NextResponse.json({ benchmarks: items });
    }

    // Query by stage (shorthand)
    if (stage) {
      const pk = `BENCH#STAGE#${stage}`;
      const items = await queryItems<BenchmarkItem>(
        TABLES.BENCHMARKS,
        "pk = :pk",
        { ":pk": pk }
      );
      return NextResponse.json({ benchmarks: items });
    }

    // Query all benchmarks for a segment type via GSI
    if (segmentType) {
      const items = await queryItems<BenchmarkItem>(
        TABLES.BENCHMARKS,
        "segmentType = :st",
        { ":st": segmentType },
        { indexName: "GSI1" }
      );
      return NextResponse.json({ benchmarks: items });
    }

    return NextResponse.json(
      { error: "Provide stage, segmentType, or segmentType+segmentValue" },
      { status: 400 }
    );
  } catch (error) {
    console.error("Benchmark query error:", error);
    return NextResponse.json(
      { error: "Failed to fetch benchmarks" },
      { status: 500 }
    );
  }
}
