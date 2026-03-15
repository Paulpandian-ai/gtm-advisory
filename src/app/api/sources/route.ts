import { NextRequest, NextResponse } from "next/server";
import { scanWithFilter, putItem } from "@/lib/aws/dynamo";
import { TABLES } from "@/lib/aws/config";
import { getAllFallbackSources } from "@/lib/aws/fallback-sources";
import type { DataSource } from "@/lib/aws/types";

/**
 * Try DynamoDB first; fall back to in-memory data on any failure.
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
      "DynamoDB unavailable, using fallback sources:",
      error instanceof Error ? error.message : error
    );
    return { items: fallbackFn() as T[], source: "fallback" };
  }
}

/**
 * GET /api/sources — return all data sources from horizon-sources table.
 */
export async function GET() {
  const { items, source } = await tryDynamo(
    () =>
      scanWithFilter<DataSource>(TABLES.SOURCES, {
        filterExpression: "sk = :meta",
        expressionValues: { ":meta": "META" },
      }),
    () => getAllFallbackSources() as unknown as DataSource[]
  );

  return NextResponse.json({ sources: items, source });
}

/**
 * POST /api/sources — create a new data source record.
 *
 * Body: { id, name, type, url?, description, recordCount, reliability }
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { id, name, type, description, url, recordCount, reliability } = body;

    if (!id || !name || !type) {
      return NextResponse.json(
        { error: "id, name, and type are required" },
        { status: 400 }
      );
    }

    const now = new Date().toISOString();
    const item: DataSource = {
      pk: `SOURCE#${id}`,
      sk: "META",
      id,
      name,
      type,
      url: url || undefined,
      description: description || "",
      lastUpdated: now,
      recordCount: recordCount ?? 0,
      reliability: reliability ?? 0.5,
    };

    await putItem(TABLES.SOURCES, item);

    return NextResponse.json({ source: item, status: "created" }, { status: 201 });
  } catch (error) {
    console.error("Failed to create source:", error);
    return NextResponse.json(
      { error: "Failed to create source" },
      { status: 500 }
    );
  }
}
