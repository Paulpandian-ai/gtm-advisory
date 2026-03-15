"use client";

import { useState } from "react";
import { cn } from "@/lib/utils";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import {
  AlertTriangle,
  CheckCircle2,
  Clock,
  Copy,
  Search,
  Filter,
  XCircle,
  Sparkles,
  Ban,
  RefreshCw,
} from "lucide-react";

/* ── Types ─────────────────────────────────────────────── */

type IssueType = "Missing" | "Outlier" | "Stale" | "Duplicate";

interface QualityIssue {
  id: string;
  companyName: string;
  field: string;
  issueType: IssueType;
  description: string;
}

/* ── Styling ───────────────────────────────────────────── */

const ISSUE_BADGE: Record<IssueType, string> = {
  Missing: "bg-[#ef4444]/20 text-[#ef4444]",
  Outlier: "bg-[#f59e0b]/20 text-[#f59e0b]",
  Stale: "bg-[#64748b]/20 text-[#94a3b8]",
  Duplicate: "bg-[#8b5cf6]/20 text-[#8b5cf6]",
};

const ISSUE_ICONS: Record<IssueType, React.ElementType> = {
  Missing: XCircle,
  Outlier: AlertTriangle,
  Stale: Clock,
  Duplicate: Copy,
};

/* ── Demo data ─────────────────────────────────────────── */

const DEMO_ISSUES: QualityIssue[] = [
  {
    id: "1",
    companyName: "Acme Corp",
    field: "nrr",
    issueType: "Missing",
    description: "Net Revenue Retention is null",
  },
  {
    id: "2",
    companyName: "Widget Labs",
    field: "cac",
    issueType: "Outlier",
    description: "CAC of $340K is >3 std dev from Series A mean ($22K)",
  },
  {
    id: "3",
    companyName: "DataStream Inc",
    field: "updatedAt",
    issueType: "Stale",
    description: "Data last updated 18 months ago (2024-09-15)",
  },
  {
    id: "4",
    companyName: "CloudSync",
    field: "companyName",
    issueType: "Duplicate",
    description:
      'Possible duplicate of "CloudSynk" (Levenshtein distance: 1)',
  },
  {
    id: "5",
    companyName: "PayFlow",
    field: "churnRate",
    issueType: "Missing",
    description: "Monthly churn rate is null",
  },
  {
    id: "6",
    companyName: "MetricAI",
    field: "arr",
    issueType: "Outlier",
    description: "ARR of $890M is >3 std dev from Seed mean ($2.1M)",
  },
  {
    id: "7",
    companyName: "GrowthBot",
    field: "winRate",
    issueType: "Missing",
    description: "Win rate is null",
  },
  {
    id: "8",
    companyName: "SalesForge",
    field: "updatedAt",
    issueType: "Stale",
    description: "Data last updated 14 months ago (2024-12-01)",
  },
  {
    id: "9",
    companyName: "Nexus AI",
    field: "companyName",
    issueType: "Duplicate",
    description:
      'Possible duplicate of "NexusAI" (Levenshtein distance: 1)',
  },
  {
    id: "10",
    companyName: "PipelinePro",
    field: "salesCycleLength",
    issueType: "Outlier",
    description:
      "Sales cycle of 380 days is >3 std dev from Series B mean (52 days)",
  },
];

/* ── Main Component ────────────────────────────────────── */

