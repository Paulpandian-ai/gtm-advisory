"use client";

import { useState, useEffect } from "react";
import { cn } from "@/lib/utils";
import {
  Building2,
  TrendingUp,
  Database,
  Satellite,
  Loader2,
  Zap,
  BarChart3,
  Users,
  ArrowUpRight,
  ArrowDownRight,
  Clock,
  Plus,
  FileDown,
  RefreshCcw,
} from "lucide-react";
import { InsightBox } from "@/components/ui/insight-box";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend,
} from "recharts";

/* ── Types ─────────────────────────────────────────────── */

interface DashboardData {
  stats: {
    totalCompanies: number;
    medianGrowth: number;
    dataPoints: number;
    activeSources: number;
  };
  companiesByStage: { stage: string; count: number }[];
  companiesByMotion: { motion: string; count: number }[];
  insights: {
    id: string;
    insightText: string;
    category: string;
    impactScore: number;
    confidence: number;
    relatedSegments: string[];
  }[];
  recentActivity: { type: string; label: string; timestamp: string }[];
  dataMoatScore: number;
}

/* ── Constants ─────────────────────────────────────────── */

const STAGE_COLORS: Record<string, string> = {
  Seed: "#f59e0b",
  "Series A": "#3b82f6",
  "Series B": "#8b5cf6",
  "Series C": "#ec4899",
  "Series D+": "#ef4444",
  Growth: "#22c55e",
  Public: "#06b6d4",
};

const MOTION_COLORS = ["#3b82f6", "#22c55e", "#f59e0b", "#8b5cf6", "#ec4899"];

const MILESTONES = [
  { pct: 25, label: "Foundation" },
  { pct: 50, label: "Traction" },
  { pct: 75, label: "Authority" },
  { pct: 100, label: "Moat" },
];

const ACTIVITY_ICONS: Record<string, typeof Plus> = {
  company_added: Plus,
  import: FileDown,
  benchmark_update: RefreshCcw,
};

/* ── Stat card sub-component ───────────────────────────── */

function StatCard({
  label,
  value,
  icon: Icon,
  color,
  trend,
}: {
  label: string;
  value: string | number;
  icon: typeof Building2;
  color: string;
  trend?: "up" | "down";
}) {
  return (
    <div className="bg-[#0f172a] border border-[#1e293b] rounded-lg p-5">
      <div className="flex items-center justify-between mb-3">
        <span className="text-xs text-[#64748b] uppercase tracking-wider">
          {label}
        </span>
        <Icon className="w-4 h-4" style={{ color }} />
      </div>
      <div className="flex items-end gap-2">
        <span
          className="text-2xl font-mono font-semibold"
          style={{ color }}
        >
          {typeof value === "number" ? value.toLocaleString() : value}
        </span>
        {trend && (
          <span
            className={cn(
              "flex items-center text-xs font-medium mb-0.5",
              trend === "up" ? "text-[#22c55e]" : "text-[#ef4444]"
            )}
          >
            {trend === "up" ? (
              <ArrowUpRight className="w-3 h-3" />
            ) : (
              <ArrowDownRight className="w-3 h-3" />
            )}
          </span>
        )}
      </div>
    </div>
  );
}

/* ── Main component ────────────────────────────────────── */

