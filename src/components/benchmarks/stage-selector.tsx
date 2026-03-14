"use client";

import { cn } from "@/lib/utils";

export const STAGE_OPTIONS = [
  { label: "Seed", value: "SEED" },
  { label: "Series A", value: "SERIES_A" },
  { label: "Series B", value: "SERIES_B" },
  { label: "Series C", value: "SERIES_C" },
  { label: "D+ / Growth", value: "GROWTH" },
] as const;

export type StageValue = (typeof STAGE_OPTIONS)[number]["value"];

/** Map a stage value back to its display label */
export function stageLabel(value: string): string {
  return STAGE_OPTIONS.find((s) => s.value === value)?.label ?? value;
}

interface StageSelectorProps {
  selected: string;
  onSelect: (stage: string) => void;
}

export function StageSelector({ selected, onSelect }: StageSelectorProps) {
  return (
    <div className="flex items-center gap-2 flex-wrap">
      {STAGE_OPTIONS.map((stage) => {
        const isActive = selected === stage.value;
        return (
          <button
            key={stage.value}
            onClick={() => onSelect(stage.value)}
            className={cn(
              "px-4 py-1.5 rounded-full text-sm font-medium transition-all",
              isActive
                ? "bg-[#3b82f6] text-white shadow-[0_0_20px_rgba(59,130,246,0.15)]"
                : "bg-[#1e293b] text-[#94a3b8] hover:text-[#e2e8f0] hover:bg-[#1e293b]/80"
            )}
          >
            {stage.label}
          </button>
        );
      })}
    </div>
  );
}
