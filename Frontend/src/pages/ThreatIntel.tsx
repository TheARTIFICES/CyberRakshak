import React, { useState, useEffect } from "react";
import IntelCards from "../components/intel/IntelCards";
import IntelSearchBar from "../components/intel/IntelSearchBar";
import IntelDrawer from "../components/intel/IntelDrawer";
import { getThreatIntelFeed } from "../services/api";
import { Shield, ShieldAlert, Skull, Activity } from "lucide-react";

const ThreatIntel = () => {
  const [feedData, setFeedData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedIntel, setSelectedIntel] = useState<any>(null);
  
  // Filters
  const [severityFilter, setSeverityFilter] = useState("All");
  const [exploitStatusFilter, setExploitStatusFilter] = useState("All");
  const [searchTerm, setSearchTerm] = useState("");

  // Derived Stats for Widgets
  const [categoryStats, setCategoryStats] = useState({ rce: 0, privEsc: 0, web: 0 });

  useEffect(() => {
    const fetchFeed = async () => {
      setLoading(true);
      try {
        const filters: any = {};
        if (severityFilter !== "All") filters.severity = [severityFilter];
        if (exploitStatusFilter !== "All") filters.exploit_status = exploitStatusFilter;
        if (searchTerm) filters.search = searchTerm;

        const data = await getThreatIntelFeed(0, 50, filters);
        setFeedData(data);
        
        // Calculate dynamic stats for the Donut Chart based on the current view
        let rce = 0, priv = 0, web = 0;
        data.forEach(item => {
          const desc = (item.description || "").toLowerCase();
          if (desc.includes("code execution") || desc.includes("rce")) rce++;
          else if (desc.includes("privilege") || desc.includes("escalation")) priv++;
          else web++; // Catch-all for others (often web/xss/injection)
        });
        setCategoryStats({ rce, priv, web });

      } catch (error) {
        console.error("Failed to fetch threat intel feed:", error);
      } finally {
        setLoading(false);
      }
    };

    const timer = setTimeout(() => fetchFeed(), 500); // Debounce
    return () => clearTimeout(timer);
  }, [severityFilter, exploitStatusFilter, searchTerm]);

  const getSeverityColor = (severity: string) => {
    const s = severity ? severity.toUpperCase() : "INFO";
    if (s === 'CRITICAL') return 'bg-red-700';
    if (s === 'HIGH') return 'bg-red-500';
    if (s === 'MEDIUM') return 'bg-orange-500';
    if (s === 'LOW') return 'bg-yellow-500';
    return 'bg-gray-500';
  };

  const handleView = (item: any) => {
    setSelectedIntel({
      cve: item.cve_id,
      summary: item.description,
      severity: item.severity,
      epss: item.cvss_score ? item.cvss_score / 10 : 0, 
      exploit: item.has_exploit ? "Exploit Available" : "No Known Exploit"
    });
  };

  // Mock data for threat landscape (API doesn't support these yet)
  const mockThreatActors = [
    { name: "APT29 (Cozy Bear)", focus: "Targeting Gov/Diplo", threatLevel: "Critical" },
    { name: "Lazarus Group", focus: "Financial/Crypto", threatLevel: "High" },
    { name: "LockBit 3.0", focus: "Ransomware as a Service", threatLevel: "Critical" }
  ];

  const getThreatLevelColor = (level: string) => {
    if (level === "Critical") return "bg-red-500";
    if (level === "High") return "bg-orange-500";
    return "bg-gray-500";
  };

  return (
    <div className="space-y-6">
      
      {/* Summary Cards */}
      <IntelCards />

      {/* Search Bar */}
      <div className="bg-white dark:bg-slate-800 rounded-xl shadow p-5">
        <div className="flex items-center gap-3 w-full">
          <div className="flex items-center bg-slate-100 dark:bg-slate-700 rounded-xl px-4 py-2 w-full shadow-inner border border-slate-300 dark:border-slate-600 transition focus-within:ring-2 ring-blue-400">
            <Activity className="w-5 h-5 opacity-60 mr-3" />
            <input
              type="text"
              placeholder="Search CVEs, keywords..."
              className="bg-transparent w-full outline-none text-sm"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </div>
      </div>

      {/* THREAT LANDSCAPE WIDGETS */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
        {/* Widget 1: Exploitation Trends (Static) */}
        <div className="bg-white dark:bg-slate-800 rounded-xl shadow p-5">
          <h3 className="text-lg font-semibold mb-4">Exploitation Activity (Last 30 Days)</h3>
          <div className="h-40 flex items-end justify-between px-2">
            <svg width="100%" height="100%" viewBox="0 0 300 150" className="overflow-visible">
              <defs>
                <linearGradient id="gradient" x1="0%" y1="0%" x2="0%" y2="100%">
                  <stop offset="0%" stopColor="#ef4444" stopOpacity="0.8" />
                  <stop offset="100%" stopColor="#f97316" stopOpacity="0.2" />
                </linearGradient>
              </defs>
              <path 
                d="M 0 140 L 30 130 L 60 110 L 90 90 L 120 80 L 150 60 L 180 50 L 210 40 L 240 30 L 270 20 L 300 30 L 300 150 L 0 150 Z" 
                fill="url(#gradient)" 
                stroke="none"
              />
              <polyline 
                points="0,140 30,130 60,110 90,90 120,80 150,60 180,50 210,40 240,30 270,20 300,30" 
                fill="none" 
                stroke="#ef4444" 
                strokeWidth="2"
              />
            </svg>
          </div>
        </div>

        {/* Widget 2: Top Threat Actors (Static) */}
        <div className="bg-white dark:bg-slate-800 rounded-xl shadow p-5">
          <h3 className="text-lg font-semibold mb-4">Active Threat Groups</h3>
          <div className="space-y-4">
            {mockThreatActors.map((actor, index) => (
              <div key={index} className="flex items-center justify-between">
                <div className="flex items-center">
                  <Skull className="w-5 h-5 text-gray-500 mr-3" />
                  <div>
                    <div className="font-medium">{actor.name}</div>
                    <div className="text-sm text-gray-500 dark:text-gray-400">{actor.focus}</div>
                  </div>
                </div>
                <span className={`px-2 py-1 text-xs text-white rounded-full ${getThreatLevelColor(actor.threatLevel)}`}>
                  {actor.threatLevel}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Widget 3: Vulnerability by Type (Dynamic) */}
        <div className="bg-white dark:bg-slate-800 rounded-xl shadow p-5">
          <h3 className="text-lg font-semibold mb-4">Vulnerability Categories</h3>
          <div className="flex items-center justify-between">
            <div className="relative w-32 h-32 flex items-center justify-center">
               <div className="absolute inset-0 border-8 border-red-500 rounded-full opacity-80" style={{ clipPath: "polygon(0 0, 100% 0, 100% 30%, 0 30%)" }}></div>
               <div className="absolute inset-0 border-8 border-orange-500 rounded-full opacity-80" style={{ clipPath: "polygon(0 30%, 100% 30%, 100% 70%, 0 70%)" }}></div>
               <div className="absolute inset-0 border-8 border-yellow-500 rounded-full opacity-80" style={{ clipPath: "polygon(0 70%, 100% 70%, 100% 100%, 0 100%)" }}></div>
               <span className="text-xl font-bold">{feedData.length}</span>
            </div>
            <div className="space-y-2">
              <div className="flex items-center">
                <div className="w-3 h-3 bg-red-500 rounded-full mr-2"></div>
                <span className="text-sm">RCE (~{categoryStats.rce})</span>
              </div>
              <div className="flex items-center">
                <div className="w-3 h-3 bg-orange-500 rounded-full mr-2"></div>
                <span className="text-sm">PrivEsc (~{categoryStats.priv})</span>
              </div>
              <div className="flex items-center">
                <div className="w-3 h-3 bg-yellow-500 rounded-full mr-2"></div>
                <span className="text-sm">Web/Other (~{categoryStats.web})</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* UPGRADED TABLE WITH INTEGRATED FILTERS */}
      <div className="bg-white dark:bg-slate-800 rounded-xl shadow p-4">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-4 gap-3">
          <h3 className="text-lg font-semibold">Global Vulnerability Feed</h3>
          
          <div className="flex flex-wrap gap-3">
            {/* Severity Filter */}
            <select 
              className="border border-gray-300 dark:border-slate-600 rounded-md px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-slate-700"
              value={severityFilter}
              onChange={(e) => setSeverityFilter(e.target.value)}
            >
              <option value="All">All Severities</option>
              <option value="Critical">Critical</option>
              <option value="High">High</option>
              <option value="Medium">Medium</option>
              <option value="Low">Low</option>
            </select>
            
            {/* Exploit Status Filter */}
            <select 
              className="border border-gray-300 dark:border-slate-600 rounded-md px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-slate-700"
              value={exploitStatusFilter}
              onChange={(e) => setExploitStatusFilter(e.target.value)}
            >
              <option value="All">All Exploit Status</option>
              <option value="Exploit Available">Exploit Available</option>
              <option value="No Known Exploit">No Known Exploit</option>
            </select>
          </div>
        </div>

        {loading ? (
          <div className="p-4 text-center text-slate-500">Loading threat feeds from NVD & CISA...</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full text-sm divide-y divide-slate-200 dark:divide-slate-700">
              <thead>
                <tr className="text-left bg-slate-50 dark:bg-slate-700">
                  <th className="p-3">CVE ID</th>
                  <th className="p-3">Severity</th>
                  <th className="p-3">CVSS SCORE</th>
                  <th className="p-3">SOURCE</th>
                  <th className="p-3">EXPLOIT STATUS</th>
                  <th className="p-3">LAST UPDATED</th>
                  <th className="p-3">ACTION</th>
                </tr>
              </thead>
              <tbody>
                {feedData.length === 0 ? (
                  <tr><td colSpan={7} className="p-6 text-center text-slate-500">No vulnerabilities found matching filters.</td></tr>
                ) : (
                  feedData.map((item, index) => (
                    <tr key={index} className="hover:bg-slate-50 dark:hover:bg-slate-700/50 transition">
                      <td 
                        className="p-3 font-medium text-blue-600 cursor-pointer hover:underline"
                        onClick={() => handleView(item)}
                      >
                        {item.cve_id}
                      </td>

                      <td className="p-3">
                        <span className={`px-2 py-1 text-xs text-white rounded-full ${getSeverityColor(item.severity)}`}>
                          {item.severity ? item.severity.toUpperCase() : "UNKNOWN"}
                        </span>
                      </td>

                      <td className="p-3">
                        <div className="flex items-center">
                          <div className="w-24 bg-gray-200 rounded-full h-2 mr-2">
                            <div 
                              className={`h-2 rounded-full ${
                                item.cvss_score >= 7 ? 'bg-red-500' : 
                                item.cvss_score >= 4 ? 'bg-orange-500' : 'bg-yellow-500'
                              }`} 
                              style={{ width: `${(item.cvss_score / 10) * 100}%` }}
                            ></div>
                          </div>
                          <span className="font-semibold">{item.cvss_score?.toFixed(1) || "N/A"}</span>
                        </div>
                      </td>

                      <td className="p-3">
                        <div className="flex items-center text-slate-600 dark:text-slate-300">
                          {item.is_cisa_kev ? (
                             <span className="flex items-center gap-1 text-red-500 font-bold">
                               <ShieldAlert className="w-4 h-4" /> CISA KEV
                             </span>
                          ) : (
                             <span className="flex items-center gap-1">
                               <Shield className="w-4 h-4 opacity-50" /> NVD
                             </span>
                          )}
                        </div>
                      </td>

                      <td className="p-3">
                        {item.has_exploit ? (
                          <span className="px-2 py-1 text-xs text-white rounded-full bg-red-600">
                            Exploit Available
                          </span>
                        ) : (
                          <span className="px-2 py-1 text-xs text-slate-700 dark:text-slate-300 rounded-full bg-slate-200 dark:bg-slate-600">
                            None
                          </span>
                        )}
                      </td>

                      <td className="p-3 opacity-70">
                          {item.last_updated ? new Date(item.last_updated).toLocaleDateString() : "N/A"}
                      </td>

                      <td className="p-3">
                        <button 
                          className="px-3 py-1 text-xs bg-blue-600 text-white rounded-md hover:bg-blue-700 transition"
                          onClick={() => handleView(item)}
                        >
                          View
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <IntelDrawer 
        open={selectedIntel !== null} 
        onClose={() => setSelectedIntel(null)} 
        intel={selectedIntel} 
      />
    </div>
  );
};

export default ThreatIntel;
