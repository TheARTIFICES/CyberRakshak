import { useCallback, useEffect, useMemo, useState } from "react";
import { AlertCircle, Banknote, PieChart, TrendingUp, Wallet } from "lucide-react";
import KpiCard from "../components/dashboard/KpiCard";
import CardHeader from "../components/dashboard/CardHeader";
import SpendCurveChart from "../components/risk/SpendCurveChart";
import BudgetControlPanel from "../components/investment/BudgetControlPanel";
import ActionBoardTable, { type BoardRow } from "../components/investment/ActionBoardTable";
import ActionOutcomeDrawer from "../components/investment/ActionOutcomeDrawer";
import { formatInrCompact, formatPct } from "../components/investment/format";
import {
  approveMitigationAction,
  getMitigationOutcome,
  markActionRemediated,
  runCapitalAllocation,
  type MitigationActionCandidate,
  type MitigationOutcome,
  type MitigationStatus,
  type OptimizeResponse,
} from "../services/api";

const DEFAULT_BUDGET_INR = 2_000_000;
const DEBOUNCE_MS = 450;

/**
 * Investment Action Board — the PuLP capital allocator's selected mitigation
 * actions, rendered as a working board: pin mandatory controls, re-solve
 * against a budget, then push each funded action through its real
 * approve -> remediate -> (rescan) -> verify lifecycle against the backend
 * state machine in backend/app/models.py::MitigationStatus.
 */
