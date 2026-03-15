"use client";

import { useState, useEffect, use } from "react";
import { useRouter } from "next/navigation";
import { cn } from "@/lib/utils";
import { MetricCard } from "@/components/ui/metric-card";
import { HorizontalBarChart } from "@/components/ui/horizontal-bar-chart";
import {
  ArrowLeft,
  Loader2,
  Building2,
  TrendingUp,
  TrendingDown,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  Tooltip,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar,
  Legend,
} from "recharts";

/* ── Types ─────────────────────────────────────────────── */

interface CompanyData {
  profile: {
    id: string;
    name: string;
    industry: string;
    stage: string;
    arr: number;
    growth: number;
    employees: number;
    gtmMotion: string;
    hqLocation: string;
    founded: number;
    description: string;
    website?: string;
  } | null;
  revenue: {
    nrr: number;
    churnRate: number;
    mrr: number;
    grossRevRetention: number;
    expansionRevenue: number;
    revenuePerEmployee: number;
  } | null;
  sales: {
    winRate: number;
    salesCycleLength: number;
    cac: number;
    ltv: number;
    ltvCacRatio: number;
    avgDealSize: number;
    pipelineCoverage: number;
    quotaAttainment: number;
  } | null;
  channel: {
    outboundPct: number;
    inboundPct: number;
    plgPct: number;
    partnerPct: number;
  } | null;
  ecosystem: {
    totalPartners: number;
    activePartners: number;
    partnerSourcedRevenuePct: number;
    marketplaceListings: number;
    cosellDeals: number;
    cosellRevenue: number;
    integrationCount: number;
  } | null;
}

interface GTMScore {
  totalScore: number;
  breakdown: {
    growthEfficiency: number;
    salesEfficiency: number;
    retentionHealth: number;
    channelDiversity: number;
    ecosystemLeverage: number;
  };
  percentile: number;
  grade: string;
}

/* ── Circular Gauge ────────────────────────────────────── */

function ScoreGauge({ score, grade }: { score: number; grade: string }) {
  const radius = 52;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (score / 100) * circumference;
  const color =
    score >= 70 ? "#22c55e" : score >= 40 ? "#f59e0b" : "#ef4444";

  return (
    <div className="relative w-[140px] h-[140px] flex-shrink-0">
      <svg
        viewBox="0 0 120 120"
        className="w-full h-full -rotate-90"
      >
        <circle
          cx="60"
          cy="60"
          r={radius}
          fill="none"
          stroke="#1e293b"
          strokeWidth="8"
        />
        <circle
          cx="60"
          cy="60"
          r={radius}
          fill="none"
          stroke={color}
          strokeWidth="8"
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          className="transition-all duration-1000 ease-out"
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span
          className="text-3xl font-mono font-bold"
          style={{ color }}
        >
          {score}
        </span>
        <span className="text-xs text-[#94a3b8] -mt-0.5">
          {grade}
        </span>
      </div>
    </div>
  );
}

/* ── Constants ─────────────────────────────────────────── */

const TABS = ["Overview", "GTM Analysis", "Ecosystem", "Comparison"] as const;
type Tab = (typeof TABS)[number];

const STAGE_COLORS: Record<string, string> = {
  Seed: "bg-[#f59e0b]/15 text-[#f59e0b] border-[#f59e0b]/30",
  "Series A": "bg-[#3b82f6]/15 text-[#3b82f6] border-[#3b82f6]/30",
  "Series B": "bg-[#8b5cf6]/15 text-[#8b5cf6] border-[#8b5cf6]/30",
  "Series C": "bg-[#ec4899]/15 text-[#ec4899] border-[#ec4899]/30",
  Growth: "bg-[#22c55e]/15 text-[#22c55e] border-[#22c55e]/30",
};

const CHANNEL_COLORS = ["#3b82f6", "#22c55e", "#f59e0b", "#8b5cf6"];

