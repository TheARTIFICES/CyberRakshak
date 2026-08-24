import { ShieldCheck, FileCheck2 } from "lucide-react";

const FRAMEWORKS = ["ISO 27001", "NIST CSF", "CIS Controls v8", "RBI CSF", "SEBI CSCRF", "DPDP Act 2023"];

/**
 * Compliance Center — six-framework scorecards (graded, not flat
 * checklists for RBI/SEBI specifically) plus audit-evidence export.
 *
 * Status: SCAFFOLD. Blocked on:
 *   - backend/app/compliance/      (Roadmap Phase 7)
 *   - backend/app/reports/         (audit_evidence_report.py — Roadmap Phase 7)
 * Target endpoints once live: GET /api/compliance/score, GET /api/compliance/export
 * See docs/audits/gap-audit.md, Roadmap Phase 8.
 */
const ComplianceCenter = () => {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Compliance Center</h1>
        <p className="opacity-70 text-sm">
          Framework-mapped control posture and audit-ready evidence export.
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {FRAMEWORKS.map((framework) => (
          <div
            key={framework}
            className="bg-white dark:bg-slate-800 rounded-xl shadow p-5 flex flex-col gap-2 opacity-60"
          >
            <div className="flex items-center gap-2">
              <ShieldCheck className="w-5 h-5 text-slate-400" />
              <span className="font-semibold text-sm">{framework}</span>
            </div>
            <span className="text-xs text-slate-500">Scoring pending backend/app/compliance/</span>
          </div>
        ))}
      </div>

      <div className="bg-white dark:bg-slate-800 rounded-xl shadow p-10 flex flex-col items-center text-center gap-3">
        <FileCheck2 className="w-10 h-10 text-emerald-500" />
        <h2 className="text-lg font-semibold">Awaiting the compliance framework mapper</h2>
        <p className="text-sm opacity-70 max-w-md">
          RBI CSF and SEBI CSCRF are graded/tiered frameworks, not flat checklists — this screen will not ship a
          naive controls-met percentage for either. See{" "}
          <code className="font-mono text-xs bg-slate-100 dark:bg-slate-900 px-1.5 py-0.5 rounded">
            backend/app/compliance/framework_mapper.py
          </code>{" "}
          for the modeling note driving that decision.
        </p>
      </div>
    </div>
  );
};

export default ComplianceCenter;
