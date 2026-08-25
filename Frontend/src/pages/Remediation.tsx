import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { AlertCircle, ArrowRight, ScanLine, ShieldCheck, Wallet, Wrench } from "lucide-react";
import Card from "../components/ui/Card";
import CardHeader from "../components/dashboard/CardHeader";
import PageHeader from "../components/ui/PageHeader";
import EmptyState from "../components/ui/EmptyState";
import StatBlock from "../components/ui/StatBlock";
import { formatInrCompact } from "../utils/currency";
import {
  getJobHistory,
  getRemediationPlan,
  runCapitalAllocation,
  type RemediationStep,
} from "../services/api";

const SEVERITY_BORDER: Record<string, string> = {
  critical: "border-l-red-500",
  high: "border-l-orange-500",
  medium: "border-l-yellow-500",
  low: "border-l-blue-500",
};

const SEVERITY_BADGE: Record<string, string> = {
  critical: "bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-300",
  high: "bg-orange-100 text-orange-700 dark:bg-orange-900/40 dark:text-orange-300",
  medium: "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/40 dark:text-yellow-300",
  low: "bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300",
};

/**
 * Remediation — the real fix queue.
 *
 * Rewritten from a fully mocked page. Previously: a hardcoded five-item threat
 * queue, unitless "Risk Score: 980" figures inconsistent with the rupee framing
 * used everywhere else, a fake SYSTEM_TERMINAL that produced scripted output via
 * setTimeout, and an "Auto-Fix All Critical" button that did nothing.
 *
 * The terminal is removed outright rather than badged: it presented as remote
 * command execution against a live host on a security product, which is the
 * single most misleading element to put in front of a judge. Nothing real was
 * lost — it executed no command and displayed no command output.
 *
 * The queue is now the real remediation plan for the latest completed scan
 * (GET /remediation/{job_id}), and each item is priced in rupees by joining its
 * CVE against the optimizer's mitigation candidates (POST /investment/optimize),
 * so this page speaks the same financial language as the rest of the platform.
 */