const InvestmentActionBoard = () => {
  const [budget, setBudget] = useState<number>(DEFAULT_BUDGET_INR);
  const [debouncedBudget, setDebouncedBudget] = useState<number>(DEFAULT_BUDGET_INR);
  const [mandatoryIds, setMandatoryIds] = useState<Set<string>>(new Set());

  const [optimizeResult, setOptimizeResult] = useState<OptimizeResponse | null>(null);
  const [statuses, setStatuses] = useState<Record<string, MitigationStatus | "unknown">>({});
  const [mutating, setMutating] = useState<Record<string, boolean>>({});
  const [rowErrors, setRowErrors] = useState<Record<string, string | null>>({});

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [drawerOpen, setDrawerOpen] = useState(false);
  const [drawerLoading, setDrawerLoading] = useState(false);
  const [drawerOutcome, setDrawerOutcome] = useState<MitigationOutcome | null>(null);

  // Debounce budget input so free typing doesn't fire an optimizer solve per keystroke.
  useEffect(() => {
    const handle = setTimeout(() => setDebouncedBudget(budget), DEBOUNCE_MS);
    return () => clearTimeout(handle);
  }, [budget]);

  const resolveStatuses = useCallback(async (candidates: MitigationActionCandidate[]) => {
    const entries = await Promise.all(
      candidates.map(async (c) => {
        try {
          const outcome = await getMitigationOutcome(c.id);
          return [c.id, outcome.status] as const;
        } catch {
          // Sample fallback candidates (act-1, act-2...) have no live DB row / valid UUID yet.
          return [c.id, "unknown"] as const;
        }
      })
    );
    setStatuses(Object.fromEntries(entries));
  }, []);

  const fetchAllocation = useCallback(
    async (budgetInr: number, mandatory: Set<string>) => {
      setLoading(true);
      setError(null);
      try {
        const result = await runCapitalAllocation(budgetInr, Array.from(mandatory));
        setOptimizeResult(result);
        await resolveStatuses(result.selected_actions);
      } catch (err) {
        console.error("Failed to run capital allocation:", err);
        setError("Could not reach the capital allocation optimizer. The MILP solver may be unavailable.");
        setOptimizeResult(null);
        setStatuses({});
      } finally {
        setLoading(false);
      }
    },
    [resolveStatuses]
  );

  useEffect(() => {
    fetchAllocation(debouncedBudget, mandatoryIds);
  }, [debouncedBudget, mandatoryIds, fetchAllocation]);

  const handleTogglePin = (id: string) => {
    setMandatoryIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const runMutation = async (id: string, action: () => Promise<{ status: string }>) => {
    setMutating((prev) => ({ ...prev, [id]: true }));
    setRowErrors((prev) => ({ ...prev, [id]: null }));
    try {
      const updated = await action();
      setStatuses((prev) => ({ ...prev, [id]: updated.status as MitigationStatus }));
    } catch (err) {
      console.error(`Lifecycle transition failed for ${id}:`, err);
      setRowErrors((prev) => ({
        ...prev,
        [id]: "Transition rejected by the backend state machine — try refreshing.",
      }));
    } finally {
      setMutating((prev) => ({ ...prev, [id]: false }));
    }
  };

  const handleApprove = (id: string) => runMutation(id, () => approveMitigationAction(id));
  const handleRemediate = (id: string) => runMutation(id, () => markActionRemediated(id));

  const handleViewOutcome = async (id: string) => {
    setDrawerOpen(true);
    setDrawerLoading(true);
    setDrawerOutcome(null);
    try {
      const outcome = await getMitigationOutcome(id);
      setDrawerOutcome(outcome);
    } catch (err) {
      console.error(`Failed to load outcome for ${id}:`, err);
      setDrawerOutcome(null);
    } finally {
      setDrawerLoading(false);
    }
  };

  const rows: BoardRow[] = useMemo(() => {
    if (!optimizeResult) return [];
    return optimizeResult.selected_actions.map((c) => ({
      id: c.id,
      title: c.title,
      action_type: c.action_type,
      cve_id: c.cve_id,
      estimated_cost_inr: c.estimated_cost_inr,
      estimated_reduction_inr: c.estimated_reduction_inr,
      estimated_rosi: c.estimated_rosi,
      status: statuses[c.id] ?? "unknown",
      isPinned: mandatoryIds.has(c.id),
      mutating: !!mutating[c.id],
      error: rowErrors[c.id] ?? null,
    }));
  }, [optimizeResult, statuses, mandatoryIds, mutating, rowErrors]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Investment Action Board</h1>
        <p className="opacity-70 text-sm">
          The PuLP 0-1 MILP capital allocator's funded mitigation actions for the current budget — pin mandatory
          controls, then push each one through approve → remediate → verify.
        </p>
      </div>

      <BudgetControlPanel
        budget={budget}
        onBudgetChange={setBudget}
        mandatoryCount={mandatoryIds.size}
        onClearMandatory={() => setMandatoryIds(new Set())}
      />

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
              title="Budget Deployed"
              value={loading ? "…" : formatInrCompact(optimizeResult?.total_cost_inr ?? 0)}
              icon={Wallet}
              color="#0891b2"
              tooltip="Sum of estimated_cost_inr across every action the solver selected within this budget."
            />
            <KpiCard
              title="Expected Risk Reduction"
              value={loading ? "…" : formatInrCompact(optimizeResult?.total_reduction_inr ?? 0)}
              icon={TrendingUp}
              color="#059669"
              tooltip="Sum of estimated_reduction_inr — the Expected Annual Loss this allocation is projected to remove."
            />
            <KpiCard
              title="Overall ROSI"
              value={loading ? "…" : formatPct(optimizeResult?.overall_rosi ?? 0)}
              icon={PieChart}
              color="#7c3aed"
              tooltip="(Total reduction − total cost) / total cost across the funded set."
            />
            <KpiCard
              title="Budget Utilized"
              value={loading ? "…" : `${(optimizeResult?.budget_utilized_pct ?? 0).toFixed(1)}%`}
              icon={Banknote}
              color="#d97706"
              tooltip={`Solver status: ${optimizeResult?.status ?? "—"}. Budget ceiling: ${formatInrCompact(
                optimizeResult?.budget_limit_inr ?? budget
              )}.`}
            />
          </section>

          <div className="bg-white dark:bg-slate-800 shadow rounded-xl p-6">
            <CardHeader
              title="Funded Actions"
              tooltip="Actions the MILP solver selected for this budget round (POST /api/investment/optimize). Approve and remediate here to advance each action through the real closed-loop state machine."
            />

            {loading ? (
              <div className="h-48 flex items-center justify-center">
                <p className="text-sm text-slate-500 animate-pulse">Solving capital allocation…</p>
              </div>
            ) : (
              <ActionBoardTable
                rows={rows}
                onTogglePin={handleTogglePin}
                onApprove={handleApprove}
                onRemediate={handleRemediate}
                onViewOutcome={handleViewOutcome}
              />
            )}
          </div>
        </>
      )}

      <SpendCurveChart />

      <ActionOutcomeDrawer
        open={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        loading={drawerLoading}
        outcome={drawerOutcome}
      />
    </div>
  );
};

export default InvestmentActionBoard;