function formatArr(arr: number): string {
  if (arr >= 1_000_000_000) return `$${(arr / 1_000_000_000).toFixed(1)}B`;
  if (arr >= 1_000_000) return `$${(arr / 1_000_000).toFixed(1)}M`;
  if (arr >= 1_000) return `$${(arr / 1_000).toFixed(0)}K`;
  return `$${arr}`;
}

/* ── Component ─────────────────────────────────────────── */

export default function CompanyDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const router = useRouter();
  const [data, setData] = useState<CompanyData | null>(null);
  const [gtmScore, setGtmScore] = useState<GTMScore | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<Tab>("Overview");

  useEffect(() => {
    async function fetchData() {
      try {
        const [companyRes, scoreRes] = await Promise.allSettled([
          fetch(`/api/companies/${id}`),
          fetch(`/api/companies/${id}/score`),
        ]);
        if (companyRes.status === "fulfilled" && companyRes.value.ok) {
          setData(await companyRes.value.json());
        }
        if (scoreRes.status === "fulfilled" && scoreRes.value.ok) {
          setGtmScore(await scoreRes.value.json());
        }
      } catch {
        // no-op
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, [id]);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-32">
        <Loader2 className="w-8 h-8 animate-spin text-[#3b82f6]" />
      </div>
    );
  }

  if (!data?.profile) {
    return (
      <div className="space-y-6">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => router.push("/companies")}
          className="text-[#94a3b8] hover:text-[#f8fafc]"
        >
          <ArrowLeft className="w-4 h-4 mr-1" />
          Back
        </Button>
        <div className="bg-[#0f172a] border border-[#1e293b] rounded-lg p-12 text-center">
          <Building2 className="w-10 h-10 text-[#64748b] mx-auto mb-4" />
          <h3 className="text-lg font-medium text-[#94a3b8]">
            Company not found
          </h3>
        </div>
      </div>
    );
  }

  const p = data.profile;
  const sales = data.sales;
  const revenue = data.revenue;
  const channel = data.channel;
  const eco = data.ecosystem;

  /* ── Channel donut data ─────────────────────────── */
  const channelData = channel
    ? [
        { name: "Outbound", value: channel.outboundPct },
        { name: "Inbound", value: channel.inboundPct },
        { name: "PLG", value: channel.plgPct },
        { name: "Partner", value: channel.partnerPct },
      ].filter((d) => d.value > 0)
    : [];

  /* ── Radar data (vs stage median placeholder) ─── */
  const radarData = [
    { metric: "Growth", company: p.growth, median: 80 },
    { metric: "Win Rate", company: sales?.winRate ?? 0, median: 22 },
    { metric: "NRR", company: revenue?.nrr ?? 0, median: 105 },
    { metric: "LTV/CAC", company: sales?.ltvCacRatio ?? 0, median: 3 },
    { metric: "Pipeline", company: sales?.pipelineCoverage ?? 0, median: 3 },
    { metric: "Quota %", company: sales?.quotaAttainment ?? 0, median: 65 },
  ];

  return (
    <div className="space-y-6">
      {/* Back button */}
      <Button
        variant="ghost"
        size="sm"
        onClick={() => router.push("/companies")}
        className="text-[#94a3b8] hover:text-[#f8fafc]"
      >
        <ArrowLeft className="w-4 h-4 mr-1" />
        Back to Companies
      </Button>

      {/* Header */}
      <div className="bg-[#0f172a] border border-[#1e293b] rounded-lg p-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex-1">
            <div className="flex items-center gap-3 mb-2">
              <h2 className="text-2xl font-semibold text-[#f8fafc]">
                {p.name}
              </h2>
              <span
                className={cn(
                  "text-xs px-2 py-0.5 rounded-full border",
                  STAGE_COLORS[p.stage] ||
                    "bg-[#1e293b] text-[#94a3b8] border-[#334155]"
                )}
              >
                {p.stage}
              </span>
              <span className="text-xs px-2 py-0.5 rounded-full bg-[#1e293b] text-[#94a3b8] border border-[#334155]">
                {p.industry}
              </span>
              <span className="text-xs px-2 py-0.5 rounded-full bg-[#1e293b] text-[#94a3b8] border border-[#334155]">
                {p.gtmMotion}
              </span>
            </div>
            {p.description && (
              <p className="text-sm text-[#64748b]">{p.description}</p>
            )}
          </div>

          {/* GTM Score Gauge */}
          {gtmScore && (
            <div className="flex flex-col items-center gap-1">
              <span className="text-[10px] text-[#64748b] uppercase tracking-wider">
                GTM Score
              </span>
              <ScoreGauge
                score={gtmScore.totalScore}
                grade={gtmScore.grade}
              />
              <span className="text-[10px] text-[#64748b]">
                P{gtmScore.percentile} vs {p.stage}
              </span>
            </div>
          )}
        </div>

        {/* Key metrics row */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-6">
          <div>
            <div className="text-xs text-[#64748b] mb-1">ARR</div>
            <div className="text-xl font-mono font-bold text-[#f8fafc]">
              {formatArr(p.arr)}
            </div>
          </div>
          <div>
            <div className="text-xs text-[#64748b] mb-1">Growth</div>
            <div className="flex items-center gap-1">
              {p.growth > 0 ? (
                <TrendingUp className="w-4 h-4 text-[#22c55e]" />
              ) : (
                <TrendingDown className="w-4 h-4 text-[#ef4444]" />
              )}
              <span
                className={cn(
                  "text-xl font-mono font-bold",
                  p.growth > 0 ? "text-[#22c55e]" : "text-[#ef4444]"
                )}
              >
                {p.growth}%
              </span>
            </div>
          </div>
          <div>
            <div className="text-xs text-[#64748b] mb-1">Employees</div>
            <div className="text-xl font-mono font-bold text-[#f8fafc]">
              {p.employees.toLocaleString()}
            </div>
          </div>
          <div>
            <div className="text-xs text-[#64748b] mb-1">Founded</div>
            <div className="text-xl font-mono font-bold text-[#f8fafc]">
              {p.founded}
            </div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-1 border-b border-[#1e293b]">
        {TABS.map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={cn(
              "px-4 py-2.5 text-sm font-medium whitespace-nowrap transition-all border-b-2 -mb-px",
              activeTab === tab
                ? "text-[#3b82f6] border-[#3b82f6]"
                : "text-[#64748b] border-transparent hover:text-[#94a3b8]"
            )}
          >
            {tab}
          </button>
        ))}
      </div>

      {/* Tab content */}
      {activeTab === "Overview" && (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {sales && (
            <>
              <MetricCard label="Win Rate" value={sales.winRate} format="percent" trend={sales.winRate > 22 ? "up" : "down"} />
              <MetricCard label="Sales Cycle" value={sales.salesCycleLength} format="days" />
              <MetricCard label="CAC" value={sales.cac} format="currency" />
              <MetricCard label="LTV" value={sales.ltv} format="currency" />
              <MetricCard label="LTV/CAC" value={sales.ltvCacRatio} format="ratio" highlight={sales.ltvCacRatio >= 3} />
              <MetricCard label="Avg Deal Size" value={sales.avgDealSize} format="currency" />
              <MetricCard label="Pipeline Coverage" value={sales.pipelineCoverage} format="ratio" />
              <MetricCard label="Quota Attainment" value={sales.quotaAttainment} format="percent" />
            </>
          )}
          {revenue && (
            <>
              <MetricCard label="NRR" value={revenue.nrr} format="percent" trend={revenue.nrr >= 100 ? "up" : "down"} highlight={revenue.nrr >= 110} />
              <MetricCard label="Churn Rate" value={revenue.churnRate} format="percent" trend={revenue.churnRate < 5 ? "up" : "down"} />
              <MetricCard label="MRR" value={revenue.mrr} format="currency" />
              <MetricCard label="Rev/Employee" value={revenue.revenuePerEmployee} format="currency" />
            </>
          )}
          {!sales && !revenue && (
            <div className="col-span-full bg-[#0f172a] border border-[#1e293b] rounded-lg p-8 text-center">
              <p className="text-sm text-[#64748b]">No metrics data available for this company.</p>
            </div>
          )}
        </div>
      )}

      {activeTab === "GTM Analysis" && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Channel donut */}
          <div className="bg-[#0f172a] border border-[#1e293b] rounded-lg p-6">
            <h3 className="text-sm font-medium text-[#94a3b8] mb-4">
              Channel Mix
            </h3>
            {channelData.length > 0 ? (
              <div className="h-[280px]">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={channelData}
                      cx="50%"
                      cy="50%"
                      innerRadius={60}
                      outerRadius={100}
                      dataKey="value"
                      stroke="none"
                    >
                      {channelData.map((_, i) => (
                        <Cell
                          key={i}
                          fill={CHANNEL_COLORS[i % CHANNEL_COLORS.length]}
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
                      formatter={(value) => [`${value}%`, ""]}
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
              <p className="text-sm text-[#64748b] py-8 text-center">
                No channel mix data
              </p>
            )}
          </div>

          {/* GTM motion details */}
          <div className="bg-[#0f172a] border border-[#1e293b] rounded-lg p-6">
            <h3 className="text-sm font-medium text-[#94a3b8] mb-4">
              GTM Motion: {p.gtmMotion}
            </h3>
            <div className="space-y-4">
              {sales && (
                <HorizontalBarChart
                  data={[
                    { label: "Win Rate", value: sales.winRate, color: "#3b82f6" },
                    { label: "Quota Attainment", value: sales.quotaAttainment, color: "#22c55e" },
                    { label: "Pipeline Coverage", value: sales.pipelineCoverage * 10, color: "#f59e0b" },
                  ]}
                />
              )}
              {!sales && (
                <p className="text-sm text-[#64748b] py-4 text-center">
                  No sales metrics data
                </p>
              )}
            </div>
          </div>
        </div>
      )}

      {activeTab === "Ecosystem" && (
        <div className="bg-[#0f172a] border border-[#1e293b] rounded-lg p-6">
          {eco ? (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
              <MetricCard label="Total Partners" value={eco.totalPartners} />
              <MetricCard label="Active Partners" value={eco.activePartners} />
              <MetricCard
                label="Partner Revenue %"
                value={eco.partnerSourcedRevenuePct}
                format="percent"
              />
              <MetricCard
                label="Marketplace Listings"
                value={eco.marketplaceListings}
              />
              <MetricCard label="Co-sell Deals" value={eco.cosellDeals} />
              <MetricCard
                label="Co-sell Revenue"
                value={eco.cosellRevenue}
                format="currency"
              />
              <MetricCard
                label="Integrations"
                value={eco.integrationCount}
              />
            </div>
          ) : (
            <p className="text-sm text-[#64748b] py-8 text-center">
              No ecosystem data available.
            </p>
          )}
        </div>
      )}

      {activeTab === "Comparison" && (
        <div className="bg-[#0f172a] border border-[#1e293b] rounded-lg p-6">
          <h3 className="text-sm font-medium text-[#94a3b8] mb-4">
            vs {p.stage} Median
          </h3>
          <div className="h-[350px]">
            <ResponsiveContainer width="100%" height="100%">
              <RadarChart data={radarData}>
                <PolarGrid stroke="#1e293b" />
                <PolarAngleAxis
                  dataKey="metric"
                  tick={{ fill: "#94a3b8", fontSize: 12 }}
                />
                <PolarRadiusAxis tick={false} axisLine={false} />
                <Radar
                  name={p.name}
                  dataKey="company"
                  stroke="#3b82f6"
                  fill="#3b82f6"
                  fillOpacity={0.2}
                />
                <Radar
                  name="Stage Median"
                  dataKey="median"
                  stroke="#64748b"
                  fill="#64748b"
                  fillOpacity={0.1}
                />
                <Legend
                  formatter={(value: string) => (
                    <span className="text-xs text-[#94a3b8]">{value}</span>
                  )}
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
              </RadarChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}
    </div>
  );
}
