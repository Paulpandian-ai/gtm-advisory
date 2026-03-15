import { NextRequest, NextResponse } from "next/server";
import { queryByPK, getItem } from "@/lib/aws/dynamo";
import { TABLES } from "@/lib/aws/config";
import type {
  CompanyProfile,
  RevenueMetrics,
  SalesMetrics,
  ChannelMix,
  EcosystemMetrics,
} from "@/lib/aws/types";

/**
 * GET /api/companies/[id] — fetch a single company with all related data.
 */
export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const pk = `COMPANY#${id}`;

  try {
    // Fetch all items for this company in one query
    const items = await queryByPK(TABLES.COMPANIES, pk);

    if (items.length === 0) {
      return NextResponse.json({ error: "Company not found" }, { status: 404 });
    }

    let profile: CompanyProfile | null = null;
    let revenue: RevenueMetrics | null = null;
    let sales: SalesMetrics | null = null;
    let channel: ChannelMix | null = null;
    let ecosystem: EcosystemMetrics | null = null;

    for (const item of items) {
      const sk = (item as { sk: string }).sk;
      if (sk === "PROFILE") profile = item as unknown as CompanyProfile;
      else if (sk.startsWith("REVENUE#")) revenue = item as unknown as RevenueMetrics;
      else if (sk.startsWith("SALES#")) sales = item as unknown as SalesMetrics;
      else if (sk.startsWith("CHANNEL#")) channel = item as unknown as ChannelMix;
      else if (sk.startsWith("ECOSYSTEM#")) ecosystem = item as unknown as EcosystemMetrics;
    }

    return NextResponse.json({ profile, revenue, sales, channel, ecosystem });
  } catch (error) {
    console.error("Failed to fetch company:", error);
    return NextResponse.json(
      { error: "Failed to fetch company" },
      { status: 500 }
    );
  }
}
