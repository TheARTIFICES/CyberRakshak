import { useEffect, useMemo, useState } from "react";
import { getAuditLogs } from "../services/api";
import { Activity, AlertCircle, Search, X } from "lucide-react";
import Card from "../components/ui/Card";
import PageHeader from "../components/ui/PageHeader";
import EmptyState from "../components/ui/EmptyState";
import StatBlock from "../components/ui/StatBlock";
import { TableWrap, Td, Th, Tr } from "../components/ui/DataTable";

interface AuditLog {
  id: string;
  event_type: string;
  timestamp: string;
  details: unknown;
  user?: string | null;
}

const DATE_RANGES = [
  { key: "all", label: "All time", days: Infinity },
  { key: "24h", label: "Last 24 hours", days: 1 },
  { key: "7d", label: "Last 7 days", days: 7 },
  { key: "30d", label: "Last 30 days", days: 30 },
];

const eventTone = (type: string): string => {
  const t = type.toUpperCase();
  if (t.includes("ERROR") || t.includes("FAILED")) return "bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-300";
  if (t.includes("COMPLETED") || t.includes("APPROVED")) return "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300";
  if (t.includes("STARTED") || t.includes("TRIGGERED")) return "bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300";
  if (t.includes("SYNC")) return "bg-cyan-100 text-cyan-700 dark:bg-cyan-900/40 dark:text-cyan-300";
  return "bg-slate-100 text-slate-600 dark:bg-slate-700 dark:text-slate-300";
};

const formatDetails = (details: unknown): string => {
  if (details == null) return "—";
  if (typeof details === "string") return details;
  try {
    return Object.entries(details as Record<string, unknown>)
      .map(([k, v]) => `${k}: ${typeof v === "object" ? JSON.stringify(v) : String(v)}`)
      .join(" · ");
  } catch {
    return String(details);
  }
};

/**
 * Audit Logs — full event ledger.
 *
 * Rebuilt from a raw terminal-styled dump into the same page-header + filter-bar
 * + table pattern used on Vulnerabilities and Asset Inventory, using the shared
 * DataTable chrome so column headers, row hover and empty state all match.
 */
