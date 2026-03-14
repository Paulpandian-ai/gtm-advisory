/**
 * Project Horizon — Seed Data
 *
 * Loads initial benchmark data into DynamoDB tables.
 * Run with: npx tsx scripts/seed-aws.ts
 */

import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { DynamoDBDocumentClient, BatchWriteCommand } from "@aws-sdk/lib-dynamodb";

const REGION = process.env.AWS_REGION || "us-east-1";
const dynamo = new DynamoDBClient({ region: REGION });
const docClient = DynamoDBDocumentClient.from(dynamo, {
  marshallOptions: { removeUndefinedValues: true },
});

const TABLES = {
  BENCHMARKS: process.env.DYNAMODB_BENCHMARKS_TABLE || "horizon-benchmarks",
  SOURCES: process.env.DYNAMODB_SOURCES_TABLE || "horizon-sources",
};

const now = new Date().toISOString();

// ============================================================
// Helper: batch write with 25-item limit
// ============================================================

async function batchPut(table: string, items: Record<string, unknown>[]): Promise<void> {
  const BATCH_SIZE = 25;
  for (let i = 0; i < items.length; i += BATCH_SIZE) {
    const batch = items.slice(i, i + BATCH_SIZE);
    await docClient.send(
      new BatchWriteCommand({
        RequestItems: {
          [table]: batch.map((item) => ({
            PutRequest: { Item: item },
          })),
        },
      })
    );
  }
}

// ============================================================
// Stage Benchmarks
// ============================================================

