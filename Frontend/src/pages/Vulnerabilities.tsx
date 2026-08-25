import { useState, useEffect, useCallback } from "react";
import { AlertCircle, Info, MoreVertical } from "lucide-react";
import { getVulnerabilities, getDashboardStats } from "../services/api";

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
      <div className="space-y-6 mb-8">
        {/* Row 1: Strategic Stats */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Widget A: Severity by Source (Left) */}
          <div className="bg-white dark:bg-[#1e293b] border border-slate-200 dark:border-slate-700 rounded-xl shadow-sm p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <h3 className="text-xs uppercase tracking-wider text-slate-500 dark:text-slate-400 font-semibold">
                  Severity Statistics by Source
                </h3>
                <div 
                  className="relative"
                  onMouseEnter={() => setActiveTooltip('severity')}
                  onMouseLeave={() => setActiveTooltip(null)}
                >
                  <Info className="w-3 h-3 text-slate-400 dark:text-slate-500 cursor-help" />
                  {activeTooltip === 'severity' && (
                    <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-64 bg-slate-900 dark:bg-slate-800 text-white text-xs p-3 rounded shadow-xl z-50">
                      Breakdown of vulnerabilities discovered by different scanning sources including network scanners, agents, and agentless discovery.
                      <div className="absolute top-full left-1/2 -translate-x-1/2 -mt-1">
                        <div className="w-2 h-2 bg-slate-900 dark:bg-slate-800 rotate-45"></div>
                      </div>
                    </div>
                  )}
                </div>
              </div>
              <MoreVertical className="w-4 h-4 text-slate-400 dark:text-slate-500 cursor-pointer" />
            </div>
            <div className="flex items-center gap-8">
              {/* Left: Big Number */}
              <div className="flex flex-col">
                <span className="text-5xl font-bold text-slate-900 dark:text-white">
                  {stats.total > 1000 ? `${(stats.total / 1000).toFixed(1)}K` : stats.total}
                </span>
                <span className="text-sm text-slate-500 dark:text-slate-400 mt-1">Discovered by Scanners</span>
              </div>
              {/* Divider */}
              <div className="h-16 w-px bg-slate-200 dark:bg-slate-700"></div>
              {/* Right: Breakdown List */}
              <div className="flex-1 space-y-3">
                <div className="flex items-center gap-3">
                  <div className="w-3 h-3 rounded-full bg-red-500"></div>
                  <span className="text-sm text-slate-700 dark:text-slate-300">Critical <span className="text-slate-500 dark:text-slate-400">({stats.critical})</span></span>
                </div>
                <div className="flex items-center gap-3">
                  <div className="w-3 h-3 rounded-full bg-orange-500"></div>
                  <span className="text-sm text-slate-700 dark:text-slate-300">High <span className="text-slate-500 dark:text-slate-400">({stats.high})</span></span>
                </div>
                <div className="flex items-center gap-3">
                  <div className="w-3 h-3 rounded-full bg-yellow-500"></div>
                  <span className="text-sm text-slate-700 dark:text-slate-300">Medium <span className="text-slate-500 dark:text-slate-400">({stats.medium})</span></span>
                </div>
              </div>
            </div>
          </div>

          {/* Widget C: VPR Distribution (Right) */}
          <div className="bg-white dark:bg-[#1e293b] border border-slate-200 dark:border-slate-700 rounded-xl shadow-sm p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <h3 className="text-xs uppercase tracking-wider text-slate-500 dark:text-slate-400 font-semibold">
                  Vulnerability Priority Rating (VPR)
                </h3>
                <div 
                  className="relative"
                  onMouseEnter={() => setActiveTooltip('vpr')}
                  onMouseLeave={() => setActiveTooltip(null)}
                >
                  <Info className="w-3 h-3 text-slate-400 dark:text-slate-500 cursor-help" />
                  {activeTooltip === 'vpr' && (
                    <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-64 bg-slate-900 dark:bg-slate-800 text-white text-xs p-3 rounded shadow-xl z-50">
                      Vulnerability Priority Rating (VPR) prioritizes vulnerabilities based on risk, not just CVSS scores. Higher ratings indicate more critical threats.
                      <div className="absolute top-full left-1/2 -translate-x-1/2 -mt-1">
                        <div className="w-2 h-2 bg-slate-900 dark:bg-slate-800 rotate-45"></div>
                      </div>
                    </div>
                  )}
                </div>
              </div>
              <MoreVertical className="w-4 h-4 text-slate-400 dark:text-slate-500 cursor-pointer" />
            </div>
            <div className="w-full h-48 relative">
              <svg viewBox="0 0 500 220" className="w-full h-full">
                <defs>
                  <pattern id="grid-vpr" width="500" height="40" patternUnits="userSpaceOnUse">
                    <line x1="0" y1="40" x2="500" y2="40" stroke="#e2e8f0" strokeWidth="1" strokeDasharray="3 3" className="dark:stroke-slate-700" />
                  </pattern>
                  <linearGradient id="grad-crit" x1="0" y1="1" x2="0" y2="0">
                    <stop offset="0%" stopColor="#dc2626" />
                    <stop offset="100%" stopColor="#f87171" />
                  </linearGradient>
                  <linearGradient id="grad-high" x1="0" y1="1" x2="0" y2="0">
                    <stop offset="0%" stopColor="#ea580c" />
                    <stop offset="100%" stopColor="#fb923c" />
                  </linearGradient>
                  <linearGradient id="grad-med" x1="0" y1="1" x2="0" y2="0">
                    <stop offset="0%" stopColor="#ca8a04" />
                    <stop offset="100%" stopColor="#facc15" />
                  </linearGradient>
                  <linearGradient id="grad-low" x1="0" y1="1" x2="0" y2="0">
                    <stop offset="0%" stopColor="#2563eb" />
                    <stop offset="100%" stopColor="#60a5fa" />
                  </linearGradient>
                </defs>
                <rect width="500" height="200" fill="url(#grid-vpr)" />

                {/* Critical Bar */}
                {(() => {
                  const maxVal = Math.max(stats.critical, stats.high, stats.medium, stats.low, 1);
                  const barMaxH = 150;
                  const critH = Math.max(8, (stats.critical / maxVal) * barMaxH);
                  const highH = Math.max(8, (stats.high / maxVal) * barMaxH);
                  const medH = Math.max(8, (stats.medium / maxVal) * barMaxH);
                  const lowH = Math.max(8, (stats.low / maxVal) * barMaxH);
                  return (
                    <>
                      <rect x="60" y={180 - critH} width="30" height={critH} fill="url(#grad-crit)" rx="4" />
                      <text x="75" y={180 - critH - 8} fill="#1e293b" fontSize="11" textAnchor="middle" fontWeight="bold" className="dark:fill-white">{stats.critical}</text>
                      <text x="75" y="198" fill="#64748b" fontSize="10" textAnchor="middle" className="dark:fill-slate-400">Critical</text>

                      <rect x="160" y={180 - highH} width="30" height={highH} fill="url(#grad-high)" rx="4" />
                      <text x="175" y={180 - highH - 8} fill="#1e293b" fontSize="11" textAnchor="middle" fontWeight="bold" className="dark:fill-white">{stats.high}</text>
                      <text x="175" y="198" fill="#64748b" fontSize="10" textAnchor="middle" className="dark:fill-slate-400">High</text>

                      <rect x="270" y={180 - medH} width="30" height={medH} fill="url(#grad-med)" rx="4" />
                      <text x="285" y={180 - medH - 8} fill="#1e293b" fontSize="11" textAnchor="middle" fontWeight="bold" className="dark:fill-white">{stats.medium}</text>
                      <text x="285" y="198" fill="#64748b" fontSize="10" textAnchor="middle" className="dark:fill-slate-400">Medium</text>

                      <rect x="380" y={180 - lowH} width="30" height={lowH} fill="url(#grad-low)" rx="4" />
                      <text x="395" y={180 - lowH - 8} fill="#1e293b" fontSize="11" textAnchor="middle" fontWeight="bold" className="dark:fill-white">{stats.low}</text>
                      <text x="395" y="198" fill="#64748b" fontSize="10" textAnchor="middle" className="dark:fill-slate-400">Low</text>
                    </>
                  );
                })()}
              </svg>
            </div>
          </div>
        </div>

        {/* Row 2: Deep Dive */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Exploitability Chart (Left) */}
          <div className="bg-white dark:bg-[#1e293b] border border-slate-200 dark:border-slate-700 rounded-xl shadow-sm p-6 pb-4">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-2">
                <h3 className="text-sm font-semibold text-slate-900 dark:text-white">
                  Critical & High Exploitable Vulnerabilities
                </h3>
                <div 
                  className="relative"
                  onMouseEnter={() => setActiveTooltip('exploitable')}
                  onMouseLeave={() => setActiveTooltip(null)}
                >
                  <Info className="w-4 h-4 text-slate-400 dark:text-slate-500 cursor-help" />
                  {activeTooltip === 'exploitable' && (
                    <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-64 bg-slate-900 dark:bg-slate-800 text-white text-xs p-3 rounded shadow-xl z-50">
                      Breakdown of critical and high-severity vulnerabilities by exploitability type.
                      <div className="absolute top-full left-1/2 -translate-x-1/2 -mt-1">
                        <div className="w-2 h-2 bg-slate-900 dark:bg-slate-800 rotate-45"></div>
                      </div>
                    </div>
                  )}
                </div>
              </div>
              <MoreVertical className="w-4 h-4 text-slate-400 dark:text-slate-500 cursor-pointer" />
            </div>
            
            <div className="w-full h-64 relative pb-4">
              <svg viewBox="0 0 500 220" className="w-full h-full">
                <defs>
                  <pattern id="grid-h" width="500" height="40" patternUnits="userSpaceOnUse">
                    <line x1="0" y1="40" x2="500" y2="40" stroke="#e2e8f0" strokeWidth="1" strokeDasharray="3 3" className="dark:stroke-slate-700" />
                  </pattern>
                </defs>
                <rect width="500" height="200" fill="url(#grid-h)" />
                
                {/* Simulated Data */}
                <rect x="70" y="72" width="20" height="108" fill="#4299e1" rx="4" />
                <text x="80" y="62" fill="#1e293b" fontSize="10" textAnchor="middle" fontWeight="bold" className="dark:fill-white">{Math.round(stats.high * 0.4)}</text>
                <text x="80" y="195" fill="#64748b" fontSize="9" textAnchor="middle" className="dark:fill-slate-400">Exploited</text>
                
                <rect x="140" y="30" width="20" height="150" fill="#2b6cb0" rx="4" />
                <text x="150" y="20" fill="#1e293b" fontSize="10" textAnchor="middle" fontWeight="bold" className="dark:fill-white">{Math.round(stats.high * 0.6)}</text>
                <text x="150" y="195" fill="#64748b" fontSize="9" textAnchor="middle" className="dark:fill-slate-400">Remotely</text>
                
                <rect x="220" y="138" width="20" height="42" fill="#38b2ac" rx="4" />
                <text x="230" y="128" fill="#1e293b" fontSize="10" textAnchor="middle" fontWeight="bold" className="dark:fill-white">{Math.round(stats.critical * 0.3)}</text>
                <text x="230" y="195" fill="#64748b" fontSize="9" textAnchor="middle" className="dark:fill-slate-400">Locally</text>
                
                <rect x="300" y="147" width="20" height="33" fill="#2f855a" rx="4" />
                <text x="310" y="137" fill="#1e293b" fontSize="10" textAnchor="middle" fontWeight="bold" className="dark:fill-white">{Math.round(stats.critical * 0.2)}</text>
                <text x="310" y="195" fill="#64748b" fontSize="9" textAnchor="middle" className="dark:fill-slate-400">Frameworks</text>
                
                <rect x="380" y="171" width="20" height="9" fill="#f97316" rx="4" />
                <text x="390" y="161" fill="#1e293b" fontSize="10" textAnchor="middle" fontWeight="bold" className="dark:fill-white">{Math.round(stats.critical * 0.1)}</text>
                <text x="390" y="195" fill="#64748b" fontSize="9" textAnchor="middle" className="dark:fill-slate-400">Complex</text>
              </svg>
            </div>
          </div>

          {/* Widget B: Patch Intelligence (Right) */}
          <div className="bg-white dark:bg-[#1e293b] border border-slate-200 dark:border-slate-700 rounded-xl shadow-sm p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <h3 className="text-xs uppercase tracking-wider text-slate-500 dark:text-slate-400 font-semibold">
                  Patch Intelligence
                </h3>
                <div className="relative">
                  <Info className="w-3 h-3 text-slate-400 dark:text-slate-500 cursor-help" />
                </div>
              </div>
              <MoreVertical className="w-4 h-4 text-slate-400 dark:text-slate-500 cursor-pointer" />
            </div>
            <div className="space-y-4 mb-6">
              <div className="flex items-center justify-between p-4 bg-red-50 dark:bg-red-500/10 rounded-lg border border-red-200 dark:border-red-500/30">
                <span className="text-sm text-slate-600 dark:text-slate-400">Missing Patches</span>
                <span className="text-2xl font-bold text-red-600 dark:text-red-400">{stats.critical + stats.high}</span>
              </div>
              <div className="flex items-center justify-between p-4 bg-emerald-50 dark:bg-emerald-500/10 rounded-lg border border-emerald-200 dark:border-emerald-500/30">
                <span className="text-sm text-slate-600 dark:text-slate-400">Applied Patches</span>
                <span className="text-2xl font-bold text-emerald-600 dark:text-emerald-400">0</span>
              </div>
            </div>
            
            {/* SLA Status Table */}
            <div className="mt-6">
              <h4 className="text-xs uppercase tracking-wider text-slate-500 dark:text-slate-400 font-semibold mb-3">
                SLA Status
              </h4>
              <div className="space-y-2 text-xs">
                <div className="flex justify-between items-center p-2 bg-slate-50 dark:bg-slate-800/50 rounded">
                  <span className="text-slate-600 dark:text-slate-400">Critical</span>
                  <span className="font-semibold text-red-600 dark:text-red-400">{stats.critical} Not Met</span>
                </div>
                <div className="flex justify-between items-center p-2 bg-slate-50 dark:bg-slate-800/50 rounded">
                  <span className="text-slate-600 dark:text-slate-400">High</span>
                  <span className="font-semibold text-orange-600 dark:text-orange-400">{stats.high} Not Met</span>
                </div>
                <div className="flex justify-between items-center p-2 bg-slate-50 dark:bg-slate-800/50 rounded">
                  <span className="text-slate-600 dark:text-slate-400">Medium</span>
                  <span className="font-semibold text-yellow-600 dark:text-yellow-400">{stats.medium} Not Met</span>
                </div>
              </div>
            </div>
          </div>
        </div>
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
