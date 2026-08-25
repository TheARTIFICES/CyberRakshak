import { useEffect, useState } from "react";
import { AlertCircle, Download, Loader2, ShieldAlert, ShieldCheck, TrendingUp } from "lucide-react";
import KpiCard from "../components/dashboard/KpiCard";
import CardHeader from "../components/dashboard/CardHeader";
import FrameworkScoreCard from "../components/compliance/FrameworkScoreCard";
import FrameworkGapDrawer from "../components/compliance/FrameworkGapDrawer";
import ComplianceRadar from "../components/compliance/ComplianceRadar";
import { formatInrCompact } from "../components/compliance/format";
import { getComplianceEvidencePdf, getComplianceScores, type ComplianceFrameworkScore } from "../services/api";

/**
 * Compliance Center — six-framework scorecards (DPDP, SEBI CSCRF, RBI CSF,
 * ISO 27001, NIST CSF, CIS Controls v8) evaluated against enforced controls
 * (GET /api/compliance/scores), plus a formal audit evidence PDF export
 * (GET /api/compliance/export). Every score, gap, and rupee figure here is
 * computed by backend/app/compliance/framework_mapper.py — nothing is
 * hardcoded client-side.
 */
const ComplianceCenter = () => {
  const [frameworks, setFrameworks] = useState<ComplianceFrameworkScore[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [selected, setSelected] = useState<ComplianceFrameworkScore | null>(null);
  const [drawerOpen, setDrawerOpen] = useState(false);

  const [exporting, setExporting] = useState(false);
  const [exportError, setExportError] = useState<string | null>(null);

  useEffect(() => {
    const fetchScores = async () => {
      setLoading(true);
      setError(null);
      try {
        const data = await getComplianceScores();
        setFrameworks(data);
      } catch (err) {
        console.error("Failed to load compliance scores:", err);
        setError("Could not reach the compliance framework mapper.");
        setFrameworks([]);
      } finally {
        setLoading(false);
      }
    };
    fetchScores();
  }, []);

  const handleOpenFramework = (framework: ComplianceFrameworkScore) => {
    setSelected(framework);
    setDrawerOpen(true);
  };

  const handleExport = async () => {
    setExporting(true);
    setExportError(null);
    try {
      const blob = await getComplianceEvidencePdf();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = "CyberRakshak_Audit_Evidence_Pack.pdf";
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (err) {
      console.error("Failed to export audit evidence pack:", err);
      setExportError("Export failed — the audit evidence generator may be unavailable.");
    } finally {
      setExporting(false);
    }
  };

  const totalPenaltyExposure = frameworks.reduce((sum, f) => sum + f.regulatory_penalty_exposure_inr, 0);
  const totalGaps = frameworks.reduce((sum, f) => sum + f.gap_count, 0);
  const avgScore = frameworks.length
    ? frameworks.reduce((sum, f) => sum + f.score, 0) / frameworks.length
    : 0;
  const belowThreshold = frameworks.filter((f) => f.score < 70).length;

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-2xl font-bold">Compliance Center</h1>
          <p className="opacity-70 text-sm">
            Framework-mapped control posture and audit-ready evidence export across six Indian and international
            regulatory regimes.
          </p>
        </div>
        <button
          onClick={handleExport}
          disabled={exporting || loading}
          className="inline-flex items-center gap-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white rounded-lg shadow transition text-sm font-medium"
        >
          {exporting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Download className="w-4 h-4" />}
          {exporting ? "Generating…" : "Export Audit Evidence Pack"}
        </button>
      </div>

      {exportError && (
        <div className="flex items-center gap-2 text-sm text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-950/30 rounded-lg px-4 py-2">
          <AlertCircle className="w-4 h-4 flex-shrink-0" />
          {exportError}
        </div>
      )}

      {!loading && error && (
        <div className="bg-white dark:bg-slate-800 shadow rounded-xl p-10 flex flex-col items-center text-center gap-2">
          <AlertCircle className="w-8 h-8 text-amber-500" />
          <p className="text-sm text-slate-500 max-w-sm">{error}</p>
        </div>
      )}

      {!error && (
        <>
          <section className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <KpiCard
              title="Average Compliance Score"
              value={loading ? "…" : `${avgScore.toFixed(0)}%`}
              icon={ShieldCheck}
              color="#059669"
              tooltip="Mean of the six per-framework scores, each = (requirements with an enforced, ≥70%-effective mapped control) / (total mapped requirements)."
            />
            <KpiCard
              title="Regulatory Penalty Exposure"
              value={loading ? "…" : formatInrCompact(totalPenaltyExposure)}
              icon={ShieldAlert}
              color="#dc2626"
              tooltip="Sum across frameworks of (statutory penalty cap × gap ratio) — the rupee exposure implied by currently unmet requirements."
            />
            <KpiCard
              title="Open Gaps"
              value={loading ? "…" : totalGaps}
              icon={AlertCircle}
              color="#d97706"
              tooltip="Total unmet requirements across all six frameworks combined."
            />
            <KpiCard
              title="Frameworks Below 70%"
              value={loading ? "…" : `${belowThreshold} / ${frameworks.length || 6}`}
              icon={TrendingUp}
              color="#7c3aed"
              tooltip="Frameworks scoring under 70% — typically the threshold auditors treat as a materially deficient control environment."
            />
          </section>

          <ComplianceRadar frameworks={frameworks} loading={loading} />

          <div>
            <CardHeader
              title="Framework Scorecards"
              tooltip="Click a framework to see its unmet requirements and the specific control each one needs. Sourced from GET /api/compliance/scores — evaluated live against every enforced AssetControl record."
            />

            {loading ? (
              <div className="h-40 flex items-center justify-center">
                <p className="text-sm text-slate-500 animate-pulse">Evaluating framework posture…</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {frameworks.map((framework) => (
                  <FrameworkScoreCard
                    key={framework.framework_name}
                    framework={framework}
                    onClick={() => handleOpenFramework(framework)}
                  />
                ))}
              </div>
            )}
          </div>
        </>
      )}

      <FrameworkGapDrawer open={drawerOpen} onClose={() => setDrawerOpen(false)} framework={selected} />
    </div>
  );
};

export default ComplianceCenter;
