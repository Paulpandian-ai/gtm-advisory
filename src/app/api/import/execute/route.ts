import { NextRequest, NextResponse } from "next/server";
import { batchWrite } from "@/lib/aws/dynamo";
import { TABLES } from "@/lib/aws/config";
import type { DynamoItem } from "@/lib/aws/types";
// Items are built as plain objects and cast to DynamoItem for batchWrite.

/* ── helpers ───────────────────────────────────────────── */

function arrRange(arr: number): string {
  if (arr < 1_000_000) return "<$1M";
  if (arr < 5_000_000) return "$1M-$5M";
  if (arr < 10_000_000) return "$5M-$10M";
  if (arr < 25_000_000) return "$10M-$25M";
  if (arr < 50_000_000) return "$25M-$50M";
  if (arr < 100_000_000) return "$50M-$100M";
  return "$100M+";
}

interface MappedRecord {
  companyName?: string;
  industry?: string;
  stage?: string;
  arr?: number;
  employees?: number;
  funding?: number;
  gtmMotion?: string;
  winRate?: number;
  salesCycleLength?: number;
  cac?: number;
  ltv?: number;
  nrr?: number;
  churnRate?: number;
  pricingModel?: string;
  freeTier?: boolean;
  partnerProgram?: boolean;
  website?: string;
  hqLocation?: string;
  founded?: number;
  description?: string;
  growth?: number;
  [key: string]: unknown;
}

/**
 * POST /api/import/execute
 *
 * Body: { records: MappedRecord[] }
 *
 * Each record is already mapped from CSV columns to database field names.
 * Batch-writes company profiles (and sales metrics when available)
 * to the horizon-companies table.
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const records: MappedRecord[] = body.records;

    if (!Array.isArray(records) || records.length === 0) {
      return NextResponse.json(
        { error: "records array is required and must not be empty" },
        { status: 400 }
      );
    }

    const now = new Date().toISOString();
    const period = now.slice(0, 7);
    const items: Record<string, unknown>[] = [];
    const skipped: { index: number; reason: string }[] = [];

    for (let i = 0; i < records.length; i++) {
      const rec = records[i];

      if (!rec.companyName || !rec.industry || !rec.stage) {
        skipped.push({
          index: i,
          reason: "Missing required field (companyName, industry, or stage)",
        });
        continue;
      }

      const id = crypto.randomUUID();
      const pk = `COMPANY#${id}`;
      const companyArr = Number(rec.arr) || 0;
      const motion = rec.gtmMotion || "Hybrid";

      // Company profile
      items.push({
        pk,
        sk: "PROFILE",
        id,
        name: rec.companyName,
        industry: rec.industry,
        stage: rec.stage,
        arr: companyArr,
        arrRange: arrRange(companyArr),
        growth: Number(rec.growth) || 0,
        employees: Number(rec.employees) || 0,
        founded: Number(rec.founded) || new Date().getFullYear(),
        hqLocation: rec.hqLocation || "",
        gtmMotion: motion,
        description: rec.description || "",
        website: rec.website || undefined,
        createdAt: now,
        updatedAt: now,
        gsi1pk: rec.stage,
        gsi1sk: rec.industry,
        gsi2pk: motion,
        gsi2sk: arrRange(companyArr),
      });

      // Sales metrics (if any sales-related fields are present)
      const hasMetrics =
        rec.winRate != null ||
        rec.salesCycleLength != null ||
        rec.cac != null ||
        rec.ltv != null;

      if (hasMetrics) {
        const ltv = Number(rec.ltv) || 0;
        const cac = Number(rec.cac) || 0;
        items.push({
          pk,
          sk: `SALES#${period}`,
          companyId: id,
          period,
          winRate: Number(rec.winRate) || 0,
          salesCycleLength: Number(rec.salesCycleLength) || 0,
          cac,
          ltv,
          ltvCacRatio: cac > 0 ? ltv / cac : 0,
          avgDealSize: 0,
          pipelineCoverage: 0,
          quotaAttainment: 0,
          rampTime: 0,
        });
      }

      // Revenue metrics (if NRR or churn present)
      const hasRevenue = rec.nrr != null || rec.churnRate != null;
      if (hasRevenue) {
        items.push({
          pk,
          sk: `REVENUE#${period}`,
          companyId: id,
          period,
          mrr: Math.round(companyArr / 12),
          arr: companyArr,
          nrr: Number(rec.nrr) || 0,
          grossRevRetention: 0,
          churnRate: Number(rec.churnRate) || 0,
          expansionRevenue: 0,
          contractionRevenue: 0,
          newBusinessRevenue: 0,
          revenuePerEmployee: 0,
        });
      }
    }

    if (items.length > 0) {
      await batchWrite(TABLES.COMPANIES, items as unknown as DynamoItem[]);
    }

    const imported = records.length - skipped.length;

    return NextResponse.json({
      imported,
      skipped: skipped.length,
      skippedDetails: skipped,
      totalItems: items.length,
    });
  } catch (error) {
    console.error("Import execute failed:", error);
    return NextResponse.json(
      { error: "Failed to execute import" },
      { status: 500 }
    );
  }
}
