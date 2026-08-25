import { useState, useEffect, useCallback } from "react";
import { AlertCircle } from "lucide-react";
import { getVulnerabilities, getDashboardStats } from "../services/api";
import VulnerabilityInsights from "../components/vuln/VulnerabilityInsights";

// Interface matching the API response structure
interface Vulnerability {
  id: string;
  cve: string;
  title: string;
  severity: string;
  cvss: number;
  asset: string;
  tool: string;
  date: string;
  category?: string;
}

const severityColors: Record<string, string> = {
  Critical: "bg-red-50 text-red-700 border border-red-200 dark:bg-red-600 dark:text-white dark:border-red-600",
  High: "bg-orange-50 text-orange-700 border border-orange-200 dark:bg-orange-500 dark:text-white dark:border-orange-500",
  Medium: "bg-yellow-50 text-yellow-700 border border-yellow-200 dark:bg-yellow-500 dark:text-white dark:border-yellow-500",
  Low: "bg-blue-50 text-blue-700 border border-blue-200 dark:bg-blue-500 dark:text-white dark:border-blue-500",
};

const Vulnerabilities = () => {
  const [vulnerabilities, setVulnerabilities] = useState<Vulnerability[]>([]);
  const [stats, setStats] = useState({
    total: 0,
    critical: 0,
    high: 0,
    medium: 0,
    low: 0,
  });
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [severityFilter, setSeverityFilter] = useState<string>("All");
  const [categoryFilter, setCategoryFilter] = useState<string>("All");
  const [activeTooltip, setActiveTooltip] = useState<string | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);

  // Fetch dashboard stats once on mount
  useEffect(() => {
    const fetchStats = async () => {
      try {
        const statsData = await getDashboardStats();
        setStats({
          total: statsData.total_vulnerabilities,
          critical: statsData.critical_findings,
          high: statsData.high_findings,
          medium: statsData.medium_findings,
          low: statsData.low_findings,
        });
      } catch (error) {
        console.error("Failed to load dashboard stats", error);
      }
    };
    fetchStats();
  }, []);

  // Fetch vulnerabilities from backend with filters
  const fetchVulnerabilities = useCallback(async () => {
    try {
      setLoading(true);
      const filters: Record<string, any> = {};
      if (severityFilter !== "All") filters.severity = [severityFilter];
      if (categoryFilter !== "All") filters.tool = [categoryFilter];
      if (searchQuery.trim()) filters.search = searchQuery.trim();

      const vulnData = await getVulnerabilities(0, 200, filters);
      const mappedVulns = vulnData.map((v: any) => ({
        ...v,
        category: v.tool || v.category || "Network",
      }));
      setVulnerabilities(mappedVulns);
      setLoadError(null);
    } catch (error) {
      console.error("Failed to load vulnerability data", error);
      setLoadError("Could not reach the backend — vulnerability data may be incomplete.");
    } finally {
      setLoading(false);
    }
  }, [searchQuery, severityFilter, categoryFilter]);

  // Debounce search, immediate for dropdowns
  useEffect(() => {
    const timer = setTimeout(() => {
      fetchVulnerabilities();
    }, searchQuery ? 400 : 0);
    return () => clearTimeout(timer);
  }, [fetchVulnerabilities, searchQuery]);

  const exportCSV = () => {
    const csv = [
      ["CVE ID", "Vulnerability Name", "Severity", "Category", "Asset"].join(","),
      ...vulnerabilities.map((v) =>
        [v.cve, v.title, v.severity, v.category, v.asset].join(",")
      ),
    ].join("\n");

    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "vulnerabilities.csv";
    a.click();
  };

  const handleFixClick = (cve: string) => {
    console.log("Opening fix options for:", cve);
  };

  return (
    <div className="space-y-6">
      {loadError && (
        <div className="flex items-center gap-2 text-sm text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-950/30 rounded-lg px-4 py-2">
          <AlertCircle className="w-4 h-4 flex-shrink-0" />
          {loadError}
        </div>
      )}
      {/* Vulnerability Intelligence Overview */}
      <div className="mb-8">
        <VulnerabilityInsights vulnerabilities={vulnerabilities} stats={stats} loading={loading} />
      </div>

      {/* Filter Toolbar */}
      <div className="bg-white dark:bg-[#1e293b]/80 backdrop-blur-md border border-slate-200 dark:border-slate-700 rounded-xl shadow-sm dark:shadow-lg p-4">
        <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4">
          {/* Left Side - Filters */}
          <div className="flex flex-wrap items-center gap-3 flex-1">
            <input
              type="text"
              placeholder="Search CVE ID or Asset..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="px-4 py-2 rounded-lg border bg-slate-50 dark:bg-black/20 border-gray-300 dark:border-slate-700 text-slate-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-cyan-500/50 flex-1 min-w-[250px]"
            />

            <select
              value={severityFilter}
              onChange={(e) => setSeverityFilter(e.target.value)}
              className="px-4 py-2 rounded-lg border bg-slate-50 dark:bg-black/20 border-gray-300 dark:border-slate-700 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-cyan-500/50"
            >
              <option value="All" className="bg-slate-800">All Severities</option>
              <option value="Critical" className="bg-slate-800">Critical</option>
              <option value="High" className="bg-slate-800">High</option>
              <option value="Medium" className="bg-slate-800">Medium</option>
              <option value="Low" className="bg-slate-800">Low</option>
            </select>

            <select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              className="px-4 py-2 rounded-lg border bg-slate-50 dark:bg-black/20 border-gray-300 dark:border-slate-700 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-cyan-500/50"
            >
              <option value="All" className="bg-slate-800">All Tools</option>
              <option value="nmap" className="bg-slate-800">Nmap</option>
              <option value="nuclei" className="bg-slate-800">Nuclei</option>
              <option value="zap" className="bg-slate-800">ZAP</option>
              <option value="openvas" className="bg-slate-800">OpenVAS</option>
              <option value="nikto" className="bg-slate-800">Nikto</option>
              <option value="dalfox" className="bg-slate-800">Dalfox</option>
              <option value="grype" className="bg-slate-800">Grype</option>
            </select>
          </div>

          <button
            onClick={exportCSV}
            className="px-4 py-2 rounded-lg bg-white dark:bg-transparent text-slate-700 dark:text-cyan-400 border border-slate-300 dark:border-cyan-500/50 hover:bg-slate-50 dark:hover:bg-cyan-500/10 shadow-sm transition-colors font-medium whitespace-nowrap"
          >
            Export CSV
          </button>
        </div>
      </div>

      {/* Data Table */}
      <div className="bg-white dark:bg-[#1e293b] backdrop-blur-md border border-slate-200 dark:border-slate-700 rounded-xl shadow-md dark:shadow-lg overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-slate-50 dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700">
                {/* 5 COLUMNS - Removed Status & Action */}
                <th className="p-4 text-left text-slate-500 dark:text-slate-300 font-semibold w-1/6 whitespace-nowrap">CVE ID</th>
                <th className="p-4 text-left text-slate-500 dark:text-slate-300 font-semibold w-5/12">Vulnerability Name</th>
                <th className="p-4 text-left text-slate-500 dark:text-slate-300 font-semibold w-2/12">Severity</th>
                <th className="p-4 text-left text-slate-500 dark:text-slate-300 font-semibold w-2/12">Category</th>
                <th className="p-4 text-left text-slate-500 dark:text-slate-300 font-semibold w-2/12">Asset</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={5} className="p-8 text-center text-slate-500 dark:text-slate-400">Loading data...</td>
                </tr>
              ) : vulnerabilities.length === 0 ? (
                <tr>
                  <td colSpan={5} className="p-8 text-center text-slate-500 dark:text-slate-400">
                    No vulnerabilities found. Try adjusting your filters.
                  </td>
                </tr>
              ) : (
                vulnerabilities.map((vuln, index) => (
                  <tr
                    key={index}
                    className="border-b border-slate-200 dark:border-slate-700 hover:bg-slate-50/50 dark:hover:bg-white/5 transition-colors"
                  >
                    {/* CVE ID */}
                    <td className="p-4 font-mono text-slate-700 dark:text-white whitespace-nowrap">{vuln.cve || "N/A"}</td>

                    {/* Vulnerability Name */}
                    <td className="p-4 text-slate-700 dark:text-white max-w-[500px] truncate" title={vuln.title}>
                      {vuln.title}
                    </td>

                    {/* Severity */}
                    <td className="p-4">
                      <span
                        className={`px-3 py-1 rounded-full text-xs font-medium ${
                          severityColors[vuln.severity] || "bg-gray-500"
                        }`}
                      >
                        {vuln.severity}
                      </span>
                    </td>

                    {/* Category */}
                    <td className="p-4">
                      <span className="px-2 py-1 rounded-full text-xs bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-600">
                        {vuln.category}
                      </span>
                    </td>

                    {/* Asset - Clickable removed */}
                    <td className="p-4 text-slate-700 dark:text-white">
                      {vuln.asset}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default Vulnerabilities;