export function DataQuality() {
  const [issues, setIssues] = useState<QualityIssue[]>(DEMO_ISSUES);
  const [typeFilter, setTypeFilter] = useState<string>("all");
  const [fieldFilter, setFieldFilter] = useState<string>("all");
  const [selected, setSelected] = useState<Set<string>>(new Set());

  const totalRecords = 2735;
  const completePercent = 87;
  const issueCount = issues.length;
  const freshnessDays = 12;

  const filteredIssues = issues.filter((issue) => {
    if (typeFilter !== "all" && issue.issueType !== typeFilter) return false;
    if (fieldFilter !== "all" && issue.field !== fieldFilter) return false;
    return true;
  });

  const uniqueFields = [...new Set(issues.map((i) => i.field))].sort();

  function toggleSelect(id: string) {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  function toggleAll() {
    if (selected.size === filteredIssues.length) {
      setSelected(new Set());
    } else {
      setSelected(new Set(filteredIssues.map((i) => i.id)));
    }
  }

  function dismissSelected() {
    setIssues((prev) => prev.filter((i) => !selected.has(i.id)));
    setSelected(new Set());
  }

  const selectContentCls = "bg-[#0f172a] border-[#1e293b]";
  const selectTriggerCls =
    "bg-[#020617] border-[#334155] focus:border-[#3b82f6] text-[#f8fafc] text-xs h-8";

  return (
    <div className="space-y-6">
      {/* Summary cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          {
            label: "Total Records",
            value: totalRecords.toLocaleString(),
            icon: Search,
          },
          {
            label: "Complete",
            value: `${completePercent}%`,
            icon: CheckCircle2,
            color: "text-[#22c55e]",
          },
          {
            label: "With Issues",
            value: issueCount.toString(),
            icon: AlertTriangle,
            color: "text-[#f59e0b]",
          },
          {
            label: "Freshness",
            value: `${freshnessDays}d`,
            icon: Clock,
          },
        ].map((card) => {
          const Icon = card.icon;
          return (
            <div
              key={card.label}
              className="bg-[#0f172a] border border-[#1e293b] rounded-lg p-4"
            >
              <div className="flex items-center justify-between mb-2">
                <p className="text-[11px] uppercase tracking-[1.2px] text-[#64748b]">
                  {card.label}
                </p>
                <Icon
                  className={cn("w-4 h-4", card.color || "text-[#64748b]")}
                />
              </div>
              <p
                className={cn(
                  "text-xl font-semibold font-mono",
                  card.color || "text-[#f8fafc]"
                )}
              >
                {card.value}
              </p>
            </div>
          );
        })}
      </div>

      {/* Filters & bulk actions */}
      <div className="flex flex-wrap items-center gap-3">
        <div className="flex items-center gap-2">
          <Filter className="w-4 h-4 text-[#64748b]" />
          <Select value={typeFilter} onValueChange={setTypeFilter}>
            <SelectTrigger className={cn(selectTriggerCls, "w-36")}>
              <SelectValue placeholder="Issue type" />
            </SelectTrigger>
            <SelectContent className={selectContentCls}>
              <SelectItem value="all">All Types</SelectItem>
              <SelectItem value="Missing">Missing</SelectItem>
              <SelectItem value="Outlier">Outlier</SelectItem>
              <SelectItem value="Stale">Stale</SelectItem>
              <SelectItem value="Duplicate">Duplicate</SelectItem>
            </SelectContent>
          </Select>
          <Select value={fieldFilter} onValueChange={setFieldFilter}>
            <SelectTrigger className={cn(selectTriggerCls, "w-40")}>
              <SelectValue placeholder="Field" />
            </SelectTrigger>
            <SelectContent className={selectContentCls}>
              <SelectItem value="all">All Fields</SelectItem>
              {uniqueFields.map((f) => (
                <SelectItem key={f} value={f}>
                  {f}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {selected.size > 0 && (
          <div className="flex items-center gap-2 ml-auto">
            <span className="text-xs text-[#94a3b8]">
              {selected.size} selected
            </span>
            <Button
              variant="ghost"
              size="sm"
              onClick={dismissSelected}
              className="text-[#94a3b8] hover:text-[#f8fafc] text-xs h-7"
            >
              <Ban className="w-3 h-3 mr-1" />
              Dismiss
            </Button>
            <Button
              variant="ghost"
              size="sm"
              className="text-[#3b82f6] hover:text-[#60a5fa] text-xs h-7"
            >
              <Sparkles className="w-3 h-3 mr-1" />
              Auto-fix
            </Button>
            <Button
              variant="ghost"
              size="sm"
              className="text-[#f59e0b] hover:text-[#fbbf24] text-xs h-7"
            >
              <XCircle className="w-3 h-3 mr-1" />
              Exclude
            </Button>
          </div>
        )}
      </div>

      {/* Issues table */}
      <div className="bg-[#0f172a] border border-[#1e293b] rounded-lg overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-[#1e293b] text-[#64748b] text-[11px] uppercase tracking-wider">
                <th className="text-left px-4 py-3 font-medium w-10">
                  <input
                    type="checkbox"
                    checked={
                      selected.size === filteredIssues.length &&
                      filteredIssues.length > 0
                    }
                    onChange={toggleAll}
                    className="rounded border-[#334155] bg-[#020617] text-[#3b82f6] w-3.5 h-3.5"
                  />
                </th>
                <th className="text-left px-4 py-3 font-medium">Company</th>
                <th className="text-left px-4 py-3 font-medium">Field</th>
                <th className="text-left px-4 py-3 font-medium">
                  Issue Type
                </th>
                <th className="text-left px-4 py-3 font-medium">
                  Description
                </th>
                <th className="text-right px-4 py-3 font-medium">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredIssues.map((issue) => {
                const Icon = ISSUE_ICONS[issue.issueType];
                return (
                  <tr
                    key={issue.id}
                    className={cn(
                      "border-b border-[#1e293b]/50 hover:bg-[#1e293b]/30 transition-colors",
                      selected.has(issue.id) && "bg-[#3b82f6]/5"
                    )}
                  >
                    <td className="px-4 py-3">
                      <input
                        type="checkbox"
                        checked={selected.has(issue.id)}
                        onChange={() => toggleSelect(issue.id)}
                        className="rounded border-[#334155] bg-[#020617] text-[#3b82f6] w-3.5 h-3.5"
                      />
                    </td>
                    <td className="px-4 py-3 text-[#f8fafc] font-medium">
                      {issue.companyName}
                    </td>
                    <td className="px-4 py-3 text-[#94a3b8] font-mono text-xs">
                      {issue.field}
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className={cn(
                          "inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-medium",
                          ISSUE_BADGE[issue.issueType]
                        )}
                      >
                        <Icon className="w-3 h-3" />
                        {issue.issueType}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-[#94a3b8] text-xs max-w-[300px] truncate">
                      {issue.description}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center justify-end gap-1">
                        <button
                          className="p-1.5 rounded hover:bg-[#1e293b] text-[#64748b] hover:text-[#3b82f6] transition-colors"
                          title="Auto-fix"
                        >
                          <Sparkles className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() =>
                            setIssues((prev) =>
                              prev.filter((i) => i.id !== issue.id)
                            )
                          }
                          className="p-1.5 rounded hover:bg-[#1e293b] text-[#64748b] hover:text-[#94a3b8] transition-colors"
                          title="Dismiss"
                        >
                          <Ban className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
              {filteredIssues.length === 0 && (
                <tr>
                  <td
                    colSpan={6}
                    className="px-4 py-12 text-center text-[#64748b]"
                  >
                    <CheckCircle2 className="w-8 h-8 mx-auto mb-2 text-[#22c55e]" />
                    No issues found
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