const stageBenchmarks = [
  // --- Seed Stage ---
  { segType: "STAGE", segVal: "Seed", metric: "winRate", p25: 0.12, p50: 0.18, p75: 0.25, mean: 0.18, n: 82, unit: "ratio" },
  { segType: "STAGE", segVal: "Seed", metric: "salesCycleLength", p25: 21, p50: 30, p75: 45, mean: 32, n: 82, unit: "days" },
  { segType: "STAGE", segVal: "Seed", metric: "cac", p25: 8000, p50: 15000, p75: 25000, mean: 16000, n: 78, unit: "USD" },
  { segType: "STAGE", segVal: "Seed", metric: "ltvCacRatio", p25: 1.5, p50: 2.5, p75: 4.0, mean: 2.7, n: 78, unit: "ratio" },
  { segType: "STAGE", segVal: "Seed", metric: "nrr", p25: 0.90, p50: 1.00, p75: 1.10, mean: 1.00, n: 75, unit: "ratio" },
  { segType: "STAGE", segVal: "Seed", metric: "churnRate", p25: 0.02, p50: 0.04, p75: 0.07, mean: 0.045, n: 75, unit: "ratio" },
  { segType: "STAGE", segVal: "Seed", metric: "magicNumber", p25: 0.3, p50: 0.5, p75: 0.8, mean: 0.55, n: 60, unit: "ratio" },
  { segType: "STAGE", segVal: "Seed", metric: "paybackMonths", p25: 18, p50: 24, p75: 36, mean: 26, n: 60, unit: "months" },

  // --- Series A ---
  { segType: "STAGE", segVal: "Series A", metric: "winRate", p25: 0.18, p50: 0.22, p75: 0.30, mean: 0.23, n: 145, unit: "ratio" },
  { segType: "STAGE", segVal: "Series A", metric: "salesCycleLength", p25: 28, p50: 38, p75: 55, mean: 40, n: 145, unit: "days" },
  { segType: "STAGE", segVal: "Series A", metric: "cac", p25: 12000, p50: 20000, p75: 35000, mean: 22000, n: 138, unit: "USD" },
  { segType: "STAGE", segVal: "Series A", metric: "ltvCacRatio", p25: 2.0, p50: 3.0, p75: 5.0, mean: 3.3, n: 138, unit: "ratio" },
  { segType: "STAGE", segVal: "Series A", metric: "nrr", p25: 0.95, p50: 1.05, p75: 1.15, mean: 1.05, n: 130, unit: "ratio" },
  { segType: "STAGE", segVal: "Series A", metric: "churnRate", p25: 0.015, p50: 0.03, p75: 0.05, mean: 0.033, n: 130, unit: "ratio" },
  { segType: "STAGE", segVal: "Series A", metric: "magicNumber", p25: 0.5, p50: 0.7, p75: 1.0, mean: 0.73, n: 110, unit: "ratio" },
  { segType: "STAGE", segVal: "Series A", metric: "paybackMonths", p25: 14, p50: 20, p75: 28, mean: 21, n: 110, unit: "months" },

  // --- Series B ---
  { segType: "STAGE", segVal: "Series B", metric: "winRate", p25: 0.20, p50: 0.26, p75: 0.35, mean: 0.27, n: 120, unit: "ratio" },
  { segType: "STAGE", segVal: "Series B", metric: "salesCycleLength", p25: 35, p50: 48, p75: 72, mean: 52, n: 120, unit: "days" },
  { segType: "STAGE", segVal: "Series B", metric: "cac", p25: 18000, p50: 30000, p75: 50000, mean: 33000, n: 115, unit: "USD" },
  { segType: "STAGE", segVal: "Series B", metric: "ltvCacRatio", p25: 2.5, p50: 3.5, p75: 6.0, mean: 4.0, n: 115, unit: "ratio" },
  { segType: "STAGE", segVal: "Series B", metric: "nrr", p25: 1.00, p50: 1.10, p75: 1.20, mean: 1.10, n: 112, unit: "ratio" },
  { segType: "STAGE", segVal: "Series B", metric: "churnRate", p25: 0.01, p50: 0.025, p75: 0.04, mean: 0.025, n: 112, unit: "ratio" },
  { segType: "STAGE", segVal: "Series B", metric: "magicNumber", p25: 0.6, p50: 0.8, p75: 1.2, mean: 0.87, n: 100, unit: "ratio" },
  { segType: "STAGE", segVal: "Series B", metric: "paybackMonths", p25: 12, p50: 18, p75: 24, mean: 18, n: 100, unit: "months" },

  // --- Series C ---
  { segType: "STAGE", segVal: "Series C", metric: "winRate", p25: 0.22, p50: 0.28, p75: 0.38, mean: 0.29, n: 90, unit: "ratio" },
  { segType: "STAGE", segVal: "Series C", metric: "salesCycleLength", p25: 45, p50: 65, p75: 90, mean: 67, n: 90, unit: "days" },
  { segType: "STAGE", segVal: "Series C", metric: "cac", p25: 25000, p50: 42000, p75: 70000, mean: 46000, n: 88, unit: "USD" },
  { segType: "STAGE", segVal: "Series C", metric: "ltvCacRatio", p25: 3.0, p50: 4.0, p75: 7.0, mean: 4.7, n: 88, unit: "ratio" },
  { segType: "STAGE", segVal: "Series C", metric: "nrr", p25: 1.05, p50: 1.15, p75: 1.25, mean: 1.15, n: 85, unit: "ratio" },
  { segType: "STAGE", segVal: "Series C", metric: "churnRate", p25: 0.008, p50: 0.02, p75: 0.035, mean: 0.021, n: 85, unit: "ratio" },
  { segType: "STAGE", segVal: "Series C", metric: "magicNumber", p25: 0.7, p50: 0.9, p75: 1.3, mean: 0.97, n: 75, unit: "ratio" },
  { segType: "STAGE", segVal: "Series C", metric: "paybackMonths", p25: 10, p50: 15, p75: 22, mean: 16, n: 75, unit: "months" },

  // --- Growth (Series D+) ---
  { segType: "STAGE", segVal: "Growth", metric: "winRate", p25: 0.25, p50: 0.32, p75: 0.42, mean: 0.33, n: 65, unit: "ratio" },
  { segType: "STAGE", segVal: "Growth", metric: "salesCycleLength", p25: 55, p50: 78, p75: 110, mean: 81, n: 65, unit: "days" },
  { segType: "STAGE", segVal: "Growth", metric: "cac", p25: 35000, p50: 55000, p75: 90000, mean: 60000, n: 62, unit: "USD" },
  { segType: "STAGE", segVal: "Growth", metric: "ltvCacRatio", p25: 3.5, p50: 5.0, p75: 8.0, mean: 5.5, n: 62, unit: "ratio" },
  { segType: "STAGE", segVal: "Growth", metric: "nrr", p25: 1.10, p50: 1.20, p75: 1.30, mean: 1.20, n: 60, unit: "ratio" },
  { segType: "STAGE", segVal: "Growth", metric: "churnRate", p25: 0.005, p50: 0.015, p75: 0.025, mean: 0.015, n: 60, unit: "ratio" },
  { segType: "STAGE", segVal: "Growth", metric: "magicNumber", p25: 0.8, p50: 1.0, p75: 1.4, mean: 1.07, n: 50, unit: "ratio" },
  { segType: "STAGE", segVal: "Growth", metric: "paybackMonths", p25: 8, p50: 12, p75: 18, mean: 13, n: 50, unit: "months" },
];

