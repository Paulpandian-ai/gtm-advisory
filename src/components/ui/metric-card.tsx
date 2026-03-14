"use client";

import { cn } from "@/lib/utils";
import { TrendingUp, TrendingDown, Minus } from "lucide-react";

interface MetricCardProps {
  label: string;
  value: string | number;
  subtitle?: string;
  highlight?: boolean;
  trend?: "up" | "down" | "flat";
  format?: "percent" | "currency" | "number" | "ratio" | "days" | "months";
}

function formatValue(value: string | number, format?: string): string {
  if (typeof value === "string") return value;

  switch (format) {
    case "percent":
      return new Intl.NumberFormat("en-US", {
        style: "percent",
        minimumFractionDigits: 0,
        maximumFractionDigits: 1,
      }).format(value);
    case "currency":
      return new Intl.NumberFormat("en-US", {
        style: "currency",
        currency: "USD",
        minimumFractionDigits: 0,
        maximumFractionDigits: 0,
      }).format(value);
    case "ratio":
      return `${value.toFixed(1)}x`;
    case "days":
      return `${Math.round(value)}d`;
    case "months":
      return `${Math.round(value)}mo`;
    default:
      return new Intl.NumberFormat("en-US").format(value);
  }
}

const trendIcons = {
  up: TrendingUp,
  down: TrendingDown,
  flat: Minus,
};

const trendColors = {
  up: "text-[#22c55e]",
  down: "text-[#ef4444]",
  flat: "text-[#64748b]",
};

export function MetricCard({
  label,
  value,
  subtitle,
  highlight = false,
  trend,
  format,
}: MetricCardProps) {
  const TrendIcon = trend ? trendIcons[trend] : null;

  return (
    <div
      className={cn(
        "rounded-xl border p-5 transition-all",
        "bg-[#0f172a]",
        highlight
          ? "border-[#3b82f6] shadow-[0_0_20px_rgba(59,130,246,0.15)]"
          : "border-[#1e293b]"
      )}
    >
      <div className="flex items-center justify-between mb-3">
        <span
          className="text-[11px] font-medium uppercase tracking-[1.2px] text-[#64748b]"
          style={{ fontFamily: "Outfit, system-ui, sans-serif" }}
        >
          {label}
        </span>
        {TrendIcon && (
          <TrendIcon className={cn("w-3.5 h-3.5", trendColors[trend!])} />
        )}
      </div>
      <div
        className={cn(
          "text-2xl font-bold",
          highlight ? "text-[#3b82f6]" : "text-[#f8fafc]"
        )}
        style={{ fontFamily: "'JetBrains Mono', monospace" }}
      >
        {formatValue(value, format)}
      </div>
      {subtitle && (
        <p className="text-xs text-[#94a3b8] mt-1.5">{subtitle}</p>
      )}
    </div>
  );
}
