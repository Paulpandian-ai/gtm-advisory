"use client";

import { useState, useCallback } from "react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Loader2,
  Sparkles,
  Globe,
  Save,
  Trash2,
  CheckCircle,
  Clock,
  X,
} from "lucide-react";

/* ── Types ─────────────────────────────────────────────── */

type Confidence = "high" | "medium" | "low" | "not_found";

interface FieldConfidence {
  field: string;
  confidence: Confidence;
}

interface ExtractedData {
  companyName: string | null;
  industry: string | null;
  stage: string | null;
  arr: number | null;
  arrGrowth: number | null;
  employees: number | null;
  gtmMotion: string | null;
  primaryChannel: string | null;
  channelMix: {
    outbound: number | null;
    inbound: number | null;
    plg: number | null;
    partner: number | null;
    marketplace: number | null;
    events: number | null;
  };
  winRate: number | null;
  salesCycleDays: number | null;
  cac: number | null;
  ltv: number | null;
  ltvCacRatio: number | null;
  nrr: number | null;
  grossRetention: number | null;
  monthlyChurn: number | null;
  acv: number | null;
  pricingModel: string | null;
  tierCount: number | null;
  hasFreeTier: boolean | null;
  hasPartnerProgram: boolean | null;
  partnerCount: number | null;
  partnerRevenuePct: number | null;
  marketplacePresence: string[];
  cosellWinRate: number | null;
  techStack: {
    crm: string | null;
    salesEngagement: string | null;
    conversationIntel: string | null;
    dataEnrichment: string | null;
  };
}

interface ParseResult {
  data: ExtractedData;
  confidences: FieldConfidence[];
  usage: { inputTokens: number; outputTokens: number; model: string };
  sourceText: string;
}

interface HistoryEntry {
  id: string;
  companyName: string;
  timestamp: string;
  status: "Saved" | "Draft" | "Discarded";
}

/* ── Shared styles ─────────────────────────────────────── */

const inputCls =
  "bg-[#020617] border-[#334155] focus:border-[#3b82f6] text-[#f8fafc]";

const CONFIDENCE_STYLES: Record<
  Confidence,
  { dot: string; label: string }
> = {
  high: { dot: "bg-[#22c55e]", label: "High" },
  medium: { dot: "bg-[#f59e0b]", label: "Medium" },
  low: { dot: "bg-[#ef4444]", label: "Low" },
  not_found: { dot: "bg-[#64748b]", label: "Not Found" },
};

/* ── Field display config ──────────────────────────────── */

interface FieldDef {
  key: string;
  label: string;
  type: "text" | "number" | "boolean";
  suffix?: string;
}

const DISPLAY_FIELDS: FieldDef[] = [
  { key: "companyName", label: "Company Name", type: "text" },
  { key: "industry", label: "Industry", type: "text" },
  { key: "stage", label: "Stage", type: "text" },
  { key: "arr", label: "ARR", type: "number", suffix: "$" },
  { key: "arrGrowth", label: "Growth", type: "number", suffix: "%" },
  { key: "winRate", label: "Win Rate", type: "number", suffix: "%" },
  { key: "salesCycleDays", label: "Sales Cycle", type: "number", suffix: " days" },
  { key: "cac", label: "CAC", type: "number", suffix: "$" },
  { key: "ltv", label: "LTV", type: "number", suffix: "$" },
  { key: "nrr", label: "NRR", type: "number", suffix: "%" },
  { key: "gtmMotion", label: "GTM Motion", type: "text" },
  { key: "pricingModel", label: "Pricing Model", type: "text" },
  { key: "hasPartnerProgram", label: "Partner Program", type: "boolean" },
  { key: "marketplacePresence", label: "Marketplace Presence", type: "text" },
];

/* ── Helper to get a deeply-nested value ───────────────── */

function getFieldValue(data: ExtractedData, key: string): string {
  if (key === "marketplacePresence") {
    return data.marketplacePresence.length > 0
      ? data.marketplacePresence.join(", ")
      : "";
  }
  if (key === "hasPartnerProgram") {
    return data.hasPartnerProgram === null
      ? ""
      : data.hasPartnerProgram
        ? "Yes"
        : "No";
  }
  const val = (data as unknown as Record<string, unknown>)[key];
  if (val === null || val === undefined) return "";
  return String(val);
}