// ============================================================
// Vertical / Industry Benchmarks
// ============================================================

const verticalBenchmarks = [
  // --- Fintech ---
  { segType: "INDUSTRY", segVal: "Fintech", metric: "winRate", p25: 0.15, p50: 0.22, p75: 0.30, mean: 0.22, n: 95, unit: "ratio" },
  { segType: "INDUSTRY", segVal: "Fintech", metric: "salesCycleLength", p25: 45, p50: 68, p75: 95, mean: 69, n: 95, unit: "days" },
  { segType: "INDUSTRY", segVal: "Fintech", metric: "cac", p25: 20000, p50: 35000, p75: 55000, mean: 37000, n: 90, unit: "USD" },
  { segType: "INDUSTRY", segVal: "Fintech", metric: "nrr", p25: 1.05, p50: 1.15, p75: 1.25, mean: 1.15, n: 88, unit: "ratio" },
  { segType: "INDUSTRY", segVal: "Fintech", metric: "churnRate", p25: 0.01, p50: 0.02, p75: 0.035, mean: 0.022, n: 88, unit: "ratio" },

  // --- DevTools ---
  { segType: "INDUSTRY", segVal: "DevTools", metric: "winRate", p25: 0.20, p50: 0.28, p75: 0.38, mean: 0.29, n: 110, unit: "ratio" },
  { segType: "INDUSTRY", segVal: "DevTools", metric: "salesCycleLength", p25: 18, p50: 28, p75: 42, mean: 29, n: 110, unit: "days" },
  { segType: "INDUSTRY", segVal: "DevTools", metric: "cac", p25: 5000, p50: 12000, p75: 22000, mean: 13000, n: 105, unit: "USD" },
  { segType: "INDUSTRY", segVal: "DevTools", metric: "nrr", p25: 1.10, p50: 1.20, p75: 1.35, mean: 1.22, n: 100, unit: "ratio" },
  { segType: "INDUSTRY", segVal: "DevTools", metric: "churnRate", p25: 0.015, p50: 0.03, p75: 0.05, mean: 0.032, n: 100, unit: "ratio" },

  // --- Cybersecurity ---
  { segType: "INDUSTRY", segVal: "Cybersecurity", metric: "winRate", p25: 0.18, p50: 0.24, p75: 0.32, mean: 0.25, n: 85, unit: "ratio" },
  { segType: "INDUSTRY", segVal: "Cybersecurity", metric: "salesCycleLength", p25: 40, p50: 60, p75: 90, mean: 63, n: 85, unit: "days" },
  { segType: "INDUSTRY", segVal: "Cybersecurity", metric: "cac", p25: 22000, p50: 38000, p75: 60000, mean: 40000, n: 82, unit: "USD" },
  { segType: "INDUSTRY", segVal: "Cybersecurity", metric: "nrr", p25: 1.08, p50: 1.18, p75: 1.28, mean: 1.18, n: 80, unit: "ratio" },
  { segType: "INDUSTRY", segVal: "Cybersecurity", metric: "churnRate", p25: 0.008, p50: 0.018, p75: 0.03, mean: 0.019, n: 80, unit: "ratio" },

  // --- HealthTech ---
  { segType: "INDUSTRY", segVal: "HealthTech", metric: "winRate", p25: 0.14, p50: 0.20, p75: 0.28, mean: 0.21, n: 70, unit: "ratio" },
  { segType: "INDUSTRY", segVal: "HealthTech", metric: "salesCycleLength", p25: 60, p50: 90, p75: 140, mean: 97, n: 70, unit: "days" },
  { segType: "INDUSTRY", segVal: "HealthTech", metric: "cac", p25: 30000, p50: 50000, p75: 80000, mean: 53000, n: 65, unit: "USD" },
  { segType: "INDUSTRY", segVal: "HealthTech", metric: "nrr", p25: 1.02, p50: 1.10, p75: 1.18, mean: 1.10, n: 65, unit: "ratio" },
  { segType: "INDUSTRY", segVal: "HealthTech", metric: "churnRate", p25: 0.005, p50: 0.015, p75: 0.025, mean: 0.015, n: 65, unit: "ratio" },

  // --- MarTech ---
  { segType: "INDUSTRY", segVal: "MarTech", metric: "winRate", p25: 0.16, p50: 0.22, p75: 0.30, mean: 0.23, n: 100, unit: "ratio" },
  { segType: "INDUSTRY", segVal: "MarTech", metric: "salesCycleLength", p25: 25, p50: 38, p75: 55, mean: 39, n: 100, unit: "days" },
  { segType: "INDUSTRY", segVal: "MarTech", metric: "cac", p25: 10000, p50: 18000, p75: 30000, mean: 19000, n: 95, unit: "USD" },
  { segType: "INDUSTRY", segVal: "MarTech", metric: "nrr", p25: 0.95, p50: 1.05, p75: 1.15, mean: 1.05, n: 92, unit: "ratio" },
  { segType: "INDUSTRY", segVal: "MarTech", metric: "churnRate", p25: 0.02, p50: 0.035, p75: 0.06, mean: 0.038, n: 92, unit: "ratio" },

  // --- HRTech ---
  { segType: "INDUSTRY", segVal: "HRTech", metric: "winRate", p25: 0.17, p50: 0.23, p75: 0.31, mean: 0.24, n: 75, unit: "ratio" },
  { segType: "INDUSTRY", segVal: "HRTech", metric: "salesCycleLength", p25: 30, p50: 45, p75: 65, mean: 47, n: 75, unit: "days" },
  { segType: "INDUSTRY", segVal: "HRTech", metric: "cac", p25: 12000, p50: 22000, p75: 38000, mean: 24000, n: 72, unit: "USD" },
  { segType: "INDUSTRY", segVal: "HRTech", metric: "nrr", p25: 0.98, p50: 1.08, p75: 1.18, mean: 1.08, n: 70, unit: "ratio" },
  { segType: "INDUSTRY", segVal: "HRTech", metric: "churnRate", p25: 0.015, p50: 0.028, p75: 0.045, mean: 0.029, n: 70, unit: "ratio" },
];

