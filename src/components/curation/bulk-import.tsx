"use client";

import { useState, useCallback, useRef } from "react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Upload,
  FileSpreadsheet,
  Download,
  CheckCircle2,
  XCircle,
  ArrowRight,
  Loader2,
} from "lucide-react";
import Papa from "papaparse";

/* ── Types ─────────────────────────────────────────────── */

type Step = "upload" | "mapping" | "validation" | "import";

const DB_FIELDS = [
  "companyName",
  "industry",
  "stage",
  "arr",
  "employees",
  "funding",
  "gtmMotion",
  "winRate",
  "salesCycleLength",
  "cac",
  "ltv",
  "nrr",
  "churnRate",
  "pricingModel",
  "freeTier",
  "partnerProgram",
  "— skip —",
] as const;

const FIELD_LABELS: Record<string, string> = {
  companyName: "Company Name",
  industry: "Industry",
  stage: "Stage",
  arr: "ARR",
  employees: "Employees",
  funding: "Total Funding",
  gtmMotion: "GTM Motion",
  winRate: "Win Rate",
  salesCycleLength: "Sales Cycle (days)",
  cac: "CAC",
  ltv: "LTV",
  nrr: "NRR",
  churnRate: "Churn Rate",
  pricingModel: "Pricing Model",
  freeTier: "Free Tier",
  partnerProgram: "Partner Program",
  "— skip —": "— skip —",
};

const REQUIRED_FIELDS = ["companyName", "industry", "stage"];

const NUMERIC_FIELDS = [
  "arr",
  "employees",
  "funding",
  "winRate",
  "salesCycleLength",
  "cac",
  "ltv",
  "nrr",
  "churnRate",
];

/* ── Auto-match heuristics ─────────────────────────────── */

function autoMatch(csvHeader: string): string {
  const h = csvHeader.toLowerCase().replace(/[^a-z0-9]/g, "");
  const map: Record<string, string> = {
    companyname: "companyName",
    company: "companyName",
    name: "companyName",
    industry: "industry",
    stage: "stage",
    arr: "arr",
    revenue: "arr",
    employees: "employees",
    headcount: "employees",
    funding: "funding",
    totalfunding: "funding",
    gtmmotion: "gtmMotion",
    motion: "gtmMotion",
    winrate: "winRate",
    salescycle: "salesCycleLength",
    salescyclelength: "salesCycleLength",
    cac: "cac",
    ltv: "ltv",
    nrr: "nrr",
    churnrate: "churnRate",
    churn: "churnRate",
    pricingmodel: "pricingModel",
    pricing: "pricingModel",
    freetier: "freeTier",
    partnerprogram: "partnerProgram",
  };
  return map[h] || "— skip —";
}

/* ── Row validation ────────────────────────────────────── */

interface RowValidation {
  valid: boolean;
  errors: string[];
}

function validateRow(
  row: Record<string, string>,
  mapping: Record<string, string>
): RowValidation {
  const errors: string[] = [];
  const mapped: Record<string, string> = {};

  for (const [csvCol, dbField] of Object.entries(mapping)) {
    if (dbField !== "— skip —") {
      mapped[dbField] = row[csvCol] ?? "";
    }
  }

  for (const field of REQUIRED_FIELDS) {
    if (!mapped[field]?.trim()) {
      errors.push(`Missing ${FIELD_LABELS[field]}`);
    }
  }

  for (const field of NUMERIC_FIELDS) {
    const val = mapped[field];
    if (val && val.trim() && isNaN(Number(val))) {
      errors.push(`${FIELD_LABELS[field]} is not a number`);
    }
  }

  return { valid: errors.length === 0, errors };
}

/* ── Template download ─────────────────────────────────── */

