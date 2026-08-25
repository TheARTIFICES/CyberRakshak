import { useState } from "react";
import { AlertTriangle, CheckCircle2, Cloud, KeyRound, Loader2, RefreshCw, ShieldAlert, XCircle } from "lucide-react";
import { triggerConnectorSync, type ConnectorSyncResult } from "../../services/api";

/**
 * Connector Management — trigger-only today.
 *
 * backend/app/connectors/base_connector.py::ALLOWED_CONNECTORS is the source
 * of truth for this list; there is no GET endpoint that returns it, so it is
 * mirrored here and must be kept in sync by hand. There is also no
 * credential-CRUD endpoint (POST /connectors/trigger/{name} runs each
 * connector's own default/mock config) — a "Connect" flow that stores
 * encrypted credentials per FRONTEND_ROADMAP.md §4 cannot be built honestly
 * until that endpoint exists. This tab ships the part that IS real: listing
 * the known connector types and triggering a live sync against each.
 */
interface ConnectorMeta {
  key: string;
  label: string;
  category: string;
  description: string;
}

const KNOWN_CONNECTORS: ConnectorMeta[] = [
  { key: "azure_ad", label: "Azure AD", category: "IAM", description: "Identity & MFA posture from Microsoft Entra ID." },
  { key: "okta", label: "Okta", category: "IAM", description: "Identity & MFA posture from Okta Workforce Identity." },
  { key: "mock_siem", label: "SIEM (Reference)", category: "SIEM", description: "Reference SIEM telemetry source for demo/testing." },
  { key: "mock_edr", label: "EDR (Reference)", category: "EDR", description: "Reference EDR posture source for demo/testing." },
  { key: "mock_cspm", label: "CSPM (Reference)", category: "CSPM", description: "Reference cloud security posture source for demo/testing." },
];

type SyncState =
  | { status: "idle" }
  | { status: "syncing" }
  | { status: "success"; result: ConnectorSyncResult }
  | { status: "error"; message: string };

const ConnectorsTab = () => {
  const [syncStates, setSyncStates] = useState<Record<string, SyncState>>({});

  const handleSync = async (key: string) => {
    setSyncStates((prev) => ({ ...prev, [key]: { status: "syncing" } }));
    try {
      const result = await triggerConnectorSync(key);
      setSyncStates((prev) => ({ ...prev, [key]: { status: "success", result } }));
    } catch (err) {
      console.error(`Connector sync failed for ${key}:`, err);
      setSyncStates((prev) => ({
        ...prev,
        [key]: { status: "error", message: "Sync failed — the connector or its target may be unreachable." },
      }));
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-start gap-2 px-3 py-2.5 rounded-lg bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-900 text-xs text-amber-800 dark:text-amber-300">
        <AlertTriangle className="w-4 h-4 flex-shrink-0 mt-0.5" />
        <span>
          Credential configuration is not available yet — there is no backend endpoint to store per-connector
          credentials, only <code className="font-mono">POST /api/connectors/trigger/&#123;name&#125;</code>. Each
          "Sync Now" below runs that connector's built-in default configuration.
        </span>
      </div>

      <div className="space-y-3">
        {KNOWN_CONNECTORS.map((connector) => {
          const state = syncStates[connector.key] ?? { status: "idle" as const };
          return (
            <div
              key={connector.key}
              className="flex items-center justify-between gap-4 rounded-lg border border-slate-200 dark:border-slate-700 px-4 py-3"
            >
              <div className="flex items-center gap-3 min-w-0">
                <div className="w-9 h-9 rounded-lg bg-cyan-100 dark:bg-cyan-950/50 flex items-center justify-center flex-shrink-0">
                  {connector.category === "IAM" ? (
                    <KeyRound className="w-4 h-4 text-cyan-600 dark:text-cyan-400" />
                  ) : (
                    <Cloud className="w-4 h-4 text-cyan-600 dark:text-cyan-400" />
                  )}
                </div>
                <div className="min-w-0">
                  <p className="text-sm font-medium text-slate-800 dark:text-slate-100">{connector.label}</p>
                  <p className="text-xs text-slate-500 truncate">{connector.description}</p>
                  {state.status === "success" && (
                    <p className="text-xs text-emerald-600 dark:text-emerald-400 mt-0.5 inline-flex items-center gap-1">
                      <CheckCircle2 className="w-3 h-3" />
                      {state.result.findings_ingested} findings, {state.result.controls_updated} controls updated
                    </p>
                  )}
                  {state.status === "error" && (
                    <p className="text-xs text-red-600 dark:text-red-400 mt-0.5 inline-flex items-center gap-1">
                      <XCircle className="w-3 h-3" />
                      {state.message}
                    </p>
                  )}
                </div>
              </div>

              <button
                onClick={() => handleSync(connector.key)}
                disabled={state.status === "syncing"}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white rounded-md transition flex-shrink-0"
              >
                {state.status === "syncing" ? (
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                ) : (
                  <RefreshCw className="w-3.5 h-3.5" />
                )}
                {state.status === "syncing" ? "Syncing…" : "Sync Now"}
              </button>
            </div>
          );
        })}
      </div>

      <div className="flex items-center gap-2 text-xs text-slate-400 pt-1">
        <ShieldAlert className="w-3.5 h-3.5" />
        Live IAM tenant sourcing (a real Azure AD/Okta test tenant) is tracked separately in DEVELOPMENT_SEQUENCE.md
        Phase 0 — an external/non-code dependency.
      </div>
    </div>
  );
};

export default ConnectorsTab;