// ============================================================
// GTM Motion Benchmarks
// ============================================================

const motionBenchmarks = [
  // --- Product-Led ---
  { segType: "GTM_MOTION", segVal: "Product-Led", metric: "winRate", p25: 0.22, p50: 0.30, p75: 0.42, mean: 0.31, n: 130, unit: "ratio" },
  { segType: "GTM_MOTION", segVal: "Product-Led", metric: "salesCycleLength", p25: 12, p50: 21, p75: 35, mean: 23, n: 130, unit: "days" },
  { segType: "GTM_MOTION", segVal: "Product-Led", metric: "cac", p25: 3000, p50: 8000, p75: 15000, mean: 9000, n: 125, unit: "USD" },
  { segType: "GTM_MOTION", segVal: "Product-Led", metric: "nrr", p25: 1.05, p50: 1.15, p75: 1.30, mean: 1.17, n: 120, unit: "ratio" },
  { segType: "GTM_MOTION", segVal: "Product-Led", metric: "churnRate", p25: 0.02, p50: 0.04, p75: 0.06, mean: 0.04, n: 120, unit: "ratio" },
  { segType: "GTM_MOTION", segVal: "Product-Led", metric: "paybackMonths", p25: 6, p50: 10, p75: 16, mean: 11, n: 100, unit: "months" },

  // --- Sales-Led ---
  { segType: "GTM_MOTION", segVal: "Sales-Led", metric: "winRate", p25: 0.16, p50: 0.22, p75: 0.30, mean: 0.23, n: 150, unit: "ratio" },
  { segType: "GTM_MOTION", segVal: "Sales-Led", metric: "salesCycleLength", p25: 40, p50: 62, p75: 95, mean: 66, n: 150, unit: "days" },
  { segType: "GTM_MOTION", segVal: "Sales-Led", metric: "cac", p25: 20000, p50: 38000, p75: 65000, mean: 41000, n: 145, unit: "USD" },
  { segType: "GTM_MOTION", segVal: "Sales-Led", metric: "nrr", p25: 1.02, p50: 1.12, p75: 1.22, mean: 1.12, n: 140, unit: "ratio" },
  { segType: "GTM_MOTION", segVal: "Sales-Led", metric: "churnRate", p25: 0.008, p50: 0.018, p75: 0.03, mean: 0.019, n: 140, unit: "ratio" },
  { segType: "GTM_MOTION", segVal: "Sales-Led", metric: "paybackMonths", p25: 14, p50: 22, p75: 32, mean: 23, n: 120, unit: "months" },

  // --- Hybrid ---
  { segType: "GTM_MOTION", segVal: "Hybrid", metric: "winRate", p25: 0.19, p50: 0.25, p75: 0.34, mean: 0.26, n: 110, unit: "ratio" },
  { segType: "GTM_MOTION", segVal: "Hybrid", metric: "salesCycleLength", p25: 25, p50: 40, p75: 60, mean: 42, n: 110, unit: "days" },
  { segType: "GTM_MOTION", segVal: "Hybrid", metric: "cac", p25: 10000, p50: 20000, p75: 35000, mean: 22000, n: 105, unit: "USD" },
  { segType: "GTM_MOTION", segVal: "Hybrid", metric: "nrr", p25: 1.05, p50: 1.15, p75: 1.25, mean: 1.15, n: 100, unit: "ratio" },
  { segType: "GTM_MOTION", segVal: "Hybrid", metric: "churnRate", p25: 0.012, p50: 0.025, p75: 0.04, mean: 0.026, n: 100, unit: "ratio" },
  { segType: "GTM_MOTION", segVal: "Hybrid", metric: "paybackMonths", p25: 10, p50: 16, p75: 24, mean: 17, n: 85, unit: "months" },
];

