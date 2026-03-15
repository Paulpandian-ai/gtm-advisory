"use client";

import { useState } from "react";
import { cn } from "@/lib/utils";
import { SourcesDashboard } from "@/components/curation/sources-dashboard";
import { ManualEntry } from "@/components/curation/manual-entry";
import { BulkImport } from "@/components/curation/bulk-import";
import { DataQuality } from "@/components/curation/data-quality";

const tabs = [
  { id: "sources", label: "Data Sources" },
  { id: "manual", label: "Manual Entry" },
  { id: "import", label: "Bulk Import" },
  { id: "quality", label: "Data Quality" },
] as const;

type TabId = (typeof tabs)[number]["id"];

export default function CurationPage() {
  const [activeTab, setActiveTab] = useState<TabId>("sources");

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-semibold text-[#f8fafc]">
          Data Curation
        </h2>
        <p className="text-sm text-[#64748b] mt-1">
          Curate, validate, and enrich benchmark data
        </p>
      </div>

      {/* Sub-tab bar */}
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
      {activeTab === "sources" && <SourcesDashboard />}
      {activeTab === "manual" && <ManualEntry />}
      {activeTab === "import" && <BulkImport />}
      {activeTab === "quality" && <DataQuality />}
    </div>
  );
}
