"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Command,
  CommandInput,
  CommandList,
  CommandEmpty,
  CommandGroup,
  CommandItem,
} from "@/components/ui/command";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Building2,
  Search,
  Plus,
  Download,
  TrendingUp,
  TrendingDown,
  Loader2,
} from "lucide-react";
import { CompanyCardSkeleton } from "@/components/ui/skeletons";

/* ── Constants ─────────────────────────────────────────── */

const STAGES = [
  "All Stages",
  "Seed",
  "Series A",
  "Series B",
  "Series C",
  "Series D+",
  "Growth",
  "Public",
] as const;

const INDUSTRIES = [
  "All Industries",
  "SaaS",
  "FinTech",
  "HealthTech",
  "EdTech",
  "DevTools",
  "Security",
  "Data & Analytics",
  "MarTech",
  "HRTech",
  "E-Commerce",
  "Infrastructure",
  "AI / ML",
] as const;

const MOTIONS = [
  "All Motions",
  "Product-Led",
  "Sales-Led",
  "Hybrid",
  "Community-Led",
  "Partner-Led",
] as const;

const ARR_RANGES = [
  "All ARR",
  "<$1M",
  "$1M-$5M",
  "$5M-$10M",
  "$10M-$25M",
  "$25M-$50M",
  "$50M-$100M",
  "$100M+",
] as const;

const STAGE_COLORS: Record<string, string> = {
  Seed: "bg-[#f59e0b]/15 text-[#f59e0b] border-[#f59e0b]/30",
  "Series A": "bg-[#3b82f6]/15 text-[#3b82f6] border-[#3b82f6]/30",
  "Series B": "bg-[#8b5cf6]/15 text-[#8b5cf6] border-[#8b5cf6]/30",
  "Series C": "bg-[#ec4899]/15 text-[#ec4899] border-[#ec4899]/30",
  "Series D+": "bg-[#ef4444]/15 text-[#ef4444] border-[#ef4444]/30",
  Growth: "bg-[#22c55e]/15 text-[#22c55e] border-[#22c55e]/30",
  Public: "bg-[#06b6d4]/15 text-[#06b6d4] border-[#06b6d4]/30",
};

/* ── Styles ────────────────────────────────────────────── */

const selectTriggerCls =
  "bg-[#020617] border-[#334155] focus:border-[#3b82f6] text-[#f8fafc] h-9 text-sm";
const selectContentCls = "bg-[#0f172a] border-[#1e293b]";

/* ── Types ─────────────────────────────────────────────── */

interface Company {
  id: string;
  name: string;
  industry: string;
  stage: string;
  arr: number;
  arrRange: string;
  growth: number;
  employees: number;
  gtmMotion: string;
}

/* ── Helpers ───────────────────────────────────────────── */

function formatArr(arr: number): string {
  if (arr >= 1_000_000_000) return `$${(arr / 1_000_000_000).toFixed(1)}B`;
  if (arr >= 1_000_000) return `$${(arr / 1_000_000).toFixed(1)}M`;
  if (arr >= 1_000) return `$${(arr / 1_000).toFixed(0)}K`;
  return `$${arr}`;
}

function channelMixBar() {
  // Placeholder bar showing a generic mix
  const segments = [
    { pct: 35, color: "#3b82f6" },
    { pct: 25, color: "#22c55e" },
    { pct: 20, color: "#f59e0b" },
    { pct: 20, color: "#8b5cf6" },
  ];
  return (
    <div className="flex h-1.5 rounded-full overflow-hidden bg-[#1e293b]">
      {segments.map((s, i) => (
        <div
          key={i}
          className="h-full"
          style={{ width: `${s.pct}%`, backgroundColor: s.color }}
        />
      ))}
    </div>
  );
}

/* ── Component ─────────────────────────────────────────── */

