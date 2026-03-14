import { Settings } from "lucide-react";

export default function SettingsPage() {
  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-2xl font-semibold text-[var(--text-primary)]">
          Settings
        </h2>
        <p className="text-sm text-[var(--text-muted)] mt-1">
          Configure platform settings and integrations
        </p>
      </div>
      <div className="bg-[var(--bg-surface)] border border-[var(--border)] rounded-lg p-12 text-center">
        <Settings className="w-10 h-10 text-[var(--text-muted)] mx-auto mb-4" />
        <h3 className="text-lg font-medium text-[var(--text-secondary)] mb-2">
          Platform Settings
        </h3>
        <p className="text-sm text-[var(--text-muted)] max-w-md mx-auto">
          Configure AWS connections, API keys, and platform preferences.
        </p>
      </div>
    </div>
  );
}