// ============================================================
// ARR Range Benchmarks
// ============================================================

const arrBenchmarks = [
  // --- $0-$1M ---
  { segType: "ARR_RANGE", segVal: "$0-$1M", metric: "winRate", p25: 0.10, p50: 0.16, p75: 0.24, mean: 0.17, n: 90, unit: "ratio" },
  { segType: "ARR_RANGE", segVal: "$0-$1M", metric: "cac", p25: 5000, p50: 12000, p75: 22000, mean: 13000, n: 85, unit: "USD" },
  { segType: "ARR_RANGE", segVal: "$0-$1M", metric: "nrr", p25: 0.85, p50: 0.95, p75: 1.05, mean: 0.95, n: 80, unit: "ratio" },
  { segType: "ARR_RANGE", segVal: "$0-$1M", metric: "churnRate", p25: 0.03, p50: 0.05, p75: 0.08, mean: 0.053, n: 80, unit: "ratio" },

  // --- $1M-$5M ---
  { segType: "ARR_RANGE", segVal: "$1M-$5M", metric: "winRate", p25: 0.15, p50: 0.21, p75: 0.28, mean: 0.21, n: 120, unit: "ratio" },
  { segType: "ARR_RANGE", segVal: "$1M-$5M", metric: "cac", p25: 12000, p50: 20000, p75: 35000, mean: 22000, n: 115, unit: "USD" },
  { segType: "ARR_RANGE", segVal: "$1M-$5M", metric: "nrr", p25: 0.95, p50: 1.05, p75: 1.15, mean: 1.05, n: 110, unit: "ratio" },
  { segType: "ARR_RANGE", segVal: "$1M-$5M", metric: "churnRate", p25: 0.02, p50: 0.035, p75: 0.055, mean: 0.037, n: 110, unit: "ratio" },

  // --- $5M-$20M ---
  { segType: "ARR_RANGE", segVal: "$5M-$20M", metric: "winRate", p25: 0.20, p50: 0.26, p75: 0.34, mean: 0.27, n: 100, unit: "ratio" },
  { segType: "ARR_RANGE", segVal: "$5M-$20M", metric: "cac", p25: 18000, p50: 32000, p75: 52000, mean: 34000, n: 95, unit: "USD" },
  { segType: "ARR_RANGE", segVal: "$5M-$20M", metric: "nrr", p25: 1.02, p50: 1.12, p75: 1.22, mean: 1.12, n: 92, unit: "ratio" },
  { segType: "ARR_RANGE", segVal: "$5M-$20M", metric: "churnRate", p25: 0.012, p50: 0.025, p75: 0.04, mean: 0.026, n: 92, unit: "ratio" },

  // --- $20M-$100M ---
  { segType: "ARR_RANGE", segVal: "$20M-$100M", metric: "winRate", p25: 0.24, p50: 0.30, p75: 0.40, mean: 0.31, n: 75, unit: "ratio" },
  { segType: "ARR_RANGE", segVal: "$20M-$100M", metric: "cac", p25: 30000, p50: 50000, p75: 80000, mean: 53000, n: 72, unit: "USD" },
  { segType: "ARR_RANGE", segVal: "$20M-$100M", metric: "nrr", p25: 1.08, p50: 1.18, p75: 1.28, mean: 1.18, n: 70, unit: "ratio" },
  { segType: "ARR_RANGE", segVal: "$20M-$100M", metric: "churnRate", p25: 0.008, p50: 0.018, p75: 0.03, mean: 0.019, n: 70, unit: "ratio" },

  // --- $100M+ ---
  { segType: "ARR_RANGE", segVal: "$100M+", metric: "winRate", p25: 0.28, p50: 0.35, p75: 0.45, mean: 0.36, n: 50, unit: "ratio" },
  { segType: "ARR_RANGE", segVal: "$100M+", metric: "cac", p25: 45000, p50: 70000, p75: 110000, mean: 75000, n: 48, unit: "USD" },
  { segType: "ARR_RANGE", segVal: "$100M+", metric: "nrr", p25: 1.12, p50: 1.22, p75: 1.32, mean: 1.22, n: 45, unit: "ratio" },
  { segType: "ARR_RANGE", segVal: "$100M+", metric: "churnRate", p25: 0.005, p50: 0.012, p75: 0.022, mean: 0.013, n: 45, unit: "ratio" },
];

