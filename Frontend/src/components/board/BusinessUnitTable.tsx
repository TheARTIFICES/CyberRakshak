import { Building2 } from "lucide-react";
import type { BusinessUnit } from "../../services/api";

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

const BusinessUnitTable = ({ units, loading }: Props) => {
  if (loading) {
    return (
      <div className="h-32 flex items-center justify-center">
        <p className="text-sm text-slate-500 animate-pulse">Loading business units…</p>
      </div>
    );
  }

  if (units.length === 0) {
    return (
      <div className="h-32 flex flex-col items-center justify-center gap-2 text-center">
        <Building2 className="w-8 h-8 text-slate-400" />
        <p className="text-sm text-slate-500">No business units registered for this organization yet.</p>
      </div>
    );
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="text-left bg-slate-100 dark:bg-slate-700">
            <th className="p-3">Business Unit</th>
            <th className="p-3">Criticality</th>
            <th className="p-3 text-right">Revenue Share</th>
          </tr>
        </thead>
        <tbody>
          {units.map((bu) => (
            <tr key={bu.id} className="border-b dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700/40 transition">
              <td className="p-3 font-medium text-slate-800 dark:text-slate-100">{bu.name}</td>
              <td className="p-3">
                <span
                  className={`px-2.5 py-1 rounded-full text-xs font-medium ${
                    CRITICALITY_CLASSES[bu.criticality] ?? "bg-slate-100 text-slate-600"
                  }`}
                >
                  {bu.criticality}
                </span>
              </td>
              <td className="p-3 text-right">{(bu.revenue_share * 100).toFixed(0)}%</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default BusinessUnitTable;