function downloadTemplate() {
  const headers = [
    "company_name",
    "industry",
    "stage",
    "arr",
    "employees",
    "funding",
    "gtm_motion",
    "win_rate",
    "sales_cycle_length",
    "cac",
    "ltv",
    "nrr",
    "churn_rate",
    "pricing_model",
    "free_tier",
    "partner_program",
  ];
  const exampleRow = [
    "Acme Corp",
    "SaaS",
    "Series A",
    "5000000",
    "120",
    "20000000",
    "Product-Led",
    "0.22",
    "38",
    "20000",
    "60000",
    "1.05",
    "0.03",
    "Freemium",
    "true",
    "true",
  ];
  const csv = [headers.join(","), exampleRow.join(",")].join("\n");
  const blob = new Blob([csv], { type: "text/csv" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = "gtm-import-template.csv";
  a.click();
  URL.revokeObjectURL(url);
}

/* ── Main component ────────────────────────────────────── */

export function BulkImport() {
  const [step, setStep] = useState<Step>("upload");
  const [csvHeaders, setCsvHeaders] = useState<string[]>([]);
  const [csvData, setCsvData] = useState<Record<string, string>[]>([]);
  const [mapping, setMapping] = useState<Record<string, string>>({});
  const [validations, setValidations] = useState<RowValidation[]>([]);
  const [importProgress, setImportProgress] = useState(0);
  const [importDone, setImportDone] = useState(false);
  const [dragOver, setDragOver] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  const handleFile = useCallback((file: File) => {
    Papa.parse(file, {
      header: true,
      skipEmptyLines: true,
      complete: (results) => {
        const headers = results.meta.fields ?? [];
        const data = results.data as Record<string, string>[];
        setCsvHeaders(headers);
        setCsvData(data);

        // Auto-match columns
        const autoMapping: Record<string, string> = {};
        for (const h of headers) {
          autoMapping[h] = autoMatch(h);
        }
        setMapping(autoMapping);
        setStep("mapping");
      },
    });
  }, []);

  function handleDrop(e: React.DragEvent) {
    e.preventDefault();
    setDragOver(false);
    const file = e.dataTransfer.files[0];
    if (file?.name.endsWith(".csv")) handleFile(file);
  }

  function handleFileInput(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (file) handleFile(file);
  }

  function runValidation() {
    const results = csvData.map((row) => validateRow(row, mapping));
    setValidations(results);
    setStep("validation");
  }

  async function runImport() {
    setStep("import");
    setImportProgress(0);
    setImportDone(false);
    const total = validations.filter((v) => v.valid).length;
    for (let i = 1; i <= total; i++) {
      await new Promise((r) => setTimeout(r, 60));
      setImportProgress(i);
    }
    setImportDone(true);
  }

  const validCount = validations.filter((v) => v.valid).length;
  const invalidCount = validations.filter((v) => !v.valid).length;
  const totalImportable = validations.filter((v) => v.valid).length;

  const selectContentCls = "bg-[#0f172a] border-[#1e293b]";
  const selectTriggerCls =
    "bg-[#020617] border-[#334155] focus:border-[#3b82f6] text-[#f8fafc] text-xs h-8";

  /* ── Step indicators ─────────────────────────────────── */

  const steps: { id: Step; label: string }[] = [
    { id: "upload", label: "Upload" },
    { id: "mapping", label: "Map Columns" },
    { id: "validation", label: "Validate" },
    { id: "import", label: "Import" },
  ];

  const stepIndex = steps.findIndex((s) => s.id === step);

  return (
    <div className="space-y-6">
      {/* Step indicator */}
      <div className="flex items-center gap-2">
        {steps.map((s, i) => (
          <div key={s.id} className="flex items-center gap-2">
            <div
              className={cn(
                "flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-medium transition-all",
                i <= stepIndex
                  ? "bg-[#3b82f6]/20 text-[#3b82f6]"
                  : "bg-[#1e293b] text-[#64748b]"
              )}
            >
              <span className="font-mono">{i + 1}</span>
              {s.label}
            </div>
            {i < steps.length - 1 && (
              <ArrowRight className="w-3.5 h-3.5 text-[#334155]" />
            )}
          </div>
        ))}
      </div>

      {/* Download template + reset */}
      <div className="flex items-center gap-3">
        <Button variant="outline" size="sm" onClick={downloadTemplate} className="border-[#334155] text-[#94a3b8]">
          <Download className="w-4 h-4 mr-1" />
          Download Template
        </Button>
        {step !== "upload" && (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => {
              setStep("upload");
              setCsvHeaders([]);
              setCsvData([]);
              setMapping({});
              setValidations([]);
              setImportProgress(0);
              setImportDone(false);
            }}
            className="text-[#64748b]"
          >
            Start Over
          </Button>
        )}
      </div>

      {/* Step 1: Upload */}
      {step === "upload" && (
        <div
          onDragOver={(e) => {
            e.preventDefault();
            setDragOver(true);
          }}
          onDragLeave={() => setDragOver(false)}
          onDrop={handleDrop}
          onClick={() => fileRef.current?.click()}
          className={cn(
            "border-2 border-dashed rounded-lg p-16 text-center cursor-pointer transition-all",
            dragOver
              ? "border-[#3b82f6] bg-[#3b82f6]/5"
              : "border-[#334155] bg-[#0f172a] hover:border-[#64748b]"
          )}
        >
          <input
            ref={fileRef}
            type="file"
            accept=".csv"
            onChange={handleFileInput}
            className="hidden"
          />
          <Upload
            className={cn(
              "w-10 h-10 mx-auto mb-4",
              dragOver ? "text-[#3b82f6]" : "text-[#64748b]"
            )}
          />
          <p className="text-[#f8fafc] font-medium mb-1">
            Drop a CSV file here or click to browse
          </p>
          <p className="text-xs text-[#64748b]">
            Supports .csv files with header rows
          </p>
        </div>
      )}

      {/* Step 1b: Preview (shown alongside mapping) */}
      {step === "mapping" && csvData.length > 0 && (
        <div className="space-y-4">
          <h3 className="text-sm font-medium text-[#f8fafc]">
            Preview (first 5 rows)
          </h3>
          <div className="bg-[#0f172a] border border-[#1e293b] rounded-lg overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-xs font-mono">
                <thead>
                  <tr className="border-b border-[#1e293b] text-[#64748b]">
                    {csvHeaders.map((h) => (
                      <th
                        key={h}
                        className="text-left px-3 py-2 font-medium whitespace-nowrap"
                      >
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {csvData.slice(0, 5).map((row, i) => (
                    <tr
                      key={i}
                      className="border-b border-[#1e293b]/50 text-[#94a3b8]"
                    >
                      {csvHeaders.map((h) => (
                        <td
                          key={h}
                          className="px-3 py-1.5 whitespace-nowrap max-w-[180px] truncate"
                        >
                          {row[h]}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Step 2: Column Mapping */}
      {step === "mapping" && (
        <div className="space-y-4">
          <h3 className="text-sm font-medium text-[#f8fafc]">
            Map CSV Columns to Database Fields
          </h3>
          <div className="bg-[#0f172a] border border-[#1e293b] rounded-lg overflow-hidden">
            <div className="divide-y divide-[#1e293b]/50">
              {csvHeaders.map((header) => (
                <div
                  key={header}
                  className="flex items-center justify-between px-4 py-2.5"
                >
                  <div className="flex items-center gap-3">
                    <FileSpreadsheet className="w-4 h-4 text-[#64748b]" />
                    <span className="text-sm text-[#f8fafc] font-mono">
                      {header}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <ArrowRight className="w-3.5 h-3.5 text-[#334155]" />
                    <Select
                      value={mapping[header]}
                      onValueChange={(v) =>
                        setMapping((prev) => ({ ...prev, [header]: v }))
                      }
                    >
                      <SelectTrigger className={cn(selectTriggerCls, "w-48")}>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent className={selectContentCls}>
                        {DB_FIELDS.map((f) => (
                          <SelectItem key={f} value={f}>
                            {FIELD_LABELS[f]}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              ))}
            </div>
          </div>
          <div className="flex justify-end">
            <Button onClick={runValidation}>
              Validate
              <ArrowRight className="w-4 h-4 ml-1" />
            </Button>
          </div>
        </div>
      )}

      {/* Step 3: Validation */}
      {step === "validation" && (
        <div className="space-y-4">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2 text-sm">
              <CheckCircle2 className="w-4 h-4 text-[#22c55e]" />
              <span className="text-[#22c55e] font-mono">{validCount}</span>
              <span className="text-[#94a3b8]">valid</span>
            </div>
            <div className="flex items-center gap-2 text-sm">
              <XCircle className="w-4 h-4 text-[#ef4444]" />
              <span className="text-[#ef4444] font-mono">{invalidCount}</span>
              <span className="text-[#94a3b8]">with issues</span>
            </div>
          </div>

          <div className="bg-[#0f172a] border border-[#1e293b] rounded-lg overflow-hidden">
            <div className="overflow-x-auto max-h-[400px]">
              <table className="w-full text-xs">
                <thead className="sticky top-0 bg-[#0f172a]">
                  <tr className="border-b border-[#1e293b] text-[#64748b] uppercase tracking-wider">
                    <th className="text-left px-3 py-2 font-medium w-10">
                      #
                    </th>
                    <th className="text-left px-3 py-2 font-medium">
                      Status
                    </th>
                    <th className="text-left px-3 py-2 font-medium">
                      Company
                    </th>
                    <th className="text-left px-3 py-2 font-medium">
                      Issues
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {validations.map((v, i) => {
                    const nameCol = Object.entries(mapping).find(
                      ([, db]) => db === "companyName"
                    )?.[0];
                    const name = nameCol ? csvData[i]?.[nameCol] : `Row ${i + 1}`;
                    return (
                      <tr
                        key={i}
                        className="border-b border-[#1e293b]/50"
                      >
                        <td className="px-3 py-2 text-[#64748b] font-mono">
                          {i + 1}
                        </td>
                        <td className="px-3 py-2">
                          {v.valid ? (
                            <CheckCircle2 className="w-4 h-4 text-[#22c55e]" />
                          ) : (
                            <XCircle className="w-4 h-4 text-[#ef4444]" />
                          )}
                        </td>
                        <td className="px-3 py-2 text-[#f8fafc]">{name}</td>
                        <td className="px-3 py-2 text-[#ef4444]">
                          {v.errors.join(", ") || "—"}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>

          <div className="flex justify-end gap-3">
            <Button
              variant="outline"
              onClick={() => setStep("mapping")}
              className="border-[#334155] text-[#94a3b8]"
            >
              Back to Mapping
            </Button>
            <Button onClick={runImport} disabled={validCount === 0}>
              Import {validCount} Records
              <ArrowRight className="w-4 h-4 ml-1" />
            </Button>
          </div>
        </div>
      )}

      {/* Step 4: Import */}
      {step === "import" && (
        <div className="bg-[#0f172a] border border-[#1e293b] rounded-lg p-8 text-center space-y-6">
          {!importDone ? (
            <>
              <Loader2 className="w-8 h-8 text-[#3b82f6] mx-auto animate-spin" />
              <p className="text-[#f8fafc] font-medium">
                Importing records...
              </p>
            </>
          ) : (
            <>
              <CheckCircle2 className="w-10 h-10 text-[#22c55e] mx-auto" />
              <p className="text-[#f8fafc] font-medium">Import Complete</p>
            </>
          )}

          {/* Progress bar */}
          <div className="max-w-md mx-auto">
            <div className="flex items-center justify-between text-xs text-[#64748b] mb-2">
              <span>Progress</span>
              <span className="font-mono">
                {importProgress} / {totalImportable}
              </span>
            </div>
            <div className="w-full bg-[#1e293b] rounded-full h-2">
              <div
                className="bg-[#3b82f6] h-2 rounded-full transition-all duration-100"
                style={{
                  width: `${totalImportable ? (importProgress / totalImportable) * 100 : 0}%`,
                }}
              />
            </div>
          </div>

          {importDone && (
            <div className="flex items-center justify-center gap-6 text-sm">
              <div>
                <span className="text-[#22c55e] font-mono font-bold">
                  {validCount}
                </span>
                <span className="text-[#94a3b8] ml-1">imported</span>
              </div>
              <div>
                <span className="text-[#f59e0b] font-mono font-bold">
                  {invalidCount}
                </span>
                <span className="text-[#94a3b8] ml-1">skipped</span>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