// ============================================================
// Pricing Trend Benchmarks
// ============================================================

const pricingBenchmarks = [
  { segType: "GTM_MOTION", segVal: "Product-Led", metric: "avgContractValue", p25: 3000, p50: 8000, p75: 18000, mean: 10000, n: 120, unit: "USD" },
  { segType: "GTM_MOTION", segVal: "Product-Led", metric: "discountRate", p25: 0.05, p50: 0.10, p75: 0.15, mean: 0.10, n: 115, unit: "ratio" },
  { segType: "GTM_MOTION", segVal: "Sales-Led", metric: "avgContractValue", p25: 25000, p50: 55000, p75: 120000, mean: 67000, n: 140, unit: "USD" },
  { segType: "GTM_MOTION", segVal: "Sales-Led", metric: "discountRate", p25: 0.10, p50: 0.18, p75: 0.28, mean: 0.19, n: 135, unit: "ratio" },
  { segType: "GTM_MOTION", segVal: "Hybrid", metric: "avgContractValue", p25: 10000, p50: 25000, p75: 55000, mean: 30000, n: 100, unit: "USD" },
  { segType: "GTM_MOTION", segVal: "Hybrid", metric: "discountRate", p25: 0.08, p50: 0.14, p75: 0.22, mean: 0.15, n: 95, unit: "ratio" },

  // Pricing model distribution by stage
  { segType: "STAGE", segVal: "Seed", metric: "avgContractValue", p25: 2000, p50: 5000, p75: 12000, mean: 6500, n: 80, unit: "USD" },
  { segType: "STAGE", segVal: "Series A", metric: "avgContractValue", p25: 5000, p50: 15000, p75: 35000, mean: 18000, n: 140, unit: "USD" },
  { segType: "STAGE", segVal: "Series B", metric: "avgContractValue", p25: 12000, p50: 30000, p75: 65000, mean: 36000, n: 115, unit: "USD" },
  { segType: "STAGE", segVal: "Series C", metric: "avgContractValue", p25: 25000, p50: 55000, p75: 110000, mean: 63000, n: 85, unit: "USD" },
  { segType: "STAGE", segVal: "Growth", metric: "avgContractValue", p25: 40000, p50: 85000, p75: 180000, mean: 102000, n: 60, unit: "USD" },
];

