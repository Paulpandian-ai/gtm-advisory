// ============================================================
// DynamoDB Item Types for Project Horizon
// ============================================================

// --- Base item with partition/sort key ---
export interface DynamoItem {
  pk: string;
  sk: string;
}

// ============================================================
// Table 1: horizon-companies
// ============================================================

export interface CompanyProfile extends DynamoItem {
  // pk: "COMPANY#<id>", sk: "PROFILE"
  id: string;
  name: string;
  industry: string;
  stage: CompanyStage;
  arr: number;
  arrRange: string;
  growth: number;
  employees: number;
  founded: number;
  hqLocation: string;
  gtmMotion: GTMMotion;
  description: string;
  website?: string;
  createdAt: string;
  updatedAt: string;
  // GSI keys
  gsi1pk: string; // stage
  gsi1sk: string; // industry
  gsi2pk: string; // gtmMotion
  gsi2sk: string; // arrRange
}

export interface RevenueMetrics extends DynamoItem {
  // pk: "COMPANY#<id>", sk: "REVENUE#<period>"
  companyId: string;
  period: string;
  mrr: number;
  arr: number;
  nrr: number;
  grossRevRetention: number;
  churnRate: number;
  expansionRevenue: number;
  contractionRevenue: number;
  newBusinessRevenue: number;
  revenuePerEmployee: number;
  quickRatio?: number;
}

export interface SalesMetrics extends DynamoItem {
  // pk: "COMPANY#<id>", sk: "SALES#<period>"
  companyId: string;
  period: string;
  winRate: number;
  salesCycleLength: number;
  cac: number;
  ltv: number;
  ltvCacRatio: number;
  avgDealSize: number;
  pipelineCoverage: number;
  quotaAttainment: number;
  rampTime: number;
  magicNumber?: number;
  paybackMonths?: number;
}

export interface ChannelMix extends DynamoItem {
  // pk: "COMPANY#<id>", sk: "CHANNEL#<period>"
  companyId: string;
  period: string;
  outboundPct: number;
  inboundPct: number;
  plgPct: number;
  partnerPct: number;
  eventsPct?: number;
  outboundCac?: number;
  inboundCac?: number;
  plgCac?: number;
  partnerCac?: number;
}

export interface EcosystemMetrics extends DynamoItem {
  // pk: "COMPANY#<id>", sk: "ECOSYSTEM#<period>"
  companyId: string;
  period: string;
  totalPartners: number;
  activePartners: number;
  partnerSourcedRevenuePct: number;
  partnerInfluencedRevenuePct: number;
  marketplaceListings: number;
  marketplaceRevenue: number;
  cosellDeals: number;
  cosellRevenue: number;
  integrationCount: number;
}

export interface PricingMetrics extends DynamoItem {
  // pk: "COMPANY#<id>", sk: "PRICING#<period>"
  companyId: string;
  period: string;
  model: PricingModel;
  tiers: PricingTier[];
  avgContractValue: number;
  annualPrepayDiscount: number;
  priceIncreaseFrequency: string;
  discountRate: number;
}

export interface PricingTier {
  name: string;
  price: number;
  unit: string;
  features: string[];
}

export interface TechStackItem extends DynamoItem {
  // pk: "COMPANY#<id>", sk: "TECHSTACK"
  companyId: string;
  crm: string;
  salesEngagement: string;
  marketing: string;
  analytics: string;
  billing: string;
  support: string;
  dataWarehouse?: string;
  enrichment?: string;
  abm?: string;
  conversational?: string;
}

// ============================================================
// Table 2: horizon-benchmarks
// ============================================================

export interface BenchmarkItem extends DynamoItem {
  // pk: "BENCH#<segmentType>#<segmentValue>", sk: "METRIC#<metricName>"
  segmentType: SegmentType;
  segmentValue: string;
  metricName: string;
  p25: number;
  p50: number;
  p75: number;
  mean: number;
  sampleSize: number;
  unit?: string;
  updatedAt: string;
}

// ============================================================
// Table 3: horizon-sources
// ============================================================

export interface DataSource extends DynamoItem {
  // pk: "SOURCE#<id>", sk: "META"
  id: string;
  name: string;
  type: SourceType;
  url?: string;
  description: string;
  lastUpdated: string;
  recordCount: number;
  reliability: number; // 0-1
}

// ============================================================
// Table 4: horizon-insights
// ============================================================

export interface InsightItem extends DynamoItem {
  // pk: "INSIGHT#<id>", sk: "GENERATED#<timestamp>"
  id: string;
  insightText: string;
  category: InsightCategory;
  impactScore: number; // 1-10
  confidence: number; // 0-1
  relatedSegments: string[];
  createdAt: string;
}

// ============================================================
// Enums / Union Types
// ============================================================

export type CompanyStage =
  | "Pre-Seed"
  | "Seed"
  | "Series A"
  | "Series B"
  | "Series C"
  | "Series D+"
  | "Growth"
  | "Public";

export type GTMMotion =
  | "Product-Led"
  | "Sales-Led"
  | "Hybrid"
  | "Community-Led"
  | "Partner-Led";

export type PricingModel =
  | "Per-Seat"
  | "Usage-Based"
  | "Flat-Rate"
  | "Tiered"
  | "Freemium"
  | "Hybrid";

export type SegmentType =
  | "STAGE"
  | "INDUSTRY"
  | "ARR_RANGE"
  | "GTM_MOTION"
  | "EMPLOYEE_COUNT";

export type SourceType =
  | "CSV"
  | "API"
  | "Manual"
  | "Scraped"
  | "Survey"
  | "Public Filing";

export type InsightCategory =
  | "Pricing"
  | "Sales Efficiency"
  | "Growth"
  | "Channel Mix"
  | "Ecosystem"
  | "Market Trend"
  | "Competitive";

// ============================================================
// Query helpers
// ============================================================

export function companyPK(id: string): string {
  return `COMPANY#${id}`;
}

export function benchmarkPK(segmentType: SegmentType, segmentValue: string): string {
  return `BENCH#${segmentType}#${segmentValue}`;
}

export function sourcePK(id: string): string {
  return `SOURCE#${id}`;
}

export function insightPK(id: string): string {
  return `INSIGHT#${id}`;
}

export function metricSK(metricName: string): string {
  return `METRIC#${metricName}`;
}

export function revenueSK(period: string): string {
  return `REVENUE#${period}`;
}

export function salesSK(period: string): string {
  return `SALES#${period}`;
}

export function channelSK(period: string): string {
  return `CHANNEL#${period}`;
}

export function ecosystemSK(period: string): string {
  return `ECOSYSTEM#${period}`;
}

export function pricingSK(period: string): string {
  return `PRICING#${period}`;
}
