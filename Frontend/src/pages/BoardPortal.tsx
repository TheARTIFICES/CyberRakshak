import { useEffect, useState } from "react";
import { AlertCircle, Landmark } from "lucide-react";
import Card from "../components/ui/Card";
import CardHeader from "../components/dashboard/CardHeader";
import PageHeader from "../components/ui/PageHeader";
import EmptyState from "../components/ui/EmptyState";
import StatBlock from "../components/ui/StatBlock";
import EALTrendChart from "../components/risk/EALTrendChart";
import BusinessUnitTable from "../components/board/BusinessUnitTable";
import ComplianceMiniScorecard from "../components/board/ComplianceMiniScorecard";
import { formatInrCompact } from "../utils/currency";
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

/**
 * Board Governance — org/BU roll-up for an executive audience.
 *
 * Deliberately differentiated from Dashboard by AUDIENCE, not by re-showing the
 * same figures: the BU comparison is the primary above-the-fold content, the
 * trend chart renders in its reduced `compact` variant, and there is no
 * asset-level or CVE-level table anywhere on this page (that detail lives on
 * Dashboard → Top Risk Drivers and on Vulnerabilities).
 */
const BoardPortal = () => {
  const [orgs, setOrgs] = useState<Organization[]>([]);
  const [selectedOrgId, setSelectedOrgId] = useState<string>("");
  const [orgsLoading, setOrgsLoading] = useState(true);

  const [exposure, setExposure] = useState<RiskExposure | null>(null);
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
      setExposureError(null);
      try {
        setExposure(await getRiskExposure());
      } catch (err) {
        console.error("Failed to load risk exposure:", err);
        setExposureError("Could not reach the risk quantification engine.");
        setExposure(null);
      }
    };
    fetchExposure();
  }, []);

  useEffect(() => {
    const fetchUnits = async () => {
      setUnitsLoading(true);
      try {
        setUnits(await getBusinessUnits(selectedOrgId || undefined));
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
        setFrameworks(await getComplianceScores());
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
      <PageHeader
        title="Board Portal"
        subtitle="Organization-level financial risk roll-up and governance posture for board and audit-committee reporting."
        action={
          !orgsLoading && orgs.length > 0 ? (
            <div className="flex items-center gap-2">
              <Landmark className="w-4 h-4 text-slate-500" />
              <select
                value={selectedOrgId}
                onChange={(e) => setSelectedOrgId(e.target.value)}
                aria-label="Select organization"
                className="bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-600 rounded-lg px-3 py-1.5 text-sm"
              >
                {orgs.map((org) => (
                  <option key={org.id} value={org.id}>
                    {org.name}
                  </option>
                ))}
              </select>
            </div>
          ) : undefined
        }
      />

      {exposureError && (
        <div className="flex items-center gap-2 text-sm text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-950/30 rounded-lg px-4 py-2">
          <AlertCircle className="w-4 h-4 flex-shrink-0" />
          {exposureError}
        </div>
      )}

      {/* PRIMARY: business-unit comparison — the board's first question is
          "which part of the organization drives our exposure?" */}
      <Card>
        <CardHeader
          title="Business Unit Risk Comparison"
          tooltip="Per-business-unit exposure ranking. Business unit registry is live from GET /api/bu; the financial columns await backend org/BU scope filtering."
        />
        <BusinessUnitTable units={units} loading={unitsLoading} />
      </Card>

      {/* Org-wide context, stated once, in a board register rather than as a
          repeat of Dashboard's KPI row. */}
      <Card>
        <CardHeader
          title="Organization Position"
          tooltip="The consolidated org-wide figures the board signs off against, from the latest FAIR risk snapshot (GET /api/risk/exposure)."
        />
        {exposure ? (
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
            <StatBlock label="Expected Annual Loss" value={formatInrCompact(exposure.expected_annual_loss_inr)} tone="risk" />
            <StatBlock label="Value at Risk (95%)" value={formatInrCompact(exposure.var_95_inr)} tone="var" />
            <StatBlock label="Enterprise Risk Score" value={`${exposure.enterprise_risk_score}/100`} tone="positive" />
            <StatBlock label="Monitored Assets" value={exposure.monitored_assets_count} />
          </div>
        ) : (
          <EmptyState size="sm" title="Organization position unavailable" />
        )}
      </Card>

      {/* Reduced trend read — no analyst controls or growth-rate detail. */}
      <EALTrendChart variant="compact" title="Quarter-Ahead Loss Trajectory" />

      <Card>
        <CardHeader
          title="Compliance Posture at a Glance"
          tooltip="Condensed six-framework read, same scored data as Compliance & Audit (GET /api/compliance/scores). Open that screen for gap-level detail."
        />
        <ComplianceMiniScorecard frameworks={frameworks} loading={frameworksLoading} />
      </Card>
    </div>
  );
};

export default BoardPortal;