export default function CompaniesPage() {
  const router = useRouter();
  const [companies, setCompanies] = useState<Company[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [stage, setStage] = useState("All Stages");
  const [industry, setIndustry] = useState("All Industries");
  const [motion, setMotion] = useState("All Motions");
  const [arrRange, setArrRange] = useState("All ARR");
  const [cmdOpen, setCmdOpen] = useState(false);

  /* ── Fetch companies ─────────────────────────────── */

  const fetchCompanies = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (search) params.set("search", search);
      if (stage !== "All Stages") params.set("stage", stage);
      if (industry !== "All Industries") params.set("industry", industry);
      const res = await fetch(`/api/companies?${params}`);
      const json = await res.json();
      setCompanies(json.companies ?? []);
    } catch {
      setCompanies([]);
    } finally {
      setLoading(false);
    }
  }, [search, stage, industry]);

  useEffect(() => {
    fetchCompanies();
  }, [fetchCompanies]);

  /* ── Keyboard shortcut ───────────────────────────── */

  useEffect(() => {
    function onKeyDown(e: KeyboardEvent) {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        setCmdOpen((prev) => !prev);
      }
    }
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, []);

  /* ── Filter client-side for motion + arrRange ──── */

  const filtered = companies.filter((c) => {
    if (motion !== "All Motions" && c.gtmMotion !== motion) return false;
    if (arrRange !== "All ARR" && c.arrRange !== arrRange) return false;
    return true;
  });

  /* ── CSV export ──────────────────────────────────── */

  function exportCsv() {
    const headers = ["Name", "Industry", "Stage", "ARR", "Growth", "GTM Motion"];
    const rows = filtered.map((c) => [
      c.name,
      c.industry,
      c.stage,
      c.arr,
      c.growth,
      c.gtmMotion,
    ]);
    const csv = [headers.join(","), ...rows.map((r) => r.join(","))].join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "companies.csv";
    a.click();
    URL.revokeObjectURL(url);
  }

  return (
    <div className="space-y-6">
      {/* Command+K search dialog */}
      {cmdOpen && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-start justify-center pt-[20vh]">
          <div className="w-full max-w-lg bg-[#0f172a] border border-[#1e293b] rounded-xl shadow-2xl overflow-hidden">
            <Command className="bg-transparent">
              <CommandInput
                placeholder="Search companies..."
                className="text-[#f8fafc]"
                onValueChange={setSearch}
              />
              <CommandList>
                <CommandEmpty className="text-[#64748b]">
                  No companies found.
                </CommandEmpty>
                <CommandGroup heading="Companies" className="text-[#64748b]">
                  {filtered.slice(0, 8).map((c) => (
                    <CommandItem
                      key={c.id}
                      className="text-[#f8fafc] cursor-pointer"
                      onSelect={() => {
                        setCmdOpen(false);
                        router.push(`/companies/${c.id}`);
                      }}
                    >
                      <Building2 className="w-4 h-4 mr-2 text-[#64748b]" />
                      {c.name}
                      <span className="ml-auto text-xs text-[#64748b]">
                        {c.stage}
                      </span>
                    </CommandItem>
                  ))}
                </CommandGroup>
              </CommandList>
            </Command>
            <div className="px-4 py-2 border-t border-[#1e293b] text-xs text-[#64748b]">
              Press <kbd className="px-1 py-0.5 bg-[#1e293b] rounded text-[#94a3b8]">Esc</kbd> to close
            </div>
          </div>
          <div
            className="absolute inset-0 -z-10"
            onClick={() => setCmdOpen(false)}
          />
        </div>
      )}

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-semibold text-[#f8fafc]">
            Company Profiles
          </h2>
          <p className="text-sm text-[#64748b] mt-1">
            {filtered.length} companies
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={exportCsv}
            className="border-[#334155] text-[#94a3b8] hover:text-[#f8fafc]"
          >
            <Download className="w-4 h-4 mr-1" />
            Export CSV
          </Button>
          <Button
            size="sm"
            onClick={() => router.push("/curation")}
          >
            <Plus className="w-4 h-4 mr-1" />
            Add Company
          </Button>
        </div>
      </div>

      {/* Search bar */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#64748b]" />
        <Input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search companies... (⌘K)"
          onClick={() => setCmdOpen(true)}
          className="bg-[#020617] border-[#334155] text-[#f8fafc] pl-9 h-10"
          readOnly
        />
      </div>

      {/* Filter bar */}
      <div className="flex flex-wrap gap-2">
        <Select value={stage} onValueChange={setStage}>
          <SelectTrigger className={cn(selectTriggerCls, "w-[140px]")}>
            <SelectValue />
          </SelectTrigger>
          <SelectContent className={selectContentCls}>
            {STAGES.map((s) => (
              <SelectItem key={s} value={s}>
                {s}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select value={industry} onValueChange={setIndustry}>
          <SelectTrigger className={cn(selectTriggerCls, "w-[160px]")}>
            <SelectValue />
          </SelectTrigger>
          <SelectContent className={selectContentCls}>
            {INDUSTRIES.map((i) => (
              <SelectItem key={i} value={i}>
                {i}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select value={motion} onValueChange={setMotion}>
          <SelectTrigger className={cn(selectTriggerCls, "w-[150px]")}>
            <SelectValue />
          </SelectTrigger>
          <SelectContent className={selectContentCls}>
            {MOTIONS.map((m) => (
              <SelectItem key={m} value={m}>
                {m}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select value={arrRange} onValueChange={setArrRange}>
          <SelectTrigger className={cn(selectTriggerCls, "w-[140px]")}>
            <SelectValue />
          </SelectTrigger>
          <SelectContent className={selectContentCls}>
            {ARR_RANGES.map((r) => (
              <SelectItem key={r} value={r}>
                {r}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Results grid */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {Array.from({ length: 6 }).map((_, i) => (
            <CompanyCardSkeleton key={i} />
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <div className="bg-[#0f172a] border border-[#1e293b] rounded-lg p-12 text-center">
          <Building2 className="w-10 h-10 text-[#64748b] mx-auto mb-4" />
          <h3 className="text-lg font-medium text-[#94a3b8] mb-2">
            {companies.length === 0 ? "Add your first company" : "No companies found"}
          </h3>
          <p className="text-sm text-[#64748b] max-w-md mx-auto mb-4">
            {companies.length === 0
              ? "Get started by adding company data through the Data Curation page or AI Report Parser."
              : "Try adjusting your filters or search query."}
          </p>
          {companies.length === 0 && (
            <button
              onClick={() => router.push("/curation")}
              className="inline-flex items-center gap-1.5 px-4 py-2 bg-[#3b82f6] text-white text-sm font-medium rounded-lg hover:bg-[#2563eb] transition-colors"
            >
              <Plus className="w-4 h-4" />
              Add Company
            </button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map((company, idx) => (
            <button
              key={company.id}
              onClick={() => router.push(`/companies/${company.id}`)}
              className="bg-[#0f172a] border border-[#1e293b] rounded-lg p-5 text-left hover:border-[#334155] transition-all group"
            >
              {/* Name */}
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-[#f8fafc] font-semibold truncate group-hover:text-[#3b82f6] transition-colors">
                  {company.name || `Anonymous #${idx + 1}`}
                </h3>
              </div>

              {/* Badges */}
              <div className="flex flex-wrap gap-1.5 mb-3">
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-[#1e293b] text-[#94a3b8] border border-[#334155]">
                  {company.industry}
                </span>
                <span
                  className={cn(
                    "text-[10px] px-2 py-0.5 rounded-full border",
                    STAGE_COLORS[company.stage] ||
                      "bg-[#1e293b] text-[#94a3b8] border-[#334155]"
                  )}
                >
                  {company.stage}
                </span>
              </div>

              {/* Metrics row */}
              <div className="flex items-center gap-4 mb-3">
                <div>
                  <div className="text-xs text-[#64748b]">ARR</div>
                  <div className="text-sm font-mono font-semibold text-[#f8fafc]">
                    {formatArr(company.arr)}
                  </div>
                </div>
                <div>
                  <div className="text-xs text-[#64748b]">Growth</div>
                  <div className="flex items-center gap-1">
                    {company.growth > 0 ? (
                      <TrendingUp className="w-3 h-3 text-[#22c55e]" />
                    ) : company.growth < 0 ? (
                      <TrendingDown className="w-3 h-3 text-[#ef4444]" />
                    ) : null}
                    <span
                      className={cn(
                        "text-sm font-mono font-semibold",
                        company.growth > 0
                          ? "text-[#22c55e]"
                          : company.growth < 0
                            ? "text-[#ef4444]"
                            : "text-[#94a3b8]"
                      )}
                    >
                      {company.growth}%
                    </span>
                  </div>
                </div>
              </div>

              {/* Channel mix bar */}
              {channelMixBar()}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
