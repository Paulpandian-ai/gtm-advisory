"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

/**
 * Global keyboard shortcuts.
 *
 * Cmd+K → Global search (handled by companies page command dialog)
 * Cmd+N → New company (navigate to curation)
 * Cmd+B → Benchmarks
 * Cmd+D → Dashboard
 * Escape → Close any open dialog (native behavior)
 */
export function KeyboardShortcuts() {
  const router = useRouter();

  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      // Only handle Cmd/Ctrl shortcuts
      if (!e.metaKey && !e.ctrlKey) return;

      // Don't fire if user is typing in an input
      const tag = (e.target as HTMLElement)?.tagName;
      if (tag === "INPUT" || tag === "TEXTAREA" || tag === "SELECT") return;

      switch (e.key.toLowerCase()) {
        case "n":
          e.preventDefault();
          router.push("/curation");
          break;
        case "b":
          e.preventDefault();
          router.push("/benchmarks");
          break;
        case "d":
          e.preventDefault();
          router.push("/");
          break;
      }
    }

    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [router]);

  return null;
}
