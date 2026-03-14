"use client";

import { useState, useEffect } from "react";
import { StageSelector } from "@/components/benchmarks/stage-selector";
import { RevenueTab } from "@/components/benchmarks/revenue-tab";
import { GTMMotionTab } from "@/components/benchmarks/gtm-motion-tab";
import { EcosystemTab } from "@/components/benchmarks/ecosystem-tab";
import { PricingTab } from "@/components/benchmarks/pricing-tab";
import { YourScoreTab } from "@/components/benchmarks/your-score-tab";
import { cn } from "@/lib/utils";

interface BenchmarkMetric {
  metricName: string;
  p25: number;
  p50: number;
  p75: number;
  mean: number;
  sampleSize: number;
  unit?: string;
}

const tabs = [
  { id: "revenue", label: "Revenue & Growth" },
  { id: "gtm-motion", label: "GTM Motion" },
  { id: "ecosystem", label: "Ecosystem" },
  { id: "pricing", label: "Pricing" },
  { id: "your-score", label: "Your Score" },
] as const;

type TabId = (typeof tabs)[number]["id"];

export default function BenchmarksPage() {
  const [stage, setStage] = useState("Series A");
  const [activeTab, setActiveTab] = useState<TabId>("revenue");
  const [metrics, setMetrics] = useState<BenchmarkMetric[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchBenchmarks() {
      setLoading(true);
      try {
        const res = await fetch(
          `/api/benchmarks?stage=${encodeURIComponent(stage)}`
        );
        const data = await res.json();
        setMetrics(data.benchmarks ?? []);
      } catch {
        setMetrics([]);
      }
      setLoading(false);
    }
    fetchBenchmarks();
  }, [stage]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-2xl font-semibold text-[#f8fafc]">
          Benchmark Explorer
        </h2>
        <p className="text-sm text-[#64748b] mt-1">
          Explore and compare GTM benchmarks across stages and segments
        </p>
      </div>

      {/* Stage selector */}
      <StageSelector selected={stage} onSelect={setStage} />

      {/* Tab bar */}
      <div className="flex items-center gap-1 border-b border-[#1e293b] overflow-x-auto">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={cn(
              "px-4 py-2.5 text-sm font-medium whitespace-nowrap transition-all border-b-2 -mb-px",
              activeTab === tab.id
                ? "text-[#3b82f6] border-[#3b82f6]"
                : "text-[#64748b] border-transparent hover:text-[#94a3b8]"
            )}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Tab content */}
      {loading ? (
        <div className="flex items-center justify-center py-20 text-[#64748b]">
          <div className="flex items-center gap-3">
            <div className="w-2 h-2 rounded-full bg-[#3b82f6] animate-pulse-blue" />
            Loading benchmarks...
          </div>
        </div>
      ) : (
        <div>
          {activeTab === "revenue" && (
            <RevenueTab metrics={metrics} stage={stage} />
          )}
          {activeTab === "gtm-motion" && <GTMMotionTab stage={stage} />}
          {activeTab === "ecosystem" && (
            <EcosystemTab metrics={metrics} stage={stage} />
          )}
          {activeTab === "pricing" && (
            <PricingTab metrics={metrics} stage={stage} />
          )}
          {activeTab === "your-score" && (
            <YourScoreTab metrics={metrics} stage={stage} />
          )}
        </div>
      )}
    </div>
  );
}