// ============================================================
// Marketplace / Ecosystem Benchmarks
// ============================================================

const ecosystemBenchmarks = [
  { segType: "STAGE", segVal: "Seed", metric: "partnerSourcedRevenuePct", p25: 0.0, p50: 0.02, p75: 0.08, mean: 0.03, n: 60, unit: "ratio" },
  { segType: "STAGE", segVal: "Series A", metric: "partnerSourcedRevenuePct", p25: 0.03, p50: 0.08, p75: 0.15, mean: 0.09, n: 100, unit: "ratio" },
  { segType: "STAGE", segVal: "Series B", metric: "partnerSourcedRevenuePct", p25: 0.08, p50: 0.15, p75: 0.25, mean: 0.16, n: 90, unit: "ratio" },
  { segType: "STAGE", segVal: "Series C", metric: "partnerSourcedRevenuePct", p25: 0.12, p50: 0.22, p75: 0.35, mean: 0.23, n: 70, unit: "ratio" },
  { segType: "STAGE", segVal: "Growth", metric: "partnerSourcedRevenuePct", p25: 0.18, p50: 0.30, p75: 0.45, mean: 0.31, n: 50, unit: "ratio" },

  { segType: "STAGE", segVal: "Seed", metric: "integrationCount", p25: 2, p50: 5, p75: 10, mean: 6, n: 60, unit: "count" },
  { segType: "STAGE", segVal: "Series A", metric: "integrationCount", p25: 8, p50: 15, p75: 30, mean: 18, n: 100, unit: "count" },
  { segType: "STAGE", segVal: "Series B", metric: "integrationCount", p25: 20, p50: 40, p75: 70, mean: 43, n: 90, unit: "count" },
  { segType: "STAGE", segVal: "Series C", metric: "integrationCount", p25: 40, p50: 75, p75: 120, mean: 78, n: 70, unit: "count" },
  { segType: "STAGE", segVal: "Growth", metric: "integrationCount", p25: 80, p50: 150, p75: 250, mean: 160, n: 50, unit: "count" },
];

// ============================================================
// Data Sources (seed for horizon-sources table)
// ============================================================

