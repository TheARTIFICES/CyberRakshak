import { useEffect, useState } from "react";
import { AlertCircle, ScanLine, TrendingUp } from "lucide-react";
import { Link } from "react-router-dom";
import Card from "../ui/Card";
import CardHeader from "./CardHeader";
import EmptyState from "../ui/EmptyState";
import { TableWrap, Td, Th, Tr } from "../ui/DataTable";
import { formatInrCompact } from "../../utils/currency";
import { getRiskExposure, getRiskProvenance, type RiskDriverNode } from "../../services/api";

/**
 * Top Risk Drivers — asset / CVE / rupee-contribution breakdown.
 *
 * This is the Dashboard's analyst-facing differentiator: it answers "which
 * specific findings make up our EAL", which no other screen showed. Sourced
 * from the existing GET /risk/provenance/{snapshot_id} tree (the finding-level
 * nodes), reached via the snapshot_id on GET /risk/exposure.
 *
 * Deliberately NOT on Board Governance — finding-level detail is the analyst's
 * job, not the board's.
 */
const TopRiskDrivers = () => {
  const [drivers, setDrivers] = useState<RiskDriverNode[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [noSnapshot, setNoSnapshot] = useState(false);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      setError(null);
      setNoSnapshot(false);
      try {
        const exposure = await getRiskExposure();

        // No persisted snapshot yet => /risk/exposure served its baseline shape
        // without a snapshot_id, so there is no provenance tree to read.
        if (!exposure.snapshot_id) {
          setNoSnapshot(true);
          setDrivers([]);
          return;
        }

        const provenance = await getRiskProvenance(exposure.snapshot_id);
        const findings = provenance.drivers
          .filter((d) => d.level === "finding" && d.contribution_inr > 0)
          .sort((a, b) => b.contribution_inr - a.contribution_inr)
          .slice(0, 8);
        setDrivers(findings);
      } catch (err) {
        console.error("Failed to load risk drivers:", err);
        setError("Could not load the risk provenance tree.");
        setDrivers([]);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  const totalContribution = drivers.reduce((sum, d) => sum + d.contribution_inr, 0);

  return (
    <Card>
      <CardHeader
        title="Top Risk Drivers"
        tooltip="The individual findings contributing most to Expected Annual Loss, read from the hierarchical provenance tree (GET /api/risk/provenance/{snapshot_id}). Every rupee figure here is traceable to a specific finding on a specific asset — this is the analyst-level breakdown behind the headline EAL."
      />

      {loading ? (
        <p className="text-sm text-slate-500 animate-pulse py-10 text-center">Loading risk drivers…</p>
      ) : error ? (
        <EmptyState icon={AlertCircle} tone="error" size="sm" title="Provenance unavailable" description={error} />
      ) : noSnapshot ? (
        <EmptyState
          icon={ScanLine}
          size="sm"
          title="No scan data yet"
          description="Risk drivers are derived from a completed scan's provenance tree."
          action={
            <Link
              to="/scan-console"
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium bg-blue-600 hover:bg-blue-700 text-white rounded-md transition"
            >
              Go to Scan Console
            </Link>
          }
        />
      ) : drivers.length === 0 ? (
        <EmptyState
          icon={TrendingUp}
          size="sm"
          title="No finding-level drivers"
          description="The latest snapshot has no finding nodes contributing measurable loss."
        />
      ) : (
        <>
          <TableWrap>
            <thead>
              <tr>
                <Th>Finding</Th>
                <Th>CVE</Th>
                <Th align="right">CVSS</Th>
                <Th align="right">EAL Contribution</Th>
                <Th align="right">Share</Th>
              </tr>
            </thead>
            <tbody>
              {drivers.map((driver) => {
                const share = totalContribution > 0 ? (driver.contribution_inr / totalContribution) * 100 : 0;
                return (
                  <Tr key={driver.id}>
                    <Td className="font-medium text-slate-800 dark:text-slate-100 max-w-[280px] truncate">
                      <span title={driver.label}>{driver.label}</span>
                    </Td>
                    <Td className="font-mono text-xs opacity-80">{driver.cve_id ?? "—"}</Td>
                    <Td align="right">{driver.cvss_score != null ? driver.cvss_score.toFixed(1) : "—"}</Td>
                    <Td align="right" className="font-semibold text-red-600 dark:text-red-400">
                      {formatInrCompact(driver.contribution_inr)}
                    </Td>
                    <Td align="right">
                      <div className="flex items-center justify-end gap-2">
                        <div className="w-16 h-1.5 rounded-full bg-slate-100 dark:bg-slate-700 overflow-hidden">
                          <div className="h-full bg-red-500 rounded-full" style={{ width: `${Math.min(100, share)}%` }} />
                        </div>
                        <span className="text-xs text-slate-500 w-10 text-right">{share.toFixed(0)}%</span>
                      </div>
                    </Td>
                  </Tr>
                );
              })}
            </tbody>
          </TableWrap>

          <p className="text-xs text-slate-500 mt-3">
            Top {drivers.length} findings account for {formatInrCompact(totalContribution)} of modeled annual loss.
          </p>
        </>
      )}
    </Card>
  );
};

export default TopRiskDrivers;