const Remediation = () => {
  const [steps, setSteps] = useState<RemediationStep[]>([]);
  const [valueByCve, setValueByCve] = useState<Record<string, number>>({});
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [noScan, setNoScan] = useState(false);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      setError(null);
      setNoScan(false);
      try {
        const jobs = await getJobHistory(0, 20);
        const latest = jobs.find((j) => j.status === "completed" || j.status === "partial_success");
        if (!latest) {
          setNoScan(true);
          setSteps([]);
          return;
        }

        const plan = await getRemediationPlan(latest.job_id);
        setSteps(plan);

        // Price each finding using the optimizer's own candidate actions. A very
        // high ceiling is used so every candidate is returned, not just a funded
        // subset — this is a lookup, not an allocation decision.
        try {
          const allocation = await runCapitalAllocation(10_000_000_000);
          const map: Record<string, number> = {};
          allocation.selected_actions.forEach((a) => {
            if (a.cve_id) map[a.cve_id] = a.estimated_reduction_inr;
          });
          setValueByCve(map);
        } catch (valueErr) {
          console.error("Could not price remediation steps:", valueErr);
        }
      } catch (err) {
        console.error("Failed to load remediation plan:", err);
        setError("Could not load the remediation plan.");
        setSteps([]);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  const totalQuantified = useMemo(
    () => steps.reduce((sum, s) => sum + (valueByCve[s.cve] ?? 0), 0),
    [steps, valueByCve]
  );
  const criticalCount = steps.filter((s) => s.severity?.toLowerCase() === "critical").length;
  const selected = steps[selectedIndex];

  return (
    <div className="space-y-6">
      <PageHeader
        title="Remediation"
        subtitle="Prioritised fix queue for the latest completed scan, with the modeled loss reduction of each fix."
        action={
          <Link
            to="/investment-actions"
            className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg shadow transition text-sm font-medium"
          >
            <Wallet className="w-4 h-4" />
            Fund fixes in Investment Board
          </Link>
        }
      />

      {error && (
        <div className="flex items-center gap-2 text-sm text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-950/30 rounded-lg px-4 py-2">
          <AlertCircle className="w-4 h-4 flex-shrink-0" />
          {error}
        </div>
      )}

      {loading ? (
        <Card>
          <p className="text-sm text-slate-500 animate-pulse py-16 text-center">Loading remediation plan…</p>
        </Card>
      ) : noScan ? (
        <Card>
          <EmptyState
            icon={ScanLine}
            title="No scan data yet"
            description="The remediation queue is built from a completed scan's findings. Run a scan to generate a prioritised fix plan."
            action={
              <Link
                to="/scan-console"
                className="inline-flex items-center gap-1.5 px-4 py-2 text-sm font-medium bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition"
              >
                Run a scan from Scan Console
              </Link>
            }
          />
        </Card>
      ) : steps.length === 0 ? (
        <Card>
          <EmptyState icon={ShieldCheck} title="Nothing to remediate" description="The latest scan produced no actionable findings." />
        </Card>
      ) : (
        <>
          <section className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <StatBlock label="Open fixes" value={steps.length} />
            <StatBlock label="Critical severity" value={criticalCount} tone="risk" />
            <StatBlock
              label="Modeled loss reduction if fixed"
              value={totalQuantified > 0 ? formatInrCompact(totalQuantified) : "Not yet quantified"}
              tone={totalQuantified > 0 ? "positive" : "neutral"}
            />
          </section>

          <div className="grid grid-cols-12 gap-6">
            {/* Fix queue */}
            <div className="col-span-12 lg:col-span-5">
              <h2 className="text-sm font-semibold mb-3">Fix Queue</h2>
              <div className="space-y-3 max-h-[560px] overflow-y-auto pr-1">
                {steps.map((step, index) => {
                  const value = valueByCve[step.cve];
                  const sev = step.severity?.toLowerCase() ?? "low";
                  return (
                    <button
                      key={`${step.cve}-${index}`}
                      onClick={() => setSelectedIndex(index)}
                      aria-pressed={selectedIndex === index}
                      className={`w-full text-left rounded-xl transition ${
                        selectedIndex === index ? "ring-2 ring-blue-500" : "hover:ring-1 hover:ring-blue-300"
                      }`}
                    >
                      <Card className={`border-l-4 ${SEVERITY_BORDER[sev] ?? "border-l-slate-400"}`}>
                        <div className="flex items-start justify-between gap-2 mb-1.5">
                          <p className="font-semibold text-sm text-slate-800 dark:text-slate-100 leading-snug">
                            {step.title}
                          </p>
                          <span
                            className={`px-2 py-0.5 rounded-full text-[11px] font-medium flex-shrink-0 ${
                              SEVERITY_BADGE[sev] ?? "bg-slate-100 text-slate-600"
                            }`}
                          >
                            {step.severity}
                          </span>
                        </div>
                        <p className="text-xs font-mono text-slate-500">{step.cve}</p>
                        <p className="text-xs text-slate-500 mt-0.5">Asset: {step.asset}</p>

                        {/* Rupee framing, replacing the old unitless point score. */}
                        <p className="text-xs mt-2 pt-2 border-t border-slate-100 dark:border-slate-700">
                          {value ? (
                            <span className="text-emerald-600 dark:text-emerald-400 font-semibold">
                              −{formatInrCompact(value)} EAL if fixed
                            </span>
                          ) : (
                            <span className="text-slate-400">Not yet quantified</span>
                          )}
                        </p>
                      </Card>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Fix detail */}
            <div className="col-span-12 lg:col-span-7">
              <Card>
                <CardHeader
                  title="Recommended Fix"
                  tooltip="Vendor and advisory-sourced remediation guidance for the selected finding, from GET /api/remediation/{job_id}. The rupee figure is the optimizer's modeled Expected Annual Loss reduction for this CVE."
                />

                {selected ? (
                  <div className="space-y-5">
                    <div>
                      <div className="flex items-center gap-2 flex-wrap mb-1">
                        <h3 className="font-semibold">{selected.title}</h3>
                        <span
                          className={`px-2 py-0.5 rounded-full text-[11px] font-medium ${
                            SEVERITY_BADGE[selected.severity?.toLowerCase() ?? "low"] ?? "bg-slate-100 text-slate-600"
                          }`}
                        >
                          {selected.severity}
                        </span>
                      </div>
                      <p className="text-xs font-mono text-slate-500">{selected.cve}</p>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <StatBlock label="Affected asset" value={<span className="text-sm">{selected.asset}</span>} />
                      <StatBlock
                        label="Loss reduction if fixed"
                        value={
                          valueByCve[selected.cve]
                            ? formatInrCompact(valueByCve[selected.cve])
                            : "Not yet quantified"
                        }
                        tone={valueByCve[selected.cve] ? "positive" : "neutral"}
                      />
                    </div>

                    <div>
                      <p className="text-[11px] uppercase tracking-wide text-slate-500 mb-2 flex items-center gap-1.5">
                        <Wrench className="w-3.5 h-3.5" />
                        Remediation action
                      </p>
                      <div className="rounded-lg bg-slate-50 dark:bg-slate-900/60 p-4 text-sm text-slate-700 dark:text-slate-200 leading-relaxed whitespace-pre-wrap">
                        {selected.action}
                      </div>
                      {selected.source && (
                        <p className="text-xs text-slate-500 mt-2">Source: {selected.source}</p>
                      )}
                    </div>

                    <div className="pt-3 border-t border-slate-100 dark:border-slate-700">
                      <Link
                        to="/investment-actions"
                        className="inline-flex items-center gap-1.5 text-sm font-medium text-blue-600 dark:text-blue-400 hover:underline"
                      >
                        Approve and track this fix on the Investment Action Board
                        <ArrowRight className="w-3.5 h-3.5" />
                      </Link>
                    </div>
                  </div>
                ) : (
                  <EmptyState size="sm" title="Select a finding from the queue" />
                )}
              </Card>
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default Remediation;
