import { FlaskConical, GitCompareArrows } from "lucide-react";

/**
 * Scenario Simulator — before/after EAL & VaR comparison for named
 * what-if scenarios (MFA rollout, patch deployment, segmentation, delayed
 * remediation, new campaign). Must call the same FAIR engine as the live
 * dashboard with overridden parameters, never a parallel calculation.
 *
 * Status: SCAFFOLD. Blocked on:
 *   - backend/app/risk/            (Roadmap Phase 2)
 *   - backend/app/simulation/      (Roadmap Phase 5)
 * Target endpoint once live: POST /api/simulation/run
 * See docs/audits/gap-audit.md, Roadmap Phase 8.
 */
const ScenarioSimulator = () => {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Scenario Simulator</h1>
        <p className="opacity-70 text-sm">
          Model the financial impact of a proposed change before committing budget to it.
        </p>
      </div>

      <div className="bg-white dark:bg-slate-800 rounded-xl shadow p-10 flex flex-col items-center text-center gap-3">
        <FlaskConical className="w-10 h-10 text-purple-500" />
        <h2 className="text-lg font-semibold">Awaiting the FAIR risk engine and simulation layer</h2>
        <p className="text-sm opacity-70 max-w-md">
          Scenario presets (MFA rollout, patch deployment, network segmentation, delayed remediation, a new
          campaign) will run against{" "}
          <code className="font-mono text-xs bg-slate-100 dark:bg-slate-900 px-1.5 py-0.5 rounded">
            backend/app/risk/engine.py
          </code>{" "}
          with overridden parameters once implemented — by construction, the same function the live dashboard
          calls, so this screen's numbers can never disagree with it.
        </p>
        <div className="flex items-center gap-2 text-xs text-purple-600 dark:text-purple-400 mt-2">
          <GitCompareArrows className="w-4 h-4" />
          <span>Tracked in docs/audits/gap-audit.md — Roadmap Phases 2, 5, 8</span>
        </div>
      </div>
    </div>
  );
};

export default ScenarioSimulator;
