"use client";

import { cn } from "@/lib/utils";
import { Info, AlertTriangle, CheckCircle } from "lucide-react";

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

  return (
    <div
      className={cn(
        "rounded-xl border p-5",
        v.border,
        v.bg
      )}
    >
      <div className="flex items-start gap-3">
        <Icon className={cn("w-5 h-5 mt-0.5 flex-shrink-0", v.iconColor)} />
        <div className="min-w-0">
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
      </div>
    </div>
  );
}