export default function DashboardPage() {
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchDashboard() {
      try {
        const res = await fetch("/api/dashboard");
        if (res.ok) {
          setData(await res.json());
        }
      } catch {
        // no-op — will show empty state
      } finally {
        setLoading(false);
      }
    }
    fetchDashboard();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-32">
        <Loader2 className="w-8 h-8 animate-spin text-[#3b82f6]" />
      </div>
    );
  }

  const stats = data?.stats ?? {
    totalCompanies: 0,
    medianGrowth: 0,
    dataPoints: 0,
    activeSources: 0,
  };

  return (
    <div className="space-y-8">
      {/* Page header */}
      <div>
        <h2 className="text-2xl font-semibold text-[#f8fafc]">Dashboard</h2>
        <p className="text-sm text-[#64748b] mt-1">
          GTM Benchmark Intelligence overview
        </p>
      </div>

      {/* Row 1 — Stat cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          label="Total Companies"
          value={stats.totalCompanies}
          icon={Building2}
          color="#3b82f6"
          trend={stats.totalCompanies > 0 ? "up" : undefined}
        />
        <StatCard
          label="Median Growth"
          value={stats.medianGrowth > 0 ? `${stats.medianGrowth}%` : "—"}
          icon={TrendingUp}
          color="#22c55e"
          trend={stats.medianGrowth > 50 ? "up" : stats.medianGrowth > 0 ? "down" : undefined}
        />
        <StatCard
          label="Data Points"
          value={stats.dataPoints}
          icon={Database}
          color="#f59e0b"
          trend={stats.dataPoints > 0 ? "up" : undefined}
        />
        <StatCard
          label="Active Sources"
          value={stats.activeSources}
          icon={Satellite}
          color="#8b5cf6"
          trend={stats.activeSources > 0 ? "up" : undefined}
        />
      </div>

      {/* Row 2 — Insights + Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Left: Insights */}
        <div className="bg-[#0f172a] border border-[#1e293b] rounded-lg p-6">
          <h3 className="text-sm font-medium text-[#94a3b8] mb-4 flex items-center gap-2">
            <Zap className="w-4 h-4 text-[#f59e0b]" />
            Benchmark Insights
          </h3>
          <div className="space-y-3">
            {data?.insights && data.insights.length > 0 ? (
              data.insights.slice(0, 5).map((insight, i) => (
                <InsightBox
                  key={insight.id || i}
                  title={insight.category}
                  body={insight.insightText}
                  variant={
                    insight.impactScore >= 8
                      ? "success"
                      : insight.impactScore >= 5
                        ? "info"
                        : "warning"
                  }
                  source={
                    insight.relatedSegments?.[0] ?? undefined
                  }
                />
              ))
            ) : (
              <div className="py-8 text-center">
                <BarChart3 className="w-8 h-8 text-[#334155] mx-auto mb-2" />
                <p className="text-sm text-[#64748b]">
                  Insights will appear once benchmark data is analyzed
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Right: Recent Activity */}
        <div className="bg-[#0f172a] border border-[#1e293b] rounded-lg p-6">
          <h3 className="text-sm font-medium text-[#94a3b8] mb-4 flex items-center gap-2">
            <Clock className="w-4 h-4 text-[#3b82f6]" />
            Recent Activity
          </h3>
          {data?.recentActivity && data.recentActivity.length > 0 ? (
            <div className="relative pl-6">
              {/* Timeline line */}
              <div className="absolute left-2 top-2 bottom-2 w-px bg-[#1e293b]" />

              <div className="space-y-4">
                {data.recentActivity.slice(0, 8).map((activity, i) => {
                  const ActivityIcon =
                    ACTIVITY_ICONS[activity.type] || Plus;
                  return (
                    <div key={i} className="relative flex items-start gap-3">
                      {/* Blue dot */}
                      <div className="absolute -left-6 top-1.5 w-2.5 h-2.5 rounded-full bg-[#3b82f6] border-2 border-[#0f172a]" />
                      <div className="min-w-0 flex-1">
                        <p className="text-sm text-[#e2e8f0] truncate">
                          {activity.label}
                        </p>
                        <p className="text-xs text-[#64748b]">
                          {activity.timestamp
                            ? new Date(activity.timestamp).toLocaleDateString(
                                "en-US",
                                {
                                  month: "short",
                                  day: "numeric",
                                  hour: "2-digit",
                                  minute: "2-digit",
                                }
                              )
                            : "—"}
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          ) : (
            <div className="py-8 text-center">
              <Users className="w-8 h-8 text-[#334155] mx-auto mb-2" />
              <p className="text-sm text-[#64748b]">
                Activity will appear as you add companies and import data
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Row 3 — Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Left: Companies by Stage — horizontal bar chart */}
        <div className="bg-[#0f172a] border border-[#1e293b] rounded-lg p-6">
          <h3 className="text-sm font-medium text-[#94a3b8] mb-4">
            Companies by Stage
          </h3>
          {data?.companiesByStage && data.companiesByStage.length > 0 ? (
            <div className="h-[280px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={data.companiesByStage}
                  layout="vertical"
                  margin={{ left: 60, right: 20, top: 5, bottom: 5 }}
                >
                  <XAxis type="number" tick={{ fill: "#64748b", fontSize: 12 }} />
                  <YAxis
                    type="category"
                    dataKey="stage"
                    tick={{ fill: "#e2e8f0", fontSize: 12 }}
                    width={60}
                  />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "#0f172a",
                      border: "1px solid #1e293b",
                      borderRadius: "8px",
                      color: "#f8fafc",
                      fontSize: "12px",
                    }}
                  />
                  <Bar dataKey="count" radius={[0, 4, 4, 0]}>
                    {data.companiesByStage.map((entry) => (
                      <Cell
                        key={entry.stage}
                        fill={STAGE_COLORS[entry.stage] || "#3b82f6"}
                      />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <div className="py-8 text-center">
              <p className="text-sm text-[#64748b]">
                No company data yet
              </p>
            </div>
          )}
        </div>

        {/* Right: Companies by GTM Motion — donut chart */}
        <div className="bg-[#0f172a] border border-[#1e293b] rounded-lg p-6">
          <h3 className="text-sm font-medium text-[#94a3b8] mb-4">
            Companies by GTM Motion
          </h3>
          {data?.companiesByMotion && data.companiesByMotion.length > 0 ? (
            <div className="h-[280px]">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={data.companiesByMotion}
                    cx="50%"
                    cy="50%"
                    innerRadius={55}
                    outerRadius={95}
                    dataKey="count"
                    nameKey="motion"
                    stroke="none"
                  >
                    {data.companiesByMotion.map((_, i) => (
                      <Cell
                        key={i}
                        fill={MOTION_COLORS[i % MOTION_COLORS.length]}
                      />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "#0f172a",
                      border: "1px solid #1e293b",
                      borderRadius: "8px",
                      color: "#f8fafc",
                      fontSize: "12px",
                    }}
                  />
                  <Legend
                    formatter={(value: string) => (
                      <span className="text-xs text-[#94a3b8]">{value}</span>
                    )}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <div className="py-8 text-center">
              <p className="text-sm text-[#64748b]">
                No company data yet
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Bottom: Data Moat Score */}
      <div className="bg-[#0f172a] border border-[#1e293b] rounded-lg p-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-sm font-medium text-[#94a3b8] flex items-center gap-2">
              <Zap className="w-4 h-4 text-[#3b82f6]" />
              Data Moat Score
            </h3>
            <p className="text-xs text-[#64748b] mt-0.5">
              Based on total companies, data completeness, source diversity &amp;
              freshness
            </p>
          </div>
          <span className="text-2xl font-mono font-bold text-[#3b82f6]">
            {data?.dataMoatScore ?? 0}/100
          </span>
        </div>

        {/* Progress bar */}
        <div className="relative">
          <div className="h-3 rounded-full bg-[#1e293b] overflow-hidden">
            <div
              className="h-full rounded-full transition-all duration-700 ease-out"
              style={{
                width: `${data?.dataMoatScore ?? 0}%`,
                background:
                  "linear-gradient(90deg, #1e40af, #3b82f6, #60a5fa)",
              }}
            />
          </div>

          {/* Milestone markers */}
          <div className="relative mt-2">
            {MILESTONES.map((m) => (
              <div
                key={m.pct}
                className="absolute flex flex-col items-center"
                style={{
                  left: `${m.pct}%`,
                  transform: "translateX(-50%)",
                }}
              >
                <div
                  className={cn(
                    "w-2 h-2 rounded-full -mt-4",
                    (data?.dataMoatScore ?? 0) >= m.pct
                      ? "bg-[#3b82f6]"
                      : "bg-[#334155]"
                  )}
                />
                <span
                  className={cn(
                    "text-[10px] mt-1",
                    (data?.dataMoatScore ?? 0) >= m.pct
                      ? "text-[#3b82f6]"
                      : "text-[#64748b]"
                  )}
                >
                  {m.label}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
