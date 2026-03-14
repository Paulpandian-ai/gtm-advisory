import { Globe } from "lucide-react";

export default function SourcesPage() {
  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-2xl font-semibold text-[var(--text-primary)]">
          Data Sources
        </h2>
        <p className="text-sm text-[var(--text-muted)] mt-1">
          Manage data source connections and ingestion pipelines
        </p>
      </div>
      <div className="bg-[var(--bg-surface)] border border-[var(--border)] rounded-lg p-12 text-center">
        <Globe className="w-10 h-10 text-[var(--text-muted)] mx-auto mb-4" />
        <h3 className="text-lg font-medium text-[var(--text-secondary)] mb-2">
          Data Sources
        </h3>
        <p className="text-sm text-[var(--text-muted)] max-w-md mx-auto">
          Connect external data sources to automatically ingest benchmark data.
        </p>
      </div>
    </div>
  );
}