const AuditLogs = () => {
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);

  const [searchTerm, setSearchTerm] = useState("");
  const [eventFilter, setEventFilter] = useState("All");
  const [rangeKey, setRangeKey] = useState("all");
  const [now] = useState(() => Date.now());

  useEffect(() => {
    const fetchLogs = async () => {
      setLoading(true);
      try {
        const data = await getAuditLogs(200, searchTerm);
        setLogs(data);
        setLoadError(null);
      } catch (error) {
        console.error("Failed to fetch audit logs:", error);
        setLoadError("Could not reach the backend — the audit log may be incomplete.");
      } finally {
        setLoading(false);
      }
    };

    const timer = setTimeout(fetchLogs, 400); // debounce server-side search
    return () => clearTimeout(timer);
  }, [searchTerm]);

  // Event types present in the current result set, for the filter dropdown.
  const eventTypes = useMemo(
    () => Array.from(new Set(logs.map((l) => l.event_type))).sort(),
    [logs]
  );

  const filtered = useMemo(() => {
    const range = DATE_RANGES.find((r) => r.key === rangeKey) ?? DATE_RANGES[0];
    return logs.filter((log) => {
      if (eventFilter !== "All" && log.event_type !== eventFilter) return false;
      if (range.days !== Infinity) {
        const ts = new Date(log.timestamp).getTime();
        if (Number.isNaN(ts) || (now - ts) / 86_400_000 > range.days) return false;
      }
      return true;
    });
  }, [logs, eventFilter, rangeKey, now]);

  const errorCount = filtered.filter((l) => /ERROR|FAILED/i.test(l.event_type)).length;
  const filtersActive = searchTerm !== "" || eventFilter !== "All" || rangeKey !== "all";

  const clearFilters = () => {
    setSearchTerm("");
    setEventFilter("All");
    setRangeKey("all");
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Audit Logs"
        subtitle="Full event ledger — scan activity, remediation approvals, connector syncs and system errors."
      />

      {loadError && (
        <div className="flex items-center gap-2 text-sm text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-950/30 rounded-lg px-4 py-2">
          <AlertCircle className="w-4 h-4 flex-shrink-0" />
          {loadError}
        </div>
      )}

      <section className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <StatBlock label="Events shown" value={filtered.length} />
        <StatBlock label="Distinct event types" value={eventTypes.length} />
        <StatBlock label="Errors / failures" value={errorCount} tone={errorCount > 0 ? "risk" : "neutral"} />
      </section>

      {/* Filter bar */}
      <Card>
        <div className="flex flex-col lg:flex-row lg:items-center gap-3">
          <div className="relative flex-1 min-w-[220px]">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              type="text"
              placeholder="Search by user, target or action…"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              aria-label="Search audit logs"
              className="w-full pl-9 pr-3 py-2 rounded-lg border border-slate-300 dark:border-slate-600 bg-slate-50 dark:bg-slate-900/60 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <select
            value={eventFilter}
            onChange={(e) => setEventFilter(e.target.value)}
            aria-label="Filter by event type"
            className="px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-600 bg-slate-50 dark:bg-slate-900/60 text-sm"
          >
            <option value="All">All event types</option>
            {eventTypes.map((t) => (
              <option key={t} value={t}>
                {t}
              </option>
            ))}
          </select>

          <select
            value={rangeKey}
            onChange={(e) => setRangeKey(e.target.value)}
            aria-label="Filter by date range"
            className="px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-600 bg-slate-50 dark:bg-slate-900/60 text-sm"
          >
            {DATE_RANGES.map((r) => (
              <option key={r.key} value={r.key}>
                {r.label}
              </option>
            ))}
          </select>

          {filtersActive && (
            <button
              onClick={clearFilters}
              className="inline-flex items-center gap-1.5 px-3 py-2 text-sm text-slate-600 dark:text-slate-300 hover:text-red-500 transition"
            >
              <X className="w-4 h-4" />
              Clear
            </button>
          )}
        </div>
      </Card>

      {/* Ledger */}
      <Card flush>
        {loading ? (
          <p className="text-sm text-slate-500 animate-pulse py-16 text-center">Loading system logs…</p>
        ) : filtered.length === 0 ? (
          <EmptyState
            icon={Activity}
            title={filtersActive ? "No events match these filters" : "No audit events recorded yet"}
            description={
              filtersActive
                ? "Try widening the date range or clearing the event-type filter."
                : "Scan activity, remediation approvals and connector syncs will appear here as they happen."
            }
            action={
              filtersActive ? (
                <button
                  onClick={clearFilters}
                  className="px-4 py-2 text-sm font-medium bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition"
                >
                  Clear filters
                </button>
              ) : undefined
            }
          />
        ) : (
          <TableWrap>
            <thead>
              <tr>
                <Th>Timestamp</Th>
                <Th>Event Type</Th>
                <Th>User</Th>
                <Th>Details</Th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((log) => (
                <Tr key={log.id}>
                  <Td className="whitespace-nowrap text-slate-500 font-mono text-xs">
                    {new Date(log.timestamp).toLocaleString("en-IN")}
                  </Td>
                  <Td>
                    <span className={`px-2.5 py-1 rounded-full text-xs font-medium ${eventTone(log.event_type)}`}>
                      {log.event_type}
                    </span>
                  </Td>
                  <Td className="text-slate-600 dark:text-slate-300">{log.user || "system"}</Td>
                  <Td className="text-slate-600 dark:text-slate-300 max-w-[520px]">
                    <span className="block truncate" title={formatDetails(log.details)}>
                      {formatDetails(log.details)}
                    </span>
                  </Td>
                </Tr>
              ))}
            </tbody>
          </TableWrap>
        )}
      </Card>
    </div>
  );
};

export default AuditLogs;
