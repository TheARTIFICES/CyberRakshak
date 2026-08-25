import { useState } from "react";
import {
  AlertTriangle,
  CheckCircle2,
  Cloud,
  KeyRound,
  Loader2,
  Radar,
  RefreshCw,
  ShieldCheck,
  XCircle,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import Card from "../components/ui/Card";
import PageHeader from "../components/ui/PageHeader";
import { triggerConnectorSync, type ConnectorSyncResult } from "../services/api";

/**
 * Telemetry connector status + manual sync.
 *
 * Two honest constraints shape this page:
 *  - There is no GET endpoint that lists connectors, so the catalogue below
 *    mirrors backend/app/connectors/base_connector.py::ALLOWED_CONNECTORS and
 *    must be kept in sync by hand.
 *  - Nothing persists a last-sync timestamp, so "last sync" reflects syncs run
 *    from this browser session only — it is never presented as historical fact.
 */
interface ConnectorMeta {
  key: string;
  label: string;
  category: string;
  icon: LucideIcon;
  description: string;
  /** Reference sources run against built-in fixtures; IAM sources need real tenant credentials. */
  requiresCredentials: boolean;
}

const CONNECTORS: ConnectorMeta[] = [
  {
    key: "azure_ad",
    label: "Microsoft Entra ID",
    category: "IAM",
    icon: KeyRound,
    description: "Identity and MFA enforcement posture.",
    requiresCredentials: true,
  },
  {
    key: "okta",
    label: "Okta Workforce Identity",
    category: "IAM",
    icon: KeyRound,
    description: "Identity and MFA enforcement posture.",
    requiresCredentials: true,
  },
  {
    key: "mock_siem",
    label: "SIEM",
    category: "SIEM",
    icon: Radar,
    description: "Security event and monitoring coverage signals.",
    requiresCredentials: false,
  },
  {
    key: "mock_edr",
    label: "EDR",
    category: "EDR",
    icon: ShieldCheck,
    description: "Endpoint detection and response coverage.",
    requiresCredentials: false,
  },
  {
    key: "mock_cspm",
    label: "CSPM",
    category: "CSPM",
    icon: Cloud,
    description: "Cloud security posture and misconfiguration signals.",
    requiresCredentials: false,
  },
];

type SyncState =
  | { status: "idle" }
  | { status: "syncing" }
  | { status: "success"; result: ConnectorSyncResult; at: Date }
  | { status: "error"; message: string };

const Connectors = () => {
  const [syncStates, setSyncStates] = useState<Record<string, SyncState>>({});

  const handleSync = async (key: string) => {
    setSyncStates((prev) => ({ ...prev, [key]: { status: "syncing" } }));
    try {
      const result = await triggerConnectorSync(key);
      setSyncStates((prev) => ({ ...prev, [key]: { status: "success", result, at: new Date() } }));
    } catch (err) {
      console.error(`Connector sync failed for ${key}:`, err);
      setSyncStates((prev) => ({
        ...prev,
        [key]: { status: "error", message: "Sync failed — the connector or its target may be unreachable." },
      }));
    }
  };

  const syncedCount = Object.values(syncStates).filter((s) => s.status === "success").length;

  return (
    <div className="space-y-6">
      <PageHeader
        title="Connectors"
        subtitle="Multi-source telemetry ingestion — identity, endpoint, cloud, and monitoring posture feeds."
      />

      <div className="flex items-start gap-2 px-3 py-2.5 rounded-lg bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-900 text-xs text-amber-800 dark:text-amber-300">
        <AlertTriangle className="w-4 h-4 flex-shrink-0 mt-0.5" />
        <span>
          Credential configuration is not available yet — the backend exposes{" "}
          <code className="font-mono">POST /api/connectors/trigger/&#123;name&#125;</code> but no endpoint to store
          per-connector credentials. Reference feeds sync against built-in fixtures; the two IAM connectors need a
          real tenant before they return live posture.
        </span>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
        {CONNECTORS.map((connector) => {
          const state = syncStates[connector.key] ?? { status: "idle" as const };
          const Icon = connector.icon;

          return (
            <Card key={connector.key} className="flex flex-col gap-4">
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-10 h-10 rounded-lg bg-cyan-100 dark:bg-cyan-950/50 flex items-center justify-center flex-shrink-0">
                    <Icon className="w-5 h-5 text-cyan-600 dark:text-cyan-400" />
                  </div>
                  <div className="min-w-0">
                    <p className="font-semibold text-sm text-slate-800 dark:text-slate-100 truncate">
                      {connector.label}
                    </p>
                    <p className="text-[11px] uppercase tracking-wide text-slate-500">{connector.category}</p>
                  </div>
                </div>

                <span
                  className={`px-2 py-0.5 rounded-full text-[11px] font-medium whitespace-nowrap ${
                    connector.requiresCredentials
                      ? "bg-slate-100 text-slate-600 dark:bg-slate-700 dark:text-slate-300"
                      : "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300"
                  }`}
                >
                  {connector.requiresCredentials ? "Not configured" : "Available"}
                </span>
              </div>

              <p className="text-xs text-slate-500 leading-relaxed">{connector.description}</p>

              <div className="text-xs pt-3 border-t border-slate-100 dark:border-slate-700 min-h-[2.5rem] flex items-center">
                {state.status === "success" ? (
                  <span className="inline-flex items-center gap-1.5 text-emerald-600 dark:text-emerald-400">
                    <CheckCircle2 className="w-3.5 h-3.5 flex-shrink-0" />
                    {state.result.findings_ingested} findings · {state.result.controls_updated} controls ·{" "}
                    {state.at.toLocaleTimeString("en-IN")}
                  </span>
                ) : state.status === "error" ? (
                  <span className="inline-flex items-center gap-1.5 text-red-600 dark:text-red-400">
                    <XCircle className="w-3.5 h-3.5 flex-shrink-0" />
                    {state.message}
                  </span>
                ) : (
                  <span className="text-slate-400">Not synced this session</span>
                )}
              </div>

              <button
                onClick={() => handleSync(connector.key)}
                disabled={state.status === "syncing"}
                className="w-full inline-flex items-center justify-center gap-1.5 px-3 py-2 text-xs font-medium bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white rounded-md transition"
              >
                {state.status === "syncing" ? (
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                ) : (
                  <RefreshCw className="w-3.5 h-3.5" />
                )}
                {state.status === "syncing" ? "Syncing…" : "Sync Now"}
              </button>
            </Card>
          );
        })}
      </div>

      {syncedCount > 0 && (
        <p className="text-xs text-slate-500">
          {syncedCount} connector{syncedCount === 1 ? "" : "s"} synced this session — control posture changes are
          reflected in Compliance &amp; Audit.
        </p>
      )}
    </div>
  );
};

export default Connectors;
