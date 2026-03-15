"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import {
  LayoutDashboard,
  BarChart3,
  Database,
  Building2,
  Globe,
  Settings,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";

const navigation = [
  { name: "Dashboard", href: "/", icon: LayoutDashboard },
  { name: "Benchmark Explorer", href: "/benchmarks", icon: BarChart3 },
  { name: "Data Curation", href: "/curation", icon: Database },
  { name: "Company Profiles", href: "/companies", icon: Building2 },
  { name: "Data Sources", href: "/sources", icon: Globe },
  { name: "Settings", href: "/settings", icon: Settings },
];

// Bottom nav shows the 5 most used items on mobile
const mobileNav = navigation.slice(0, 5);

export function Sidebar() {
  const [collapsed, setCollapsed] = useState(false);
  const pathname = usePathname();

  return (
    <>
      {/* ── Desktop / Tablet Sidebar ───────────────────── */}
      <aside
        className={cn(
          "hidden md:flex flex-col border-r border-[var(--border)] bg-[var(--bg-surface)] transition-all duration-200",
          collapsed ? "w-16" : "lg:w-60 w-16"
        )}
      >
        {/* Header */}
        <div className="flex items-center gap-3 px-4 h-14 border-b border-[var(--border)]">
          <div className="relative flex-shrink-0">
            <div className="w-2.5 h-2.5 rounded-full bg-[var(--accent)] animate-pulse-blue" />
            <div className="absolute inset-0 w-2.5 h-2.5 rounded-full bg-[var(--accent)] blur-sm opacity-50" />
          </div>
          {!collapsed && (
            <div className="min-w-0 hidden lg:block">
              <h1 className="text-sm font-semibold text-[var(--text-primary)] truncate">
                Project Horizon
              </h1>
              <p className="text-[10px] text-[var(--text-muted)] truncate">
                GTM Benchmark Intelligence
              </p>
            </div>
          )}
        </div>

        {/* Navigation */}
        <nav className="flex-1 py-3 px-2 space-y-1">
          {navigation.map((item) => {
            const isActive = pathname === item.href;
            return (
              <Link
                key={item.name}
                href={item.href}
                className={cn(
                  "flex items-center gap-3 px-3 py-2 rounded-md text-sm transition-colors",
                  isActive
                    ? "bg-[var(--accent)]/10 text-[var(--accent)] glow"
                    : "text-[var(--text-tertiary)] hover:text-[var(--text-secondary)] hover:bg-[var(--bg-elevated)]"
                )}
                title={item.name}
              >
                <item.icon className="w-4 h-4 flex-shrink-0" />
                {!collapsed && (
                  <span className="hidden lg:inline">{item.name}</span>
                )}
              </Link>
            );
          })}
        </nav>

        {/* Collapse toggle (desktop only) */}
        <div className="border-t border-[var(--border)] p-2 hidden lg:block">
          <button
            onClick={() => setCollapsed(!collapsed)}
            className="flex items-center justify-center w-full py-2 rounded-md text-[var(--text-muted)] hover:text-[var(--text-secondary)] hover:bg-[var(--bg-elevated)] transition-colors"
          >
            {collapsed ? (
              <ChevronRight className="w-4 h-4" />
            ) : (
              <ChevronLeft className="w-4 h-4" />
            )}
          </button>
        </div>
      </aside>

      {/* ── Mobile Bottom Nav ──────────────────────────── */}
      <nav className="fixed bottom-0 left-0 right-0 z-50 md:hidden bg-[var(--bg-surface)] border-t border-[var(--border)]">
        <div className="flex items-center justify-around h-14">
          {mobileNav.map((item) => {
            const isActive = pathname === item.href;
            return (
              <Link
                key={item.name}
                href={item.href}
                className={cn(
                  "flex flex-col items-center gap-0.5 px-2 py-1 rounded-md transition-colors",
                  isActive
                    ? "text-[var(--accent)]"
                    : "text-[var(--text-tertiary)]"
                )}
              >
                <item.icon className="w-5 h-5" />
                <span className="text-[9px]">{item.name.split(" ")[0]}</span>
              </Link>
            );
          })}
        </div>
      </nav>
    </>
  );
}