const dataSources = [
  { id: "openview-2024", name: "OpenView SaaS Benchmarks 2024", type: "Survey", url: "https://openviewpartners.com/benchmarks", description: "Annual SaaS benchmarks survey covering 600+ companies", recordCount: 640, reliability: 0.92 },
  { id: "bessemer-cloud", name: "Bessemer Cloud Index", type: "Public Filing", description: "Public cloud company performance data from SEC filings", recordCount: 85, reliability: 0.98 },
  { id: "tomasz-tunguz", name: "Tomasz Tunguz Research", type: "Manual", url: "https://tomtunguz.com", description: "VC research and SaaS benchmarking data", recordCount: 200, reliability: 0.85 },
  { id: "saastr-survey", name: "SaaStr Annual Survey", type: "Survey", description: "Community-sourced SaaS metrics from SaaStr events", recordCount: 450, reliability: 0.80 },
  { id: "keybanc-saas", name: "KeyBanc SaaS Survey", type: "Survey", description: "Private SaaS company survey by KeyBanc Capital Markets", recordCount: 300, reliability: 0.90 },
  { id: "iconiq-growth", name: "ICONIQ Growth Data", type: "Survey", description: "Growth metrics from ICONIQ Capital portfolio and network", recordCount: 150, reliability: 0.88 },
  { id: "wing-benchmarks", name: "Wing VC Benchmarks", type: "CSV", description: "Enterprise SaaS benchmarks from Wing Venture Capital", recordCount: 180, reliability: 0.86 },
  { id: "internal-advisory", name: "Internal Advisory Data", type: "Manual", description: "Proprietary data from GTM advisory engagements", recordCount: 120, reliability: 0.95 },
];

// ============================================================
// Transform & Load
// ============================================================

function toBenchmarkItems(
  benchmarks: { segType: string; segVal: string; metric: string; p25: number; p50: number; p75: number; mean: number; n: number; unit: string }[]
): Record<string, unknown>[] {
  return benchmarks.map((b) => ({
    pk: `BENCH#${b.segType}#${b.segVal}`,
    sk: `METRIC#${b.metric}`,
    segmentType: b.segType,
    segmentValue: b.segVal,
    metricName: b.metric,
    p25: b.p25,
    p50: b.p50,
    p75: b.p75,
    mean: b.mean,
    sampleSize: b.n,
    unit: b.unit,
    updatedAt: now,
  }));
}

function toSourceItems(
  sources: { id: string; name: string; type: string; url?: string; description: string; recordCount: number; reliability: number }[]
): Record<string, unknown>[] {
  return sources.map((s) => ({
    pk: `SOURCE#${s.id}`,
    sk: "META",
    id: s.id,
    name: s.name,
    type: s.type,
    url: s.url,
    description: s.description,
    lastUpdated: now,
    recordCount: s.recordCount,
    reliability: s.reliability,
  }));
}

// ============================================================
// Main
// ============================================================

async function main(): Promise<void> {
  console.log("═══════════════════════════════════════════");
  console.log("  Project Horizon — Seed Data");
  console.log(`  Region: ${REGION}`);
  console.log("═══════════════════════════════════════════");

  // Benchmarks
  const allBenchmarks = [
    ...toBenchmarkItems(stageBenchmarks),
    ...toBenchmarkItems(verticalBenchmarks),
    ...toBenchmarkItems(motionBenchmarks),
    ...toBenchmarkItems(arrBenchmarks),
    ...toBenchmarkItems(pricingBenchmarks),
    ...toBenchmarkItems(ecosystemBenchmarks),
  ];

  console.log(`\n📊 Loading ${allBenchmarks.length} benchmark records...`);
  await batchPut(TABLES.BENCHMARKS, allBenchmarks);
  console.log("  ✓ Benchmarks loaded");

  // Segment breakdown
  const segments = new Map<string, number>();
  allBenchmarks.forEach((b) => {
    const key = b.segmentType as string;
    segments.set(key, (segments.get(key) || 0) + 1);
  });
  segments.forEach((count, type) => {
    console.log(`    ${type}: ${count} metrics`);
  });

  // Data Sources
  const sourceItems = toSourceItems(dataSources);
  console.log(`\n📚 Loading ${sourceItems.length} data sources...`);
  await batchPut(TABLES.SOURCES, sourceItems);
  console.log("  ✓ Data sources loaded");

  console.log("\n✅ Seed complete!\n");
  console.log("Summary:");
  console.log(`  Benchmark records: ${allBenchmarks.length}`);
  console.log(`  Data sources: ${sourceItems.length}`);
  console.log(`  Segments: ${Array.from(segments.keys()).join(", ")}`);
  console.log("");
}

main().catch((err) => {
  console.error("\n❌ Seed failed:", err);
  process.exit(1);
});
