import { useEffect, useState } from "react";
import { AlertCircle, AlertTriangle, Building2, Landmark, ShieldCheck, TrendingUp, Wallet } from "lucide-react";
import KpiCard from "../components/dashboard/KpiCard";
import CardHeader from "../components/dashboard/CardHeader";
import EALTrendChart from "../components/risk/EALTrendChart";
import BusinessUnitTable from "../components/board/BusinessUnitTable";
import ComplianceMiniScorecard from "../components/board/ComplianceMiniScorecard";
import {
  getBusinessUnits,
  getComplianceScores,
  getOrganizations,
  getRiskExposure,
  type BusinessUnit,
  type ComplianceFrameworkScore,
  type Organization,
  type RiskExposure,
} from "../services/api";
import { formatInrCompact } from "../utils/currency";

/**
 * Board Portal — org-level financial risk rollup for a board member or CFO.
 * Read-only, no drill-down to raw findings (that's the Analyst Console's job).
 *
 * Org/BU-scoped EAL ranking is NOT yet possible: GET /risk/exposure and
 * GET /risk/forecast have no scope/bu_id parameter (backend/app/api.py),
 * so the BU comparison chart specified in FRONTEND_ROADMAP.md §2 cannot be
 * built honestly today. This screen ships everything that IS real —
 * org-wide EAL/VaR/trend, the BU registry, and a compliance rollup — and
 * flags the one blocked piece explicitly rather than faking a ranking.
 */
