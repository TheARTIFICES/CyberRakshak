import { Landmark, TrendingUp } from "lucide-react";

/**
 * Board Portal — org -> business-unit EAL/VaR rollup, cross-BU comparison,
 * board-ready trend charts. Read-only, no drill-down to raw findings
 * (that's the Analyst Console's job).
 *
 * Status: SCAFFOLD. Blocked on:
 *   - backend/app/org/            (Organization/BusinessUnit schema — Roadmap Phase 1)
 *   - backend/app/risk/           (EAL/VaR computation — Roadmap Phase 2)
 * Target endpoints once live: GET /api/eal?scope=bu, GET /api/compliance/score
 * See docs/audits/gap-audit.md, Roadmap Phase 8.
 */
const BoardPortal = () => {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Board Portal</h1>
        <p className="opacity-70 text-sm">
          Organization-level financial risk trend and business-unit comparison for board and audit-committee reporting.
        </p>
      </div>

      <div className="bg-white dark:bg-slate-800 rounded-xl shadow p-10 flex flex-col items-center text-center gap-3">
        <Landmark className="w-10 h-10 text-blue-500" />
        <h2 className="text-lg font-semibold">Awaiting the FAIR risk engine and Organization schema</h2>
        <p className="text-sm opacity-70 max-w-md">
          This screen will show Expected Annual Loss and Value-at-Risk trends per business unit once{" "}
          <code className="font-mono text-xs bg-slate-100 dark:bg-slate-900 px-1.5 py-0.5 rounded">
            backend/app/risk/
          </code>{" "}
          and{" "}
          <code className="font-mono text-xs bg-slate-100 dark:bg-slate-900 px-1.5 py-0.5 rounded">
            backend/app/org/
          </code>{" "}
          are implemented (Roadmap Phases 1–2, 8). No mock data is shown here deliberately — a board screen
          showing fabricated numbers is worse than an honest placeholder.
        </p>
        <div className="flex items-center gap-2 text-xs text-blue-600 dark:text-cyan-400 mt-2">
          <TrendingUp className="w-4 h-4" />
          <span>Tracked in docs/audits/gap-audit.md — Roadmap Phase 8</span>
        </div>
      </div>
    </div>
  );
};

export default BoardPortal;
