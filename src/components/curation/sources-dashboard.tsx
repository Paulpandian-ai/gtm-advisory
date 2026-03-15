"use client";

import { useState } from "react";
import { cn } from "@/lib/utils";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogDescription,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Plus,
  Pencil,
  Play,
  ExternalLink,
  Database,
  RefreshCw,
} from "lucide-react";

/* ── Types ─────────────────────────────────────────────── */

interface DataSource {
  id: string;
  name: string;
  type: SourceType;
  url: string;
  description: string;
  lastUpdated: string;
  records: number;
  reliability: number;
}

type SourceType = "Report" | "API" | "Scrape" | "Manual" | "Advisory";

const TYPE_COLORS: Record<SourceType, string> = {
  Report: "bg-[#3b82f6]/20 text-[#3b82f6]",
  API: "bg-[#22d3ee]/20 text-[#22d3ee]",
  Scrape: "bg-[#f59e0b]/20 text-[#f59e0b]",
  Manual: "bg-[#8b5cf6]/20 text-[#8b5cf6]",
  Advisory: "bg-[#22c55e]/20 text-[#22c55e]",
};

const SOURCE_TYPES: SourceType[] = [
  "Report",
  "API",
  "Scrape",
  "Manual",
  "Advisory",
];

/* ── Demo data ─────────────────────────────────────────── */

const DEMO_SOURCES: DataSource[] = [
  {
    id: "1",
    name: "OpenView SaaS Benchmarks 2025",
    type: "Report",
    url: "https://openviewpartners.com/benchmarks",
    description: "Annual SaaS benchmarks report",
    lastUpdated: "2025-03-01",
    records: 450,
    reliability: 9,
  },
  {
    id: "2",
    name: "ProfitWell Metrics API",
    type: "API",
    url: "https://api.profitwell.com/v2",
    description: "Real-time subscription metrics",
    lastUpdated: "2025-04-15",
    records: 1200,
    reliability: 8,
  },
  {
    id: "3",
    name: "G2 Pricing Pages",
    type: "Scrape",
    url: "https://g2.com/categories",
    description: "Scraped pricing tiers from G2 listings",
    lastUpdated: "2025-02-20",
    records: 680,
    reliability: 6,
  },
  {
    id: "4",
    name: "Advisory Engagement Data",
    type: "Advisory",
    url: "",
    description: "Direct advisory client data",
    lastUpdated: "2025-04-01",
    records: 85,
    reliability: 10,
  },
  {
    id: "5",
    name: "Manual Analyst Research",
    type: "Manual",
    url: "",
    description: "Manually curated from analyst reports",
    lastUpdated: "2025-01-15",
    records: 320,
    reliability: 7,
  },
];

/* ── Reliability dots ──────────────────────────────────── */

function ReliabilityDots({ value }: { value: number }) {
  return (
    <div className="flex items-center gap-0.5">
      {Array.from({ length: 10 }, (_, i) => (
        <span
          key={i}
          className={cn(
            "w-1.5 h-1.5 rounded-full",
            i < value ? "bg-[#3b82f6]" : "bg-[#1e293b]"
          )}
        />
      ))}
      <span className="text-[10px] text-[#64748b] ml-1.5 font-mono">
        {value}/10
      </span>
    </div>
  );
}

/* ── Add Source Dialog ──────────────────────────────────── */

