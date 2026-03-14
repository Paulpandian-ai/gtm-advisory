import { Building2 } from "lucide-react";

export default function CompaniesPage() {
  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-2xl font-semibold text-[var(--text-primary)]">
          Company Profiles
        </h2>
        <p className="text-sm text-[var(--text-muted)] mt-1">
          View and manage company benchmark profiles
        </p>
      </div>
      <div className="bg-[var(--bg-surface)] border border-[var(--border)] rounded-lg p-12 text-center">
        <Building2 className="w-10 h-10 text-[var(--text-muted)] mx-auto mb-4" />
        <h3 className="text-lg font-medium text-[var(--text-secondary)] mb-2">
          Company Profiles
        </h3>
        <p className="text-sm text-[var(--text-muted)] max-w-md mx-auto">
          Add companies to start tracking their GTM benchmarks and performance.
        </p>
      </div>
    </div>
  );
}