/* ── Component ─────────────────────────────────────────── */

export function ReportParser() {
  // Input state
  const [text, setText] = useState("");
  const [url, setUrl] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  // Result state
  const [result, setResult] = useState<ParseResult | null>(null);
  const [editedData, setEditedData] = useState<Record<string, string>>({});

  // Save state
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState("");

  // History
  const [history, setHistory] = useState<HistoryEntry[]>([]);

  /* ── Extract ───────────────────────────────────────── */

  const handleExtract = useCallback(async () => {
    setLoading(true);
    setError("");
    setResult(null);
    setEditedData({});

    try {
      const payload: { text?: string; url?: string } = {};
      if (url.trim()) {
        payload.url = url.trim();
      } else if (text.trim()) {
        payload.text = text.trim();
      } else {
        setError("Paste article text or provide a URL");
        setLoading(false);
        return;
      }

      const res = await fetch("/api/parse-report", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const json = await res.json();

      if (!res.ok) {
        setError(json.error || "Extraction failed");
        return;
      }

      setResult(json as ParseResult);

      // Pre-fill editable fields
      const edits: Record<string, string> = {};
      for (const f of DISPLAY_FIELDS) {
        edits[f.key] = getFieldValue(json.data, f.key);
      }
      setEditedData(edits);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Network error"
      );
    } finally {
      setLoading(false);
    }
  }, [text, url]);

  /* ── Save to database ──────────────────────────────── */

  const handleSave = useCallback(async () => {
    if (!result) return;
    setSaving(true);

    try {
      // Build company payload from edited data
      const profile = {
        name: editedData.companyName || result.data.companyName,
        industry: editedData.industry || result.data.industry,
        stage: editedData.stage || result.data.stage,
        arr: Number(editedData.arr) || result.data.arr || 0,
        growth: Number(editedData.arrGrowth) || result.data.arrGrowth || 0,
        employees: result.data.employees || 0,
        gtmMotion: editedData.gtmMotion || result.data.gtmMotion || "Hybrid",
        description: `Auto-extracted from report parser`,
      };

      const sales = {
        winRate: Number(editedData.winRate) || result.data.winRate || 0,
        salesCycleLength:
          Number(editedData.salesCycleDays) || result.data.salesCycleDays || 0,
        cac: Number(editedData.cac) || result.data.cac || 0,
        ltv: Number(editedData.ltv) || result.data.ltv || 0,
        ltvCacRatio: result.data.ltvCacRatio || 0,
      };

      const revenue = {
        nrr: Number(editedData.nrr) || result.data.nrr || 0,
        churnRate: result.data.monthlyChurn || 0,
        arr: Number(editedData.arr) || result.data.arr || 0,
      };

      // Create company
      const companyRes = await fetch("/api/companies", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ profile, sales, revenue }),
      });

      if (!companyRes.ok) {
        throw new Error("Failed to save company");
      }

      // Create data source record
      const sourceId = `report-${Date.now()}`;
      await fetch("/api/sources", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: sourceId,
          name: `Parsed: ${profile.name || "Unknown"}`,
          type: "Scraped",
          description: `AI-extracted from ${url.trim() ? url.trim() : "pasted text"}`,
          url: url.trim() || undefined,
          recordCount: 1,
          reliability: 0.75,
        }),
      });

      // Update history
      setHistory((prev) => [
        {
          id: sourceId,
          companyName: profile.name || "Unknown Company",
          timestamp: new Date().toISOString(),
          status: "Saved" as const,
        },
        ...prev,
      ]);

      showToast("Company data extracted and saved");
      setResult(null);
      setText("");
      setUrl("");
    } catch (err) {
      showToast(
        err instanceof Error ? err.message : "Save failed"
      );
    } finally {
      setSaving(false);
    }
  }, [result, editedData, url]);

  /* ── Discard ───────────────────────────────────────── */

  const handleDiscard = useCallback(() => {
    if (!result) return;
    setHistory((prev) => [
      {
        id: `discarded-${Date.now()}`,
        companyName:
          editedData.companyName ||
          result.data.companyName ||
          "Unknown",
        timestamp: new Date().toISOString(),
        status: "Discarded" as const,
      },
      ...prev,
    ]);
    setResult(null);
    setEditedData({});
  }, [result, editedData]);

  /* ── Toast helper ──────────────────────────────────── */

  function showToast(msg: string) {
    setToast(msg);
    setTimeout(() => setToast(""), 3000);
  }

  /* ── Confidence for a field ────────────────────────── */

  function getConfidence(field: string): Confidence {
    if (!result) return "not_found";
    const entry = result.confidences.find((c) => c.field === field);
    return entry?.confidence ?? "not_found";
  }

  /* ── Render ────────────────────────────────────────── */

  return (
    <div className="space-y-6">
      {/* Toast */}
      {toast && (
        <div className="fixed top-4 right-4 z-50 bg-[#22c55e]/10 border border-[#22c55e]/30 text-[#22c55e] px-4 py-2.5 rounded-lg text-sm font-medium animate-in fade-in slide-in-from-top-2">
          {toast}
        </div>
      )}

      {/* ── Input area ────────────────────────────────── */}
      <div className="bg-[#0f172a] border border-[#1e293b] rounded-lg p-6 space-y-4">
        <div className="flex items-center gap-2 mb-1">
          <Sparkles className="w-5 h-5 text-[#3b82f6]" />
          <h3 className="text-[#f8fafc] font-semibold">
            AI Report Parser
          </h3>
        </div>
        <p className="text-sm text-[#64748b]">
          Paste article text or provide a URL to auto-extract GTM data using
          Claude
        </p>

        {/* Textarea */}
        <div>
          <Label className="text-[#94a3b8] text-xs mb-1.5 block">
            Article Text
          </Label>
          <textarea
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder="Paste article text, press release, or report content here..."
            rows={6}
            disabled={loading}
            className={cn(
              inputCls,
              "w-full rounded-md px-3 py-2 text-sm resize-y min-h-[140px]"
            )}
          />
        </div>

        {/* OR divider */}
        <div className="flex items-center gap-3">
          <div className="flex-1 h-px bg-[#1e293b]" />
          <span className="text-xs text-[#64748b] font-medium">OR</span>
          <div className="flex-1 h-px bg-[#1e293b]" />
        </div>

        {/* URL input */}
        <div className="flex gap-2">
          <div className="flex-1">
            <Label className="text-[#94a3b8] text-xs mb-1.5 block">
              Article URL
            </Label>
            <div className="relative">
              <Globe className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#64748b]" />
              <Input
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                placeholder="https://techcrunch.com/2024/..."
                disabled={loading}
                className={cn(inputCls, "pl-9")}
              />
            </div>
          </div>
        </div>

        {/* Error message */}
        {error && (
          <div className="bg-[#ef4444]/10 border border-[#ef4444]/30 text-[#ef4444] px-4 py-2.5 rounded-lg text-sm">
            {error}
          </div>
        )}

        {/* Extract button */}
        <Button
          onClick={handleExtract}
          disabled={loading || (!text.trim() && !url.trim())}
          className="w-full"
        >
          {loading ? (
            <>
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              Analyzing with Claude...
            </>
          ) : (
            <>
              <Sparkles className="w-4 h-4 mr-2" />
              Extract GTM Data
            </>
          )}
        </Button>
      </div>

      {/* ── Results ───────────────────────────────────── */}
      {result && (
        <div className="bg-[#0f172a] border border-[#1e293b] rounded-lg overflow-hidden">
          {/* Header */}
          <div className="flex items-center justify-between px-6 py-4 border-b border-[#1e293b]">
            <div>
              <h3 className="text-[#f8fafc] font-semibold">
                Extracted Data
              </h3>
              <p className="text-xs text-[#64748b] mt-0.5">
                {result.usage.inputTokens + result.usage.outputTokens} tokens
                used
              </p>
            </div>
            <div className="flex items-center gap-3">
              {/* Confidence legend */}
              <div className="flex items-center gap-3 text-xs text-[#94a3b8]">
                {(Object.entries(CONFIDENCE_STYLES) as [Confidence, { dot: string; label: string }][]).map(
                  ([key, { dot, label }]) => (
                    <span key={key} className="flex items-center gap-1">
                      <span
                        className={cn("w-2 h-2 rounded-full", dot)}
                      />
                      {label}
                    </span>
                  )
                )}
              </div>
            </div>
          </div>

          {/* Two-column layout */}
          <div className="grid grid-cols-1 lg:grid-cols-2 divide-y lg:divide-y-0 lg:divide-x divide-[#1e293b]">
            {/* Left: Editable fields */}
            <div className="p-6">
              <h4 className="text-sm font-medium text-[#94a3b8] mb-4">
                Extracted Fields
              </h4>
              <div className="space-y-3">
                {DISPLAY_FIELDS.map((field) => {
                  const conf = getConfidence(field.label);
                  const { dot } = CONFIDENCE_STYLES[conf];

                  return (
                    <div
                      key={field.key}
                      className="flex items-center gap-3"
                    >
                      <span
                        className={cn(
                          "w-2 h-2 rounded-full shrink-0",
                          dot
                        )}
                        title={CONFIDENCE_STYLES[conf].label}
                      />
                      <Label className="text-[#94a3b8] text-xs w-32 shrink-0">
                        {field.label}
                      </Label>
                      <Input
                        value={editedData[field.key] ?? ""}
                        onChange={(e) =>
                          setEditedData((prev) => ({
                            ...prev,
                            [field.key]: e.target.value,
                          }))
                        }
                        className={cn(
                          inputCls,
                          "h-8 text-sm font-mono flex-1"
                        )}
                      />
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Right: Source text */}
            <div className="p-6">
              <h4 className="text-sm font-medium text-[#94a3b8] mb-4">
                Source Text
              </h4>
              <div className="bg-[#020617] border border-[#1e293b] rounded-lg p-4 max-h-[500px] overflow-y-auto">
                <p className="text-xs text-[#94a3b8] leading-relaxed whitespace-pre-wrap font-mono">
                  {result.sourceText.slice(0, 3000)}
                  {result.sourceText.length > 3000 && (
                    <span className="text-[#64748b]">
                      {"\n\n"}... ({result.sourceText.length - 3000}{" "}
                      more characters)
                    </span>
                  )}
                </p>
              </div>
            </div>
          </div>

          {/* Action bar */}
          <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-[#1e293b]">
            <Button
              variant="outline"
              onClick={handleDiscard}
              className="border-[#334155] text-[#94a3b8] hover:text-[#f8fafc]"
            >
              <Trash2 className="w-4 h-4 mr-1" />
              Discard
            </Button>
            <Button onClick={handleSave} disabled={saving}>
              {saving ? (
                <>
                  <Loader2 className="w-4 h-4 mr-1 animate-spin" />
                  Saving...
                </>
              ) : (
                <>
                  <Save className="w-4 h-4 mr-1" />
                  Save to Database
                </>
              )}
            </Button>
          </div>
        </div>
      )}

      {/* ── History ───────────────────────────────────── */}
      {history.length > 0 && (
        <div className="bg-[#0f172a] border border-[#1e293b] rounded-lg p-6">
          <h3 className="text-[#f8fafc] font-semibold mb-4">
            Recent Extractions
          </h3>
          <div className="space-y-2">
            {history.map((entry) => (
              <div
                key={entry.id}
                className="flex items-center justify-between px-4 py-2.5 bg-[#020617] rounded-lg border border-[#1e293b]"
              >
                <div className="flex items-center gap-3">
                  {entry.status === "Saved" ? (
                    <CheckCircle className="w-4 h-4 text-[#22c55e]" />
                  ) : entry.status === "Draft" ? (
                    <Clock className="w-4 h-4 text-[#f59e0b]" />
                  ) : (
                    <X className="w-4 h-4 text-[#64748b]" />
                  )}
                  <span className="text-sm text-[#f8fafc]">
                    {entry.companyName}
                  </span>
                </div>
                <div className="flex items-center gap-3">
                  <span
                    className={cn(
                      "text-xs px-2 py-0.5 rounded-full",
                      entry.status === "Saved" &&
                        "bg-[#22c55e]/10 text-[#22c55e]",
                      entry.status === "Draft" &&
                        "bg-[#f59e0b]/10 text-[#f59e0b]",
                      entry.status === "Discarded" &&
                        "bg-[#64748b]/10 text-[#64748b]"
                    )}
                  >
                    {entry.status}
                  </span>
                  <span className="text-xs text-[#64748b]">
                    {new Date(entry.timestamp).toLocaleTimeString()}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
