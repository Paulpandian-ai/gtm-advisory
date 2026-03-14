import { BarChart3 } from "lucide-react";

export default function BenchmarksPage() {
  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-2xl font-semibold text-[var(--text-primary)]">
          Benchmark Explorer
        </h2>
        <p className="text-sm text-[var(--text-muted)] mt-1">
          Explore and compare GTM benchmarks across companies and segments
        </p>
      </div>
      <div className="bg-[var(--bg-surface)] border border-[var(--border)] rounded-lg p-12 text-center">
        <BarChart3 className="w-10 h-10 text-[var(--text-muted)] mx-auto mb-4" />
        <h3 className="text-lg font-medium text-[var(--text-secondary)] mb-2">
          Benchmark Explorer
        </h3>
        <p className="text-sm text-[var(--text-muted)] max-w-md mx-auto">
          Upload benchmark data to start exploring comparisons and trends.
        </p>
      </div>
    </div>
  );
}
