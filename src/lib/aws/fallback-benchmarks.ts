/**
 * Fallback benchmark data for local development when DynamoDB is unavailable.
 * Mirrors the seed data structure from scripts/seed-aws.ts.
 */

interface FallbackMetric {
  pk: string;
  sk: string;
  segmentType: string;
  segmentValue: string;
  metricName: string;
  p25: number;
  p50: number;
  p75: number;
  mean: number;
  sampleSize: number;
  unit: string;
  updatedAt: string;
}

const now = new Date().toISOString();

function m(
  segType: string,
  segVal: string,
  metric: string,
  p25: number,
  p50: number,
  p75: number,
  mean: number,
  n: number,
  unit: string
): FallbackMetric {
  return {
    pk: `BENCH#${segType}#${segVal}`,
    sk: `METRIC#${metric}`,
    segmentType: segType,
    segmentValue: segVal,
    metricName: metric,
    p25,
    p50,
    p75,
    mean,
    sampleSize: n,
    unit,
    updatedAt: now,
  };
}

export const FALLBACK_BENCHMARKS: FallbackMetric[] = [
  // ── STAGE: SEED ────────────────────────────────────────
  m("STAGE", "SEED", "winRate", 0.12, 0.18, 0.25, 0.18, 82, "ratio"),
  m("STAGE", "SEED", "salesCycleLength", 21, 30, 45, 32, 82, "days"),
  m("STAGE", "SEED", "cac", 8000, 15000, 25000, 16000, 78, "USD"),
  m("STAGE", "SEED", "ltvCacRatio", 1.5, 2.5, 4.0, 2.7, 78, "ratio"),
  m("STAGE", "SEED", "nrr", 0.90, 1.00, 1.10, 1.00, 75, "ratio"),
  m("STAGE", "SEED", "churnRate", 0.02, 0.04, 0.07, 0.045, 75, "ratio"),
  m("STAGE", "SEED", "magicNumber", 0.3, 0.5, 0.8, 0.55, 60, "ratio"),
  m("STAGE", "SEED", "paybackMonths", 18, 24, 36, 26, 60, "months"),
  m("STAGE", "SEED", "avgContractValue", 2000, 5000, 12000, 6500, 80, "USD"),
  m("STAGE", "SEED", "partnerSourcedRevenuePct", 0.0, 0.02, 0.08, 0.03, 60, "ratio"),
  m("STAGE", "SEED", "integrationCount", 2, 5, 10, 6, 60, "count"),

  // ── STAGE: SERIES_A ────────────────────────────────────
  m("STAGE", "SERIES_A", "winRate", 0.18, 0.22, 0.30, 0.23, 145, "ratio"),
  m("STAGE", "SERIES_A", "salesCycleLength", 28, 38, 55, 40, 145, "days"),
  m("STAGE", "SERIES_A", "cac", 12000, 20000, 35000, 22000, 138, "USD"),
  m("STAGE", "SERIES_A", "ltvCacRatio", 2.0, 3.0, 5.0, 3.3, 138, "ratio"),
  m("STAGE", "SERIES_A", "nrr", 0.95, 1.05, 1.15, 1.05, 130, "ratio"),
  m("STAGE", "SERIES_A", "churnRate", 0.015, 0.03, 0.05, 0.033, 130, "ratio"),
  m("STAGE", "SERIES_A", "magicNumber", 0.5, 0.7, 1.0, 0.73, 110, "ratio"),
  m("STAGE", "SERIES_A", "paybackMonths", 14, 20, 28, 21, 110, "months"),
  m("STAGE", "SERIES_A", "avgContractValue", 5000, 15000, 35000, 18000, 140, "USD"),
  m("STAGE", "SERIES_A", "partnerSourcedRevenuePct", 0.03, 0.08, 0.15, 0.09, 100, "ratio"),
  m("STAGE", "SERIES_A", "integrationCount", 8, 15, 30, 18, 100, "count"),

  // ── STAGE: SERIES_B ────────────────────────────────────
  m("STAGE", "SERIES_B", "winRate", 0.20, 0.26, 0.35, 0.27, 120, "ratio"),
  m("STAGE", "SERIES_B", "salesCycleLength", 35, 48, 72, 52, 120, "days"),
  m("STAGE", "SERIES_B", "cac", 18000, 30000, 50000, 33000, 115, "USD"),
  m("STAGE", "SERIES_B", "ltvCacRatio", 2.5, 3.5, 6.0, 4.0, 115, "ratio"),
  m("STAGE", "SERIES_B", "nrr", 1.00, 1.10, 1.20, 1.10, 112, "ratio"),
  m("STAGE", "SERIES_B", "churnRate", 0.01, 0.025, 0.04, 0.025, 112, "ratio"),
  m("STAGE", "SERIES_B", "magicNumber", 0.6, 0.8, 1.2, 0.87, 100, "ratio"),
  m("STAGE", "SERIES_B", "paybackMonths", 12, 18, 24, 18, 100, "months"),
  m("STAGE", "SERIES_B", "avgContractValue", 12000, 30000, 65000, 36000, 115, "USD"),
  m("STAGE", "SERIES_B", "partnerSourcedRevenuePct", 0.08, 0.15, 0.25, 0.16, 90, "ratio"),
  m("STAGE", "SERIES_B", "integrationCount", 20, 40, 70, 43, 90, "count"),

  // ── STAGE: SERIES_C ────────────────────────────────────
  m("STAGE", "SERIES_C", "winRate", 0.22, 0.28, 0.38, 0.29, 90, "ratio"),
  m("STAGE", "SERIES_C", "salesCycleLength", 45, 65, 90, 67, 90, "days"),
  m("STAGE", "SERIES_C", "cac", 25000, 42000, 70000, 46000, 88, "USD"),
  m("STAGE", "SERIES_C", "ltvCacRatio", 3.0, 4.0, 7.0, 4.7, 88, "ratio"),
  m("STAGE", "SERIES_C", "nrr", 1.05, 1.15, 1.25, 1.15, 85, "ratio"),
  m("STAGE", "SERIES_C", "churnRate", 0.008, 0.02, 0.035, 0.021, 85, "ratio"),
  m("STAGE", "SERIES_C", "magicNumber", 0.7, 0.9, 1.3, 0.97, 75, "ratio"),
  m("STAGE", "SERIES_C", "paybackMonths", 10, 15, 22, 16, 75, "months"),
  m("STAGE", "SERIES_C", "avgContractValue", 25000, 55000, 110000, 63000, 85, "USD"),
  m("STAGE", "SERIES_C", "partnerSourcedRevenuePct", 0.12, 0.22, 0.35, 0.23, 70, "ratio"),
  m("STAGE", "SERIES_C", "integrationCount", 40, 75, 120, 78, 70, "count"),

  // ── STAGE: GROWTH ──────────────────────────────────────
  m("STAGE", "GROWTH", "winRate", 0.25, 0.32, 0.42, 0.33, 65, "ratio"),
  m("STAGE", "GROWTH", "salesCycleLength", 55, 78, 110, 81, 65, "days"),
  m("STAGE", "GROWTH", "cac", 35000, 55000, 90000, 60000, 62, "USD"),
  m("STAGE", "GROWTH", "ltvCacRatio", 3.5, 5.0, 8.0, 5.5, 62, "ratio"),
  m("STAGE", "GROWTH", "nrr", 1.10, 1.20, 1.30, 1.20, 60, "ratio"),
  m("STAGE", "GROWTH", "churnRate", 0.005, 0.015, 0.025, 0.015, 60, "ratio"),
  m("STAGE", "GROWTH", "magicNumber", 0.8, 1.0, 1.4, 1.07, 50, "ratio"),
  m("STAGE", "GROWTH", "paybackMonths", 8, 12, 18, 13, 50, "months"),
  m("STAGE", "GROWTH", "avgContractValue", 40000, 85000, 180000, 102000, 60, "USD"),
  m("STAGE", "GROWTH", "partnerSourcedRevenuePct", 0.18, 0.30, 0.45, 0.31, 50, "ratio"),
  m("STAGE", "GROWTH", "integrationCount", 80, 150, 250, 160, 50, "count"),

  // ── GTM_MOTION: Product-Led ────────────────────────────
  m("GTM_MOTION", "Product-Led", "winRate", 0.22, 0.30, 0.42, 0.31, 130, "ratio"),
  m("GTM_MOTION", "Product-Led", "salesCycleLength", 12, 21, 35, 23, 130, "days"),
  m("GTM_MOTION", "Product-Led", "cac", 3000, 8000, 15000, 9000, 125, "USD"),
  m("GTM_MOTION", "Product-Led", "nrr", 1.05, 1.15, 1.30, 1.17, 120, "ratio"),
  m("GTM_MOTION", "Product-Led", "churnRate", 0.02, 0.04, 0.06, 0.04, 120, "ratio"),
  m("GTM_MOTION", "Product-Led", "paybackMonths", 6, 10, 16, 11, 100, "months"),
  m("GTM_MOTION", "Product-Led", "avgContractValue", 3000, 8000, 18000, 10000, 120, "USD"),
  m("GTM_MOTION", "Product-Led", "discountRate", 0.05, 0.10, 0.15, 0.10, 115, "ratio"),

  // ── GTM_MOTION: Sales-Led ──────────────────────────────
  m("GTM_MOTION", "Sales-Led", "winRate", 0.16, 0.22, 0.30, 0.23, 150, "ratio"),
  m("GTM_MOTION", "Sales-Led", "salesCycleLength", 40, 62, 95, 66, 150, "days"),
  m("GTM_MOTION", "Sales-Led", "cac", 20000, 38000, 65000, 41000, 145, "USD"),
  m("GTM_MOTION", "Sales-Led", "nrr", 1.02, 1.12, 1.22, 1.12, 140, "ratio"),
  m("GTM_MOTION", "Sales-Led", "churnRate", 0.008, 0.018, 0.03, 0.019, 140, "ratio"),
  m("GTM_MOTION", "Sales-Led", "paybackMonths", 14, 22, 32, 23, 120, "months"),
  m("GTM_MOTION", "Sales-Led", "avgContractValue", 25000, 55000, 120000, 67000, 140, "USD"),
  m("GTM_MOTION", "Sales-Led", "discountRate", 0.10, 0.18, 0.28, 0.19, 135, "ratio"),

  // ── GTM_MOTION: Hybrid ─────────────────────────────────
  m("GTM_MOTION", "Hybrid", "winRate", 0.19, 0.25, 0.34, 0.26, 110, "ratio"),
  m("GTM_MOTION", "Hybrid", "salesCycleLength", 25, 40, 60, 42, 110, "days"),
  m("GTM_MOTION", "Hybrid", "cac", 10000, 20000, 35000, 22000, 105, "USD"),
  m("GTM_MOTION", "Hybrid", "nrr", 1.05, 1.15, 1.25, 1.15, 100, "ratio"),
  m("GTM_MOTION", "Hybrid", "churnRate", 0.012, 0.025, 0.04, 0.026, 100, "ratio"),
  m("GTM_MOTION", "Hybrid", "paybackMonths", 10, 16, 24, 17, 85, "months"),
  m("GTM_MOTION", "Hybrid", "avgContractValue", 10000, 25000, 55000, 30000, 100, "USD"),
  m("GTM_MOTION", "Hybrid", "discountRate", 0.08, 0.14, 0.22, 0.15, 95, "ratio"),
];

/**
 * Query fallback data by pk and optional sk prefix (mirrors queryByPK behavior).
 */
export function queryFallback(pk: string, skPrefix?: string): FallbackMetric[] {
  return FALLBACK_BENCHMARKS.filter((item) => {
    if (item.pk !== pk) return false;
    if (skPrefix && !item.sk.startsWith(skPrefix)) return false;
    return true;
  });
}

/**
 * Query fallback data by segment type (mirrors GSI1 query).
 */
export function queryFallbackBySegmentType(segmentType: string): FallbackMetric[] {
  return FALLBACK_BENCHMARKS.filter((item) => item.segmentType === segmentType);
}
