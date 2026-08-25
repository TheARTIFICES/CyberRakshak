import { AlertTriangle, Building2, Minus } from "lucide-react";
import type { BusinessUnit } from "../../services/api";
import EmptyState from "../ui/EmptyState";
import { TableWrap, Td, Th, Tr } from "../ui/DataTable";

interface Props {
  units: BusinessUnit[];
  loading: boolean;
}

const CRITICALITY_CLASSES: Record<string, string> = {
  Critical: "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400",
  High: "bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400",
  Medium: "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400",
  Low: "bg-slate-100 text-slate-600 dark:bg-slate-700 dark:text-slate-300",
};

/**
 * Board Governance's primary above-the-fold content: per-BU risk comparison.
 *
 * The EAL / VaR / trend columns are rendered but not populated. GET
 * /risk/exposure and GET /risk/forecast take no scope/bu_id parameter, so
 * every business unit would resolve to the identical org-wide figure — a
 * ranked comparison built on that would be fabricated, not measured. The
 * columns stay visible (so the intended board read is obvious, and so wiring
 * them is a one-line change once scope filtering ships) but each cell is an
 * explicit em-dash rather than a plausible-looking number.
 */
const BusinessUnitTable = ({ units, loading }: Props) => {
  if (loading) {
    return <p className="text-sm text-slate-500 animate-pulse py-10 text-center">Loading business units…</p>;
  }

  if (units.length === 0) {
    return (
      <EmptyState
        icon={Building2}
        size="sm"
        title="No business units registered"
        description="Register business units to compare risk exposure across the organization."
      />
    );
  }

  return (
    <>
      <TableWrap>
        <thead>
          <tr>
            <Th>Business Unit</Th>
            <Th>Criticality</Th>
            <Th align="right">Revenue Share</Th>
            <Th align="right">Expected Annual Loss</Th>
            <Th align="right">Value at Risk (95%)</Th>
            <Th align="center">Trend</Th>
          </tr>
        </thead>
        <tbody>
          {units.map((bu) => (
            <Tr key={bu.id}>
              <Td className="font-medium text-slate-800 dark:text-slate-100">{bu.name}</Td>
              <Td>
                <span
                  className={`px-2.5 py-1 rounded-full text-xs font-medium ${
                    CRITICALITY_CLASSES[bu.criticality] ?? "bg-slate-100 text-slate-600"
                  }`}
                >
                  {bu.criticality}
                </span>
              </Td>
              <Td align="right">{(bu.revenue_share * 100).toFixed(0)}%</Td>
              <Td align="right" className="text-slate-400 dark:text-slate-500" title="Awaiting org/BU scope filtering">
                —
              </Td>
              <Td align="right" className="text-slate-400 dark:text-slate-500" title="Awaiting org/BU scope filtering">
                —
              </Td>
              <Td align="center">
                <Minus className="w-4 h-4 text-slate-300 dark:text-slate-600 inline" aria-label="No trend data" />
              </Td>
            </Tr>
          ))}
        </tbody>
      </TableWrap>

      <div className="flex items-start gap-2 mt-4 px-3 py-2.5 rounded-lg bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-900 text-xs text-amber-800 dark:text-amber-300">
        <AlertTriangle className="w-4 h-4 flex-shrink-0 mt-0.5" />
        <span>
          Per-BU financial columns are pending backend scope filtering —{" "}
          <code className="font-mono">GET /risk/exposure</code> and <code className="font-mono">GET /risk/forecast</code>{" "}
          accept no <code className="font-mono">scope</code>/<code className="font-mono">bu_id</code> parameter yet, so
          every unit would show the same org-wide figure. Left blank rather than filled with a number that would read as
          measured.
        </span>
      </div>
    </>
  );
};

export default BusinessUnitTable;
