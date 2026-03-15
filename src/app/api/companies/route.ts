import { NextRequest, NextResponse } from "next/server";
import {
  scanWithFilter,
  queryByPK,
  queryItems,
  putItem,
} from "@/lib/aws/dynamo";
import { TABLES } from "@/lib/aws/config";
import { z } from "zod/v4";
import type {
  CompanyProfile,
  RevenueMetrics,
  SalesMetrics,
  ChannelMix,
  EcosystemMetrics,
  PricingMetrics,
  TechStackItem,
  DynamoItem,
} from "@/lib/aws/types";

/* ── Zod schemas ───────────────────────────────────────── */

const ProfileSchema = z.object({
  name: z.string().min(1),
  industry: z.string().min(1),
  stage: z.string().min(1),
  arr: z.number().optional(),
  growth: z.number().optional(),
  employees: z.number().optional(),
  founded: z.number().optional(),
  hqLocation: z.string().optional(),
  gtmMotion: z.string().optional(),
  description: z.string().optional(),
  website: z.string().optional(),
});

const CreateCompanySchema = z.object({
  profile: ProfileSchema,
  revenue: z.record(z.string(), z.unknown()).optional(),
  sales: z.record(z.string(), z.unknown()).optional(),
  channel: z.record(z.string(), z.unknown()).optional(),
  ecosystem: z.record(z.string(), z.unknown()).optional(),
  pricing: z.record(z.string(), z.unknown()).optional(),
  techstack: z.record(z.string(), z.unknown()).optional(),
});

/**
 * GET /api/companies — query horizon-companies table.
 *
 * Query params:
 *   stage     — filter by company stage (uses GSI1)
 *   industry  — filter by industry (post-filter or GSI1 sk)
 *   search    — case-insensitive name search (scan + filter)
 *   limit     — max results (default 50)
 */
export async function GET(request: NextRequest) {
  const { searchParams } = request.nextUrl;
  const stage = searchParams.get("stage");
  const industry = searchParams.get("industry");
  const search = searchParams.get("search");
  const limit = parseInt(searchParams.get("limit") || "50");

  try {
    let companies: CompanyProfile[];

    if (stage) {
      // Query GSI1 where gsi1pk = stage
      companies = await queryItems<CompanyProfile>(
        TABLES.COMPANIES,
        "gsi1pk = :stage",
        {
          ":stage": stage,
          ...(industry ? { ":ind": industry } : {}),
        },
        {
          indexName: "GSI1",
          ...(industry
            ? {
                filterExpression: "industry = :ind",
              }
            : {}),
          limit,
        }
      );
    } else if (search) {
      // Scan with contains filter on name
      companies = await scanWithFilter<CompanyProfile>(TABLES.COMPANIES, {
        filterExpression:
          "sk = :profile AND contains(#n, :search)" +
          (industry ? " AND industry = :ind" : ""),
        expressionValues: {
          ":profile": "PROFILE",
          ":search": search,
          ...(industry ? { ":ind": industry } : {}),
        },
        expressionNames: { "#n": "name" },
        limit,
      });
    } else {
      // Scan all company profiles
      companies = await scanWithFilter<CompanyProfile>(TABLES.COMPANIES, {
        filterExpression:
          "sk = :profile" + (industry ? " AND industry = :ind" : ""),
        expressionValues: {
          ":profile": "PROFILE",
          ...(industry ? { ":ind": industry } : {}),
        },
        limit,
      });
    }

    return NextResponse.json({ companies, count: companies.length });
  } catch (error) {
    console.error("Failed to query companies:", error);
    return NextResponse.json(
      { error: "Failed to query companies", companies: [], count: 0 },
      { status: 500 }
    );
  }
}

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

