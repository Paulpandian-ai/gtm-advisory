"use client";

import { cn } from "@/lib/utils";

/* ── Skeleton primitives ───────────────────────────────── */

function Bone({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn(
        "animate-pulse rounded-lg bg-[#1e293b]",
        className
      )}
      {...props}
    />
  );
}

/* ── MetricCard skeleton ───────────────────────────────── */

export function MetricCardSkeleton() {
  return (
    <div className="rounded-xl border border-[#1e293b] bg-[#0f172a] p-5">
      <Bone className="h-3 w-20 mb-4" />
      <Bone className="h-7 w-28 mb-2" />
      <Bone className="h-3 w-16" />
    </div>
  );
}

/* ── Table shimmer (3 rows) ────────────────────────────── */

export function TableSkeleton({ rows = 3 }: { rows?: number }) {
  return (
    <div className="bg-[#0f172a] border border-[#1e293b] rounded-lg overflow-hidden">
      {/* Header */}
      <div className="flex items-center gap-4 px-4 py-3 border-b border-[#1e293b]">
        <Bone className="h-3 w-24" />
        <Bone className="h-3 w-16" />
        <Bone className="h-3 w-20" />
        <Bone className="h-3 w-12" />
      </div>
      {/* Rows */}
      {Array.from({ length: rows }).map((_, i) => (
        <div
          key={i}
          className="flex items-center gap-4 px-4 py-3.5 border-b border-[#1e293b] last:border-b-0"
        >
          <Bone className="h-3 w-32" />
          <Bone className="h-3 w-16" />
          <Bone className="h-3 w-24" />
          <Bone className="h-3 w-12" />
        </div>
      ))}
    </div>
  );
}

/* ── Company card skeleton ─────────────────────────────── */

export function CompanyCardSkeleton() {
  return (
    <div className="bg-[#0f172a] border border-[#1e293b] rounded-lg p-5">
      <Bone className="h-5 w-36 mb-3" />
      <div className="flex gap-1.5 mb-3">
        <Bone className="h-4 w-14 rounded-full" />
        <Bone className="h-4 w-16 rounded-full" />
      </div>
      <div className="flex gap-4 mb-3">
        <div>
          <Bone className="h-2.5 w-8 mb-1" />
          <Bone className="h-4 w-14" />
        </div>
        <div>
          <Bone className="h-2.5 w-10 mb-1" />
          <Bone className="h-4 w-10" />
        </div>
      </div>
      <Bone className="h-1.5 w-full rounded-full" />
    </div>
  );
}

/* ── Stat card skeleton ────────────────────────────────── */

export function StatCardSkeleton() {
  return (
    <div className="bg-[#0f172a] border border-[#1e293b] rounded-lg p-5">
      <div className="flex items-center justify-between mb-3">
        <Bone className="h-2.5 w-20" />
        <Bone className="h-4 w-4 rounded" />
      </div>
      <Bone className="h-7 w-16" />
    </div>
  );
}

/* ── Chart area skeleton ───────────────────────────────── */

export function ChartSkeleton() {
  return (
    <div className="bg-[#0f172a] border border-[#1e293b] rounded-lg p-6">
      <Bone className="h-3 w-32 mb-4" />
      <div className="h-[250px] flex items-end gap-2 px-4 pb-4">
        {[40, 65, 50, 80, 30, 55, 70].map((h, i) => (
          <Bone
            key={i}
            className="flex-1 rounded-t"
            style={{ height: `${h}%` }}
          />
        ))}
      </div>
    </div>
  );
}

/* ── Full-page spinner ─────────────────────────────────── */

export function PageSpinner({ message }: { message?: string }) {
  return (
    <div className="flex flex-col items-center justify-center py-32">
      <div className="relative w-10 h-10">
        <div className="absolute inset-0 rounded-full border-2 border-[#1e293b]" />
        <div className="absolute inset-0 rounded-full border-2 border-transparent border-t-[#3b82f6] animate-spin" />
      </div>
      {message && (
        <p className="text-sm text-[#64748b] mt-4">{message}</p>
      )}
    </div>
  );
}

/* ── Inline spinner ────────────────────────────────────── */

export function Spinner({ size = 16 }: { size?: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 16 16"
      className="animate-spin text-[#3b82f6]"
    >
      <circle
        cx="8"
        cy="8"
        r="6"
        fill="none"
        stroke="#1e293b"
        strokeWidth="2"
      />
      <circle
        cx="8"
        cy="8"
        r="6"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeDasharray="28"
        strokeDashoffset="21"
        strokeLinecap="round"
      />
    </svg>
  );
}

/* ── Progress bar (for imports) ────────────────────────── */

export function ProgressBar({
  value,
  max,
  label,
}: {
  value: number;
  max: number;
  label?: string;
}) {
  const pct = max > 0 ? Math.round((value / max) * 100) : 0;

  return (
    <div>
      {label && (
        <div className="flex items-center justify-between mb-1.5">
          <span className="text-xs text-[#94a3b8]">{label}</span>
          <span className="text-xs text-[#64748b] font-mono">
            {pct}%
          </span>
        </div>
      )}
      <div className="h-2 rounded-full bg-[#1e293b] overflow-hidden">
        <div
          className="h-full rounded-full transition-all duration-300 ease-out"
          style={{
            width: `${pct}%`,
            background: "linear-gradient(90deg, #1e40af, #3b82f6)",
          }}
        />
      </div>
    </div>
  );
}

export { Bone };
