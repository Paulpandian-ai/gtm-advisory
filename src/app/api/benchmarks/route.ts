import { NextRequest, NextResponse } from "next/server";
import { queryByPK, queryItems } from "@/lib/aws/dynamo";
import { TABLES } from "@/lib/aws/config";
import { queryFallback, queryFallbackBySegmentType } from "@/lib/aws/fallback-benchmarks";
import type { BenchmarkItem } from "@/lib/aws/types";

/**
 * Try DynamoDB first. On any failure (network, auth, timeout), fall back to
 * in-memory benchmark data so the UI always has data to render.
 */
async function tryDynamo<T>(
  dynamoFn: () => Promise<T[]>,
  fallbackFn: () => T[]
): Promise<{ items: T[]; source: "dynamodb" | "fallback" }> {
  try {
    const items = await dynamoFn();
    return { items, source: "dynamodb" };
  } catch (error) {
    console.warn(
      "DynamoDB unavailable, using fallback data:",
      error instanceof Error ? error.message : error
    );
    return { items: fallbackFn() as T[], source: "fallback" };
  }
}

export async function GET(request: NextRequest) {
  const { searchParams } = request.nextUrl;
  const stage = searchParams.get("stage");
  const segmentType = searchParams.get("segmentType");
  const segmentValue = searchParams.get("segmentValue");

  // Query by specific segment (type + value)
  if (segmentType && segmentValue) {
    const pk = `BENCH#${segmentType}#${segmentValue}`;
    const { items, source } = await tryDynamo(
      () => queryByPK<BenchmarkItem>(TABLES.BENCHMARKS, pk, "METRIC#"),
      () => queryFallback(pk, "METRIC#") as unknown as BenchmarkItem[]
    );
    return NextResponse.json({ benchmarks: items, source });
  }

  // Query by stage (shorthand for segmentType=STAGE)
  if (stage) {
    const pk = `BENCH#STAGE#${stage}`;
    const { items, source } = await tryDynamo(
      () => queryByPK<BenchmarkItem>(TABLES.BENCHMARKS, pk, "METRIC#"),
      () => queryFallback(pk, "METRIC#") as unknown as BenchmarkItem[]
    );
    return NextResponse.json({ benchmarks: items, source });
  }

  // Query all benchmarks for a segment type via GSI
  if (segmentType) {
    const { items, source } = await tryDynamo(
      () =>
        queryItems<BenchmarkItem>(
          TABLES.BENCHMARKS,
          "segmentType = :st",
          { ":st": segmentType },
          { indexName: "GSI1" }
        ),
      () => queryFallbackBySegmentType(segmentType) as unknown as BenchmarkItem[]
    );
    return NextResponse.json({ benchmarks: items, source });
  }

  return NextResponse.json(
    { error: "Provide stage, segmentType, or segmentType+segmentValue" },
    { status: 400 }
  );
}
