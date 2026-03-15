/**
 * CLI script to recalculate benchmarks from company data.
 *
 * Usage: npx tsx scripts/recalculate-benchmarks.ts
 */

async function main() {
  console.log("═══════════════════════════════════════════");
  console.log("  Project Horizon — Recalculate Benchmarks");
  console.log("═══════════════════════════════════════════");

  // Dynamic import to use the app's module resolution
  const { recalculateBenchmarks } = await import(
    "../src/lib/intelligence/benchmark-calculator"
  );

  console.log("\n📊 Recalculating benchmarks from company data...");
  const result = await recalculateBenchmarks();

  console.log(`  ✓ Groups processed: ${result.groupsProcessed}`);
  console.log(`  ✓ Metrics written:  ${result.metricsWritten}`);
  console.log("\nDone!");
}

main().catch((err) => {
  console.error("Failed:", err);
  process.exit(1);
});