/**
 * POST /api/companies — create a new company with all related sub-items.
 *
 * Body shape:
 * {
 *   profile: { name, industry, stage, arr, employees, ... },
 *   revenue?: { mrr, arr, nrr, churnRate, ... },
 *   sales?: { winRate, salesCycleLength, cac, ltv, ... },
 *   channel?: { outboundPct, inboundPct, plgPct, partnerPct, ... },
 *   ecosystem?: { totalPartners, marketplaceListings, cosellDeals, ... },
 *   pricing?: { model, tiers, avgContractValue, ... },
 *   techstack?: { crm, salesEngagement, marketing, ... },
 * }
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const parsed = CreateCompanySchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: "Validation failed", details: parsed.error.issues },
        { status: 400 }
      );
    }

    const { profile, revenue, sales, channel, ecosystem, pricing, techstack } =
      parsed.data as Record<string, any>;

    const id = crypto.randomUUID();
    const now = new Date().toISOString();
    const period = now.slice(0, 7); // YYYY-MM
    const pk = `COMPANY#${id}`;
    const companyArr = profile.arr ?? 0;

    // 1) Company profile
    const profileItem: CompanyProfile = {
      pk,
      sk: "PROFILE",
      id,
      name: profile.name,
      industry: profile.industry,
      stage: profile.stage,
      arr: companyArr,
      arrRange: arrRange(companyArr),
      growth: profile.growth ?? 0,
      employees: profile.employees ?? 0,
      founded: profile.founded ?? new Date().getFullYear(),
      hqLocation: profile.hqLocation ?? "",
      gtmMotion: profile.gtmMotion ?? "Hybrid",
      description: profile.description ?? "",
      website: profile.website,
      createdAt: now,
      updatedAt: now,
      gsi1pk: profile.stage,
      gsi1sk: profile.industry,
      gsi2pk: profile.gtmMotion ?? "Hybrid",
      gsi2sk: arrRange(companyArr),
    };
    await putItem(TABLES.COMPANIES, profileItem);

    // 2) Revenue metrics (optional)
    if (revenue) {
      const item: RevenueMetrics = {
        pk,
        sk: `REVENUE#${period}`,
        companyId: id,
        period,
        mrr: revenue.mrr ?? 0,
        arr: revenue.arr ?? companyArr,
        nrr: revenue.nrr ?? 0,
        grossRevRetention: revenue.grossRevRetention ?? 0,
        churnRate: revenue.churnRate ?? 0,
        expansionRevenue: revenue.expansionRevenue ?? 0,
        contractionRevenue: revenue.contractionRevenue ?? 0,
        newBusinessRevenue: revenue.newBusinessRevenue ?? 0,
        revenuePerEmployee: revenue.revenuePerEmployee ?? 0,
        quickRatio: revenue.quickRatio,
      };
      await putItem(TABLES.COMPANIES, item);
    }

    // 3) Sales metrics (optional)
    if (sales) {
      const item: SalesMetrics = {
        pk,
        sk: `SALES#${period}`,
        companyId: id,
        period,
        winRate: sales.winRate ?? 0,
        salesCycleLength: sales.salesCycleLength ?? 0,
        cac: sales.cac ?? 0,
        ltv: sales.ltv ?? 0,
        ltvCacRatio: sales.ltvCacRatio ?? 0,
        avgDealSize: sales.avgDealSize ?? 0,
        pipelineCoverage: sales.pipelineCoverage ?? 0,
        quotaAttainment: sales.quotaAttainment ?? 0,
        rampTime: sales.rampTime ?? 0,
        magicNumber: sales.magicNumber,
        paybackMonths: sales.paybackMonths,
      };
      await putItem(TABLES.COMPANIES, item);
    }

    // 4) Channel mix (optional)
    if (channel) {
      const item: ChannelMix = {
        pk,
        sk: `CHANNEL#${period}`,
        companyId: id,
        period,
        outboundPct: channel.outboundPct ?? 0,
        inboundPct: channel.inboundPct ?? 0,
        plgPct: channel.plgPct ?? 0,
        partnerPct: channel.partnerPct ?? 0,
        eventsPct: channel.eventsPct,
        outboundCac: channel.outboundCac,
        inboundCac: channel.inboundCac,
        plgCac: channel.plgCac,
        partnerCac: channel.partnerCac,
      };
      await putItem(TABLES.COMPANIES, item);
    }

    // 5) Ecosystem metrics (optional)
    if (ecosystem) {
      const item: EcosystemMetrics = {
        pk,
        sk: `ECOSYSTEM#${period}`,
        companyId: id,
        period,
        totalPartners: ecosystem.totalPartners ?? 0,
        activePartners: ecosystem.activePartners ?? 0,
        partnerSourcedRevenuePct: ecosystem.partnerSourcedRevenuePct ?? 0,
        partnerInfluencedRevenuePct: ecosystem.partnerInfluencedRevenuePct ?? 0,
        marketplaceListings: ecosystem.marketplaceListings ?? 0,
        marketplaceRevenue: ecosystem.marketplaceRevenue ?? 0,
        cosellDeals: ecosystem.cosellDeals ?? 0,
        cosellRevenue: ecosystem.cosellRevenue ?? 0,
        integrationCount: ecosystem.integrationCount ?? 0,
      };
      await putItem(TABLES.COMPANIES, item);
    }

    // 6) Pricing metrics (optional)
    if (pricing) {
      const item: PricingMetrics = {
        pk,
        sk: `PRICING#${period}`,
        companyId: id,
        period,
        model: pricing.model ?? "Tiered",
        tiers: pricing.tiers ?? [],
        avgContractValue: pricing.avgContractValue ?? 0,
        annualPrepayDiscount: pricing.annualPrepayDiscount ?? 0,
        priceIncreaseFrequency: pricing.priceIncreaseFrequency ?? "Annual",
        discountRate: pricing.discountRate ?? 0,
      };
      await putItem(TABLES.COMPANIES, item);
    }

    // 7) Tech stack (optional)
    if (techstack) {
      const item: TechStackItem = {
        pk,
        sk: "TECHSTACK",
        companyId: id,
        crm: techstack.crm ?? "",
        salesEngagement: techstack.salesEngagement ?? "",
        marketing: techstack.marketing ?? "",
        analytics: techstack.analytics ?? "",
        billing: techstack.billing ?? "",
        support: techstack.support ?? "",
        dataWarehouse: techstack.dataWarehouse,
        enrichment: techstack.enrichment,
        abm: techstack.abm,
        conversational: techstack.conversational,
      };
      await putItem(TABLES.COMPANIES, item);
    }

    return NextResponse.json(
      { company: { id, name: profile.name }, status: "created" },
      { status: 201 }
    );
  } catch (error) {
    console.error("Failed to create company:", error);
    return NextResponse.json(
      { error: "Failed to create company" },
      { status: 500 }
    );
  }
}
