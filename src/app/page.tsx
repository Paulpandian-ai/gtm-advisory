import {
  BarChart3,
  TrendingUp,
  Database,
  Building2,
} from "lucide-react";

const stats = [
  {
    label: "Benchmarks Tracked",
    value: "—",
    icon: BarChart3,
    color: "var(--accent)",
  },
  {
    label: "Companies Profiled",
    value: "—",
    icon: Building2,
    color: "var(--positive)",
  },
  {
    label: "Data Sources",
    value: "—",
    icon: Database,
    color: "var(--warning)",
  },
  {
    label: "Insights Generated",
    value: "—",
    icon: TrendingUp,
    color: "var(--success)",
  },
];

export default function DashboardPage() {
  return (
    <div className="space-y-8">
      {/* Page header */}
      <div>
        <h2 className="text-2xl font-semibold text-[var(--text-primary)]">
          Dashboard
        </h2>
        <p className="text-sm text-[var(--text-muted)] mt-1">
          GTM Benchmark Intelligence overview
        </p>
      </div>

      {/* Stats grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((stat) => (
          <div
            key={stat.label}
            className="bg-[var(--bg-surface)] border border-[var(--border)] rounded-lg p-5 glow"
          >
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs text-[var(--text-muted)] uppercase tracking-wider">
                {stat.label}
              </span>
              <stat.icon
                className="w-4 h-4"
                style={{ color: stat.color }}
              />
            </div>
            <div
              className="text-2xl font-mono font-semibold"
              style={{ color: stat.color }}
              data-mono
            >
              {stat.value}
            </div>
          </div>
        ))}
      </div>

      {/* Empty state */}
      <div className="bg-[var(--bg-surface)] border border-[var(--border)] rounded-lg p-12 text-center">
        <Database className="w-10 h-10 text-[var(--text-muted)] mx-auto mb-4" />
        <h3 className="text-lg font-medium text-[var(--text-secondary)] mb-2">
          No data yet
        </h3>
        <p className="text-sm text-[var(--text-muted)] max-w-md mx-auto">
          Start by uploading benchmark data or connecting data sources to populate your dashboard.
        </p>
      </div>
    </div>
  );
}