function AddSourceDialog({
  open,
  onOpenChange,
  onAdd,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onAdd: (source: DataSource) => void;
}) {
  const [name, setName] = useState("");
  const [type, setType] = useState<SourceType>("Report");
  const [url, setUrl] = useState("");
  const [description, setDescription] = useState("");
  const [reliability, setReliability] = useState("7");

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    onAdd({
      id: crypto.randomUUID(),
      name,
      type,
      url,
      description,
      lastUpdated: new Date().toISOString().split("T")[0],
      records: 0,
      reliability: parseInt(reliability) || 7,
    });
    setName("");
    setUrl("");
    setDescription("");
    setReliability("7");
    onOpenChange(false);
  }

  const inputCls =
    "bg-[#020617] border-[#334155] focus:border-[#3b82f6] text-[#f8fafc]";

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="bg-[#0f172a] border-[#1e293b] text-[#f8fafc] max-w-md">
        <DialogHeader>
          <DialogTitle>Add Data Source</DialogTitle>
          <DialogDescription className="text-[#64748b]">
            Register a new data source for the curation pipeline.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label className="text-[#94a3b8]">Name</Label>
            <Input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Source name"
              required
              className={inputCls}
            />
          </div>
          <div className="space-y-2">
            <Label className="text-[#94a3b8]">Type</Label>
            <Select
              value={type}
              onValueChange={(v) => setType(v as SourceType)}
            >
              <SelectTrigger className={inputCls}>
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="bg-[#0f172a] border-[#1e293b]">
                {SOURCE_TYPES.map((t) => (
                  <SelectItem key={t} value={t}>
                    {t}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label className="text-[#94a3b8]">URL</Label>
            <Input
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              placeholder="https://..."
              className={inputCls}
            />
          </div>
          <div className="space-y-2">
            <Label className="text-[#94a3b8]">Description</Label>
            <Input
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Brief description"
              className={inputCls}
            />
          </div>
          <div className="space-y-2">
            <Label className="text-[#94a3b8]">Reliability (1-10)</Label>
            <Input
              type="number"
              min={1}
              max={10}
              value={reliability}
              onChange={(e) => setReliability(e.target.value)}
              className={cn(inputCls, "w-24 font-mono")}
            />
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <Button
              type="button"
              variant="ghost"
              onClick={() => onOpenChange(false)}
              className="text-[#94a3b8]"
            >
              Cancel
            </Button>
            <Button type="submit">Add Source</Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}

/* ── Main component ────────────────────────────────────── */

export function SourcesDashboard() {
  const [sources, setSources] = useState<DataSource[]>(DEMO_SOURCES);
  const [dialogOpen, setDialogOpen] = useState(false);

  const totalRecords = sources.reduce((sum, s) => sum + s.records, 0);
  const lastUpdated = sources.reduce(
    (latest, s) => (s.lastUpdated > latest ? s.lastUpdated : latest),
    ""
  );
  const avgReliability = sources.length
    ? (sources.reduce((sum, s) => sum + s.reliability, 0) / sources.length).toFixed(1)
    : "0";

  function handleAdd(source: DataSource) {
    setSources((prev) => [...prev, source]);
  }

  return (
    <div className="space-y-6">
      {/* Stats bar */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: "Total Sources", value: sources.length },
          {
            label: "Total Records",
            value: totalRecords.toLocaleString(),
          },
          { label: "Last Updated", value: lastUpdated },
          { label: "Data Freshness Score", value: `${avgReliability}/10` },
        ].map((stat) => (
          <div
            key={stat.label}
            className="bg-[#0f172a] border border-[#1e293b] rounded-lg p-4"
          >
            <p className="text-[11px] uppercase tracking-[1.2px] text-[#64748b] mb-1">
              {stat.label}
            </p>
            <p className="text-lg font-semibold text-[#f8fafc] font-mono">
              {stat.value}
            </p>
          </div>
        ))}
      </div>

      {/* Action bar */}
      <div className="flex items-center justify-between">
        <p className="text-sm text-[#94a3b8]">
          {sources.length} sources registered
        </p>
        <Button onClick={() => setDialogOpen(true)} size="sm">
          <Plus className="w-4 h-4 mr-1" />
          Add Source
        </Button>
      </div>

      <AddSourceDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        onAdd={handleAdd}
      />

      {/* Sources table */}
      <div className="bg-[#0f172a] border border-[#1e293b] rounded-lg overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-[#1e293b] text-[#64748b] text-[11px] uppercase tracking-wider">
                <th className="text-left px-4 py-3 font-medium">Name</th>
                <th className="text-left px-4 py-3 font-medium">Type</th>
                <th className="text-left px-4 py-3 font-medium">URL</th>
                <th className="text-left px-4 py-3 font-medium">
                  Last Updated
                </th>
                <th className="text-right px-4 py-3 font-medium">Records</th>
                <th className="text-left px-4 py-3 font-medium">
                  Reliability
                </th>
                <th className="text-right px-4 py-3 font-medium">Actions</th>
              </tr>
            </thead>
            <tbody>
              {sources.map((source) => (
                <tr
                  key={source.id}
                  className="border-b border-[#1e293b]/50 hover:bg-[#1e293b]/30 transition-colors"
                >
                  <td className="px-4 py-3 text-[#f8fafc] font-medium">
                    {source.name}
                  </td>
                  <td className="px-4 py-3">
                    <span
                      className={cn(
                        "px-2 py-0.5 rounded text-xs font-medium",
                        TYPE_COLORS[source.type]
                      )}
                    >
                      {source.type}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    {source.url ? (
                      <a
                        href={source.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-[#3b82f6] hover:underline inline-flex items-center gap-1 text-xs"
                      >
                        {new URL(source.url).hostname}
                        <ExternalLink className="w-3 h-3" />
                      </a>
                    ) : (
                      <span className="text-[#64748b] text-xs">—</span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-[#94a3b8] font-mono text-xs">
                    {source.lastUpdated}
                  </td>
                  <td className="px-4 py-3 text-right text-[#f8fafc] font-mono text-xs">
                    {source.records.toLocaleString()}
                  </td>
                  <td className="px-4 py-3">
                    <ReliabilityDots value={source.reliability} />
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center justify-end gap-1">
                      <button
                        className="p-1.5 rounded hover:bg-[#1e293b] text-[#64748b] hover:text-[#f8fafc] transition-colors"
                        title="Edit source"
                      >
                        <Pencil className="w-3.5 h-3.5" />
                      </button>
                      <button
                        className="p-1.5 rounded hover:bg-[#1e293b] text-[#64748b] hover:text-[#22c55e] transition-colors"
                        title="Run pipeline"
                      >
                        <Play className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