const BoardPortal = () => {
  const [orgs, setOrgs] = useState<Organization[]>([]);
  const [selectedOrgId, setSelectedOrgId] = useState<string>("");
  const [orgsLoading, setOrgsLoading] = useState(true);

  const [exposure, setExposure] = useState<RiskExposure | null>(null);
  const [exposureLoading, setExposureLoading] = useState(true);
  const [exposureError, setExposureError] = useState<string | null>(null);

  const [units, setUnits] = useState<BusinessUnit[]>([]);
  const [unitsLoading, setUnitsLoading] = useState(true);

  const [frameworks, setFrameworks] = useState<ComplianceFrameworkScore[]>([]);
  const [frameworksLoading, setFrameworksLoading] = useState(true);

  useEffect(() => {
    const fetchOrgs = async () => {
      setOrgsLoading(true);
      try {
        const data = await getOrganizations();
        setOrgs(data);
        if (data.length > 0) setSelectedOrgId(data[0].id);
      } catch (err) {
        console.error("Failed to load organizations:", err);
        setOrgs([]);
      } finally {
        setOrgsLoading(false);
      }
    };
    fetchOrgs();
  }, []);

  useEffect(() => {
    const fetchExposure = async () => {
      setExposureLoading(true);
      setExposureError(null);
      try {
        const data = await getRiskExposure();
        setExposure(data);
      } catch (err) {
        console.error("Failed to load risk exposure:", err);
        setExposureError("Could not reach the risk quantification engine.");
        setExposure(null);
      } finally {
        setExposureLoading(false);
      }
    };
    fetchExposure();
  }, []);

  useEffect(() => {
    const fetchUnits = async () => {
      setUnitsLoading(true);
      try {
        const data = await getBusinessUnits(selectedOrgId || undefined);
        setUnits(data);
      } catch (err) {
        console.error("Failed to load business units:", err);
        setUnits([]);
      } finally {
        setUnitsLoading(false);
      }
    };
    if (selectedOrgId || !orgsLoading) fetchUnits();
  }, [selectedOrgId, orgsLoading]);

  useEffect(() => {
    const fetchFrameworks = async () => {
      setFrameworksLoading(true);
      try {
        const data = await getComplianceScores();
        setFrameworks(data);
      } catch (err) {
        console.error("Failed to load compliance scores:", err);
        setFrameworks([]);
      } finally {
        setFrameworksLoading(false);
      }
    };
    fetchFrameworks();
  }, []);

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-2xl font-bold">Board Portal</h1>
          <p className="opacity-70 text-sm">
            Organization-level financial risk trend and governance posture for board and audit-committee reporting.
          </p>
        </div>

        {!orgsLoading && orgs.length > 0 && (
          <div className="flex items-center gap-2">
            <Landmark className="w-4 h-4 text-slate-500" />
            <select
              value={selectedOrgId}
              onChange={(e) => setSelectedOrgId(e.target.value)}
              className="bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-600 rounded-lg px-3 py-1.5 text-sm"
            >
              {orgs.map((org) => (
                <option key={org.id} value={org.id}>
                  {org.name}
                </option>
              ))}
            </select>
          </div>
        )}
      </div>

      {!exposureLoading && exposureError && (
        <div className="bg-white dark:bg-slate-800 shadow rounded-xl p-10 flex flex-col items-center text-center gap-2">
          <AlertCircle className="w-8 h-8 text-amber-500" />
          <p className="text-sm text-slate-500 max-w-sm">{exposureError}</p>
        </div>
      )}

      {!exposureError && (
        <>
          <section className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <KpiCard
              title="Expected Annual Loss"
              value={exposureLoading ? "…" : formatInrCompact(exposure?.expected_annual_loss_inr ?? 0)}
              icon={Wallet}
              color="#dc2626"
              tooltip="Org-wide Expected Annual Loss from the latest FAIR risk snapshot."
            />
            <KpiCard
              title="Value at Risk (95%)"
              value={exposureLoading ? "…" : formatInrCompact(exposure?.var_95_inr ?? 0)}
              icon={TrendingUp}
              color="#7c3aed"
              tooltip="95th-percentile annual loss from the Monte Carlo simulation — the board's tail-risk number."
            />
            <KpiCard
              title="Enterprise Risk Score"
              value={exposureLoading ? "…" : `${exposure?.enterprise_risk_score ?? 0}/100`}
              icon={ShieldCheck}
              color="#059669"
              tooltip="Composite 0–100 posture score (100 = pristine). See DOCUMENTATION.md §7."
            />
            <KpiCard
              title="Business Units"
              value={unitsLoading ? "…" : units.length}
              icon={Building2}
              color="#0891b2"
              tooltip="Registered business units under the selected organization."
            />
          </section>

          <EALTrendChart />

          <div className="bg-white dark:bg-slate-800 shadow rounded-xl p-6">
            <CardHeader
              title="Business Unit Registry"
              tooltip="Sourced from GET /api/bu. Per-BU EAL ranking is not shown — see the notice below."
            />

            <div className="flex items-start gap-2 mb-4 px-3 py-2.5 rounded-lg bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-900 text-xs text-amber-800 dark:text-amber-300">
              <AlertTriangle className="w-4 h-4 flex-shrink-0 mt-0.5" />
              <span>
                Per-BU EAL ranking (the chart FRONTEND_ROADMAP.md §2 specifies) is blocked: <code className="font-mono">GET /risk/exposure</code> and{" "}
                <code className="font-mono">GET /risk/forecast</code> have no <code className="font-mono">scope</code>/<code className="font-mono">bu_id</code>{" "}
                parameter yet. Every BU currently shares the same org-wide EAL figure above, so a ranked comparison would be
                fabricated, not measured — it ships once Phase 1's scope filtering lands.
              </span>
            </div>

            <BusinessUnitTable units={units} loading={unitsLoading} />
          </div>

          <div className="bg-white dark:bg-slate-800 shadow rounded-xl p-6">
            <CardHeader
              title="Governance & Compliance Rollup"
              tooltip="Same scored data as the Compliance Center (GET /api/compliance/scores), condensed for a board audience. Open the Compliance Center for gap-level detail."
            />
            <ComplianceMiniScorecard frameworks={frameworks} loading={frameworksLoading} />
          </div>
        </>
      )}
    </div>
  );
};

export default BoardPortal;
