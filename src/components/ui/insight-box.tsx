"use client";

import { useState } from "react";
import { cn } from "@/lib/utils";
import { Info, AlertTriangle, CheckCircle, Copy, Check } from "lucide-react";

interface InsightBoxProps {
  title: string;
  body: string;
  variant?: "info" | "warning" | "success";
  source?: string;
}

const variants = {
  info: {
    border: "border-[#3b82f6]/30",
    bg: "bg-[#3b82f6]/5",
    icon: Info,
    iconColor: "text-[#3b82f6]",
    titleColor: "text-[#3b82f6]",
  },
  warning: {
    border: "border-[#f59e0b]/30",
    bg: "bg-[#f59e0b]/5",
    icon: AlertTriangle,
    iconColor: "text-[#f59e0b]",
    titleColor: "text-[#f59e0b]",
  },
  success: {
    border: "border-[#22c55e]/30",
    bg: "bg-[#22c55e]/5",
    icon: CheckCircle,
    iconColor: "text-[#22c55e]",
    titleColor: "text-[#22c55e]",
  },
};

export function InsightBox({
  title,
  body,
  variant = "info",
  source,
}: InsightBoxProps) {
  const v = variants[variant];
  const Icon = v.icon;
  const [copied, setCopied] = useState(false);

  function handleCopy() {
    navigator.clipboard.writeText(`${title}: ${body}`);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  return (
    <div
      className={cn(
        "rounded-xl border p-5 group relative",
        v.border,
        v.bg
      )}
    >
      <div className="flex items-start gap-3">
        <Icon className={cn("w-5 h-5 mt-0.5 flex-shrink-0", v.iconColor)} />
        <div className="min-w-0 flex-1">
          <h4 className={cn("text-sm font-semibold mb-1", v.titleColor)}>
            {title}
          </h4>
          <p className="text-sm text-[#e2e8f0] leading-relaxed">{body}</p>
          {source && (
            <p className="text-[10px] text-[#64748b] mt-2 uppercase tracking-wider">
              Source: {source}
            </p>
          )}
        </div>
        <button
          onClick={handleCopy}
          className="opacity-0 group-hover:opacity-100 transition-opacity p-1 rounded hover:bg-[#1e293b]"
          title="Copy insight"
        >
          {copied ? (
            <Check className="w-3.5 h-3.5 text-[#22c55e]" />
          ) : (
            <Copy className="w-3.5 h-3.5 text-[#64748b]" />
          )}
        </button>
      </div>
    </div>
  );
}
