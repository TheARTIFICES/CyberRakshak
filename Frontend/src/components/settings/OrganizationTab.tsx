import { useEffect, useState } from "react";
import { AlertCircle, Building2, Landmark } from "lucide-react";
import Card from "../ui/Card";
import EmptyState from "../ui/EmptyState";
import { getBusinessUnits, getOrganizations, type BusinessUnit, type Organization } from "../../services/api";

/** Org profile — real tenant data from GET /org and GET /bu. */
const OrganizationTab = () => {
  const [orgs, setOrgs] = useState<Organization[]>([]);
  const [units, setUnits] = useState<BusinessUnit[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      setError(null);
      try {
        const orgData = await getOrganizations();
        setOrgs(orgData);
        setUnits(await getBusinessUnits(orgData[0]?.id));
      } catch (err) {
        console.error("Failed to load organization profile:", err);
        setError("Could not reach the backend — organization profile unavailable.");
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  if (loading) {
    return <p className="text-sm text-slate-500 animate-pulse py-8 text-center">Loading organization profile…</p>;
  }

  if (error) {
    return <EmptyState icon={AlertCircle} tone="error" title="Organization profile unavailable" description={error} />;
  }

  const org = orgs[0];

  return (
    <div className="space-y-6">
      {org ? (
        <Card className="space-y-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-blue-100 dark:bg-blue-950/50 flex items-center justify-center">
              <Landmark className="w-5 h-5 text-blue-600 dark:text-blue-400" />
            </div>
            <div>
              <p className="font-semibold">{org.name}</p>
              <p className="text-xs text-slate-500">{org.sector}</p>
            </div>
          </div>

          {org.regulatory_scope && org.regulatory_scope.length > 0 && (
            <div>
              <p className="text-[11px] uppercase tracking-wide text-slate-500 mb-2">Regulatory scope</p>
              <div className="flex flex-wrap gap-1.5">
                {org.regulatory_scope.map((scope) => (
                  <span
                    key={scope}
                    className="px-2 py-1 rounded text-[11px] font-medium bg-slate-100 dark:bg-slate-900 text-slate-600 dark:text-slate-300"
                  >
                    {scope.replace(/_/g, " ")}
                  </span>
                ))}
              </div>
            </div>
          )}
        </Card>
      ) : (
        <EmptyState icon={Building2} title="No organization registered" size="sm" />
      )}

      <div>
        <h2 className="text-lg font-semibold mb-3">Business Units</h2>
        {units.length === 0 ? (
          <Card>
            <EmptyState
              icon={Building2}
              size="sm"
              title="No business units registered"
              description="Business units scope risk roll-up on the Board Governance screen."
            />
          </Card>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {units.map((bu) => (
              <Card key={bu.id} className="flex items-center justify-between">
                <div className="min-w-0">
                  <p className="font-medium text-sm truncate">{bu.name}</p>
                  <p className="text-xs text-slate-500">{(bu.revenue_share * 100).toFixed(0)}% revenue share</p>
                </div>
                <span className="text-[11px] px-2 py-1 rounded-full bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 flex-shrink-0">
                  {bu.criticality}
                </span>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default OrganizationTab;
