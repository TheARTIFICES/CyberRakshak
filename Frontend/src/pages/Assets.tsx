import React, { useState, useEffect, useMemo } from "react";
import { Search, Filter, Server, Monitor, Shield, AlertTriangle, CheckCircle, HelpCircle, Cloud } from "lucide-react";
import { getAssets } from "../services/api";
import AssetDrawer from "../components/assets/AssetDrawer";

const Assets = () => {
  // State for real data
  const [assets, setAssets] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [groupBy, setGroupBy] = useState("None");

  // Drawer State
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [selectedAsset, setSelectedAsset] = useState<any>(null);

  // Fetch and transform data from API
  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      try {
        const data = await getAssets(0, 100);
        
        // Transform API data to match the UI requirements (criticality 1-5, etc.)
        const transformed = data.map((item: any) => {
          let crit = 1;
          let score = 200;
          
          if (item.risk === "Critical") { crit = 5; score = 850 + Math.floor(Math.random() * 150); }
          else if (item.risk === "High") { crit = 4; score = 700 + Math.floor(Math.random() * 149); }
          else if (item.risk === "Medium") { crit = 3; score = 500 + Math.floor(Math.random() * 199); }
          else if (item.risk === "Low") { crit = 2; score = 300 + Math.floor(Math.random() * 199); }
          
          return {
            ...item,
            criticality: crit,
            riskScore: score,
            missingPatches: Math.floor(Math.random() * 10), // Mocked for now if not in API
            status: "Active",
            tags: [item.cloud, item.exposure].filter(Boolean)
          };
        });
        
        setAssets(transformed);
      } catch (error) {
        console.error("Failed to load assets", error);
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, []);

  // Filter Logic
  const filteredAssets = assets.filter(asset => 
    asset.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    asset.ip.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // --- DYNAMIC CHART CALCULATIONS ---
  const countCrit5 = assets.filter(a => a.criticality === 5).length;
  const countCrit4 = assets.filter(a => a.criticality === 4).length;
  const countCrit3 = assets.filter(a => a.criticality === 3).length;
  const countCrit2 = assets.filter(a => a.criticality === 2).length;
  const countCrit1 = assets.filter(a => a.criticality === 1).length;

  const countLow = countCrit1 + countCrit2;
  const countMed = countCrit3;
  const countHigh = countCrit4;
  const countCritical = countCrit5;

  // --- GROUPING LOGIC ---
  const groupedAssets = useMemo(() => {
    if (groupBy === "None") return { "All Assets": filteredAssets };

    const groups: Record<string, any[]> = {};
    for (const asset of filteredAssets) {
      let key = "Unknown";
      if (groupBy === "Criticality") {
        const labels: Record<number, string> = { 5: "Critical [5]", 4: "High [4]", 3: "Medium [3]", 2: "Low [2]", 1: "Info [1]" };
        key = labels[asset.criticality] || "Unknown";
      } else if (groupBy === "OS") {
        key = asset.os || "Unknown";
      } else if (groupBy === "Tags") {
        const tags = asset.tags as string[] | undefined;
        if (tags && tags.length > 0) {
          for (const tag of tags) {
            if (!groups[tag]) groups[tag] = [];
            groups[tag].push(asset);
          }
          continue;
        } else {
          key = "Untagged";
        }
      }
      if (!groups[key]) groups[key] = [];
      groups[key].push(asset);
    }

    // Sort group keys for Criticality
    if (groupBy === "Criticality") {
      const order = ["Critical [5]", "High [4]", "Medium [3]", "Low [2]", "Info [1]"];
      const sorted: Record<string, any[]> = {};
      for (const k of order) {
        if (groups[k]) sorted[k] = groups[k];
      }
      return sorted;
    }
    return groups;
  }, [filteredAssets, groupBy]);

  // Helper Functions
  const getOsIcon = (os: string) => {
    const lower = (os || "").toLowerCase();
    if (lower.includes("windows")) return <Monitor className="w-4 h-4 mr-1 text-blue-500" />;
    if (lower.includes("linux") || lower.includes("ubuntu") || lower.includes("centos")) return <Server className="w-4 h-4 mr-1 text-orange-500" />;
    return <Server className="w-4 h-4 mr-1 text-slate-400" />;
  };

  const getStatusIndicator = (status: string) => {
    switch (status) {
      case "Active":
        return <span className="flex items-center"><span className="w-2 h-2 rounded-full bg-green-500 mr-2"></span> {status}</span>;
      case "Maintenance":
        return <span className="flex items-center"><span className="w-2 h-2 rounded-full bg-yellow-500 mr-2"></span> {status}</span>;
      case "Inactive":
        return <span className="flex items-center"><span className="w-2 h-2 rounded-full bg-red-500 mr-2"></span> {status}</span>;
      default:
        return <span className="flex items-center"><span className="w-2 h-2 rounded-full bg-gray-500 mr-2"></span> {status}</span>;
    }
  };

  return (
    <div className="min-h-screen bg-[#f0f2f5] dark:bg-[#050b14] text-slate-800 dark:text-white p-6">
      
      {/* TOP ANALYTICS ROW (The Dashboard) */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        
        {/* Card 1: Asset Criticality (SVG Bar Chart) */}
        <div className="bg-white dark:bg-[#1e293b] dark:border-slate-700 border border-gray-200 rounded-lg p-4 shadow-sm">
          <h3 className="text-sm font-semibold text-slate-500 dark:text-slate-400 mb-3">Asset Criticality</h3>
          <div className="w-full h-44">
            <svg viewBox="0 0 500 220" className="w-full h-full">
              <defs>
                <pattern id="grid-crit" width="500" height="40" patternUnits="userSpaceOnUse">
                  <line x1="0" y1="40" x2="500" y2="40" stroke="#e2e8f0" strokeWidth="1" strokeDasharray="3 3" className="dark:stroke-slate-700" />
                </pattern>
                <linearGradient id="gc1" x1="0" y1="1" x2="0" y2="0"><stop offset="0%" stopColor="#94a3b8" /><stop offset="100%" stopColor="#cbd5e1" /></linearGradient>
                <linearGradient id="gc2" x1="0" y1="1" x2="0" y2="0"><stop offset="0%" stopColor="#64748b" /><stop offset="100%" stopColor="#94a3b8" /></linearGradient>
                <linearGradient id="gc3" x1="0" y1="1" x2="0" y2="0"><stop offset="0%" stopColor="#3b82f6" /><stop offset="100%" stopColor="#93c5fd" /></linearGradient>
                <linearGradient id="gc4" x1="0" y1="1" x2="0" y2="0"><stop offset="0%" stopColor="#f97316" /><stop offset="100%" stopColor="#fdba74" /></linearGradient>
                <linearGradient id="gc5" x1="0" y1="1" x2="0" y2="0"><stop offset="0%" stopColor="#dc2626" /><stop offset="100%" stopColor="#f87171" /></linearGradient>
              </defs>
              <rect width="500" height="200" fill="url(#grid-crit)" />
              {(() => {
                const vals = [countCrit1, countCrit2, countCrit3, countCrit4, countCrit5];
                const labels = ["[1]", "[2]", "[3]", "[4]", "[5]"];
                const grads = ["url(#gc1)", "url(#gc2)", "url(#gc3)", "url(#gc4)", "url(#gc5)"];
                const maxV = Math.max(...vals, 1);
                const barMaxH = 150;
                return vals.map((v, i) => {
                  const h = Math.max(8, (v / maxV) * barMaxH);
                  const x = 40 + i * 95;
                  return (
                    <React.Fragment key={i}>
                      <rect x={x} y={180 - h} width="30" height={h} fill={grads[i]} rx="4" />
                      <text x={x + 15} y={180 - h - 8} fill="#1e293b" fontSize="11" textAnchor="middle" fontWeight="bold" className="dark:fill-white">{v}</text>
                      <text x={x + 15} y="198" fill="#64748b" fontSize="10" textAnchor="middle" className="dark:fill-slate-400">{labels[i]}</text>
                    </React.Fragment>
                  );
                });
              })()}
            </svg>
          </div>
        </div>

        {/* Card 2: Detection Score (SVG Bar Chart) */}
        <div className="bg-white dark:bg-[#1e293b] dark:border-slate-700 border border-gray-200 rounded-lg p-4 shadow-sm">
          <h3 className="text-sm font-semibold text-slate-500 dark:text-slate-400 mb-3">Detection Score</h3>
          <div className="w-full h-44">
            <svg viewBox="0 0 500 220" className="w-full h-full">
              <defs>
                <pattern id="grid-detect" width="500" height="40" patternUnits="userSpaceOnUse">
                  <line x1="0" y1="40" x2="500" y2="40" stroke="#e2e8f0" strokeWidth="1" strokeDasharray="3 3" className="dark:stroke-slate-700" />
                </pattern>
                <linearGradient id="gd1" x1="0" y1="1" x2="0" y2="0"><stop offset="0%" stopColor="#c4b5fd" /><stop offset="100%" stopColor="#ddd6fe" /></linearGradient>
                <linearGradient id="gd2" x1="0" y1="1" x2="0" y2="0"><stop offset="0%" stopColor="#a78bfa" /><stop offset="100%" stopColor="#c4b5fd" /></linearGradient>
                <linearGradient id="gd3" x1="0" y1="1" x2="0" y2="0"><stop offset="0%" stopColor="#7c3aed" /><stop offset="100%" stopColor="#a78bfa" /></linearGradient>
                <linearGradient id="gd4" x1="0" y1="1" x2="0" y2="0"><stop offset="0%" stopColor="#6d28d9" /><stop offset="100%" stopColor="#8b5cf6" /></linearGradient>
              </defs>
              <rect width="500" height="200" fill="url(#grid-detect)" />
              {(() => {
                const vals = [countLow, countMed, countHigh, countCritical];
                const labels = ["Low", "Medium", "High", "Critical"];
                const grads = ["url(#gd1)", "url(#gd2)", "url(#gd3)", "url(#gd4)"];
                const maxV = Math.max(...vals, 1);
                const barMaxH = 150;
                return vals.map((v, i) => {
                  const h = Math.max(8, (v / maxV) * barMaxH);
                  const x = 55 + i * 110;
                  return (
                    <React.Fragment key={i}>
                      <rect x={x} y={180 - h} width="30" height={h} fill={grads[i]} rx="4" />
                      <text x={x + 15} y={180 - h - 8} fill="#1e293b" fontSize="11" textAnchor="middle" fontWeight="bold" className="dark:fill-white">{v}</text>
                      <text x={x + 15} y="198" fill="#64748b" fontSize="10" textAnchor="middle" className="dark:fill-slate-400">{labels[i]}</text>
                    </React.Fragment>
                  );
                });
              })()}
            </svg>
          </div>
        </div>

        {/* Card 3: Total Assets (The CSS Ring) */}
        <div className="bg-white dark:bg-[#1e293b] dark:border-slate-700 border border-gray-200 rounded-lg p-4 shadow-sm">
          <h3 className="text-sm font-semibold text-slate-500 dark:text-slate-400 mb-3">Total Assets</h3>
          <div className="w-full h-40 flex items-center justify-center relative mt-4">
            {/* The CSS Donut */}
            <div className="w-32 h-32 rounded-full" style={{
              background: 'conic-gradient(#8b5cf6 0% 65%, #cbd5e1 65% 100%)',
              padding: '12px'
            }}>
              <div className="w-full h-full bg-white dark:bg-[#1e293b] rounded-full flex flex-col items-center justify-center">
                <span className="text-3xl font-bold text-slate-800 dark:text-white">{assets.length}</span>
                <span className="text-[10px] text-slate-400 dark:text-slate-400 uppercase tracking-wide">Total Assets</span>
              </div>
            </div>
            {/* Legend (Floated Right) */}
            <div className="absolute right-0 top-1/2 -translate-y-1/2 flex flex-col gap-1 text-[10px] text-slate-500 dark:text-slate-400">
              <div className="flex items-center gap-1"><div className="w-2 h-2 bg-purple-500 rounded-sm"></div> High</div>
              <div className="flex items-center gap-1"><div className="w-2 h-2 bg-slate-300 rounded-sm"></div> Low</div>
            </div>
          </div>
        </div>
      </div>

      {/* DATA GRID */}
      <div className="bg-white dark:bg-[#1e293b] dark:border-slate-700 border border-gray-200 rounded-lg shadow-sm overflow-hidden">
        {/* Controls */}
        <div className="flex justify-between items-center p-4 border-b border-gray-200 dark:border-slate-700">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
            <input
              type="text"
              placeholder="Search by name or IP..."
              className="bg-white dark:bg-[#0f172a] border border-gray-200 dark:border-slate-700 rounded px-10 py-1.5 text-sm focus:outline-none focus:ring-1 focus:ring-blue-500 dark:text-white w-64"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <div className="flex items-center">
            <Filter className="w-4 h-4 mr-2 text-gray-400" />
            <select 
              className="bg-white dark:bg-[#0f172a] border border-gray-200 dark:border-slate-700 rounded px-3 py-1.5 text-sm focus:outline-none focus:ring-1 focus:ring-blue-500 dark:text-white"
              value={groupBy}
              onChange={(e) => setGroupBy(e.target.value)}
            >
              <option value="None">Group By: None</option>
              <option value="Criticality">Criticality</option>
              <option value="OS">Operating System</option>
              <option value="Tags">Tags</option>
            </select>
          </div>
        </div>

        {/* Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-gray-50 dark:bg-[#1e293b] border-b border-gray-200 dark:border-slate-700">
                <th className="p-3 text-left font-bold text-gray-500 dark:text-slate-300 uppercase tracking-wider text-xs">Asset Name</th>
                <th className="p-3 text-left font-bold text-gray-500 dark:text-slate-300 uppercase tracking-wider text-xs">Status</th>
                <th className="p-3 text-left font-bold text-gray-500 dark:text-slate-300 uppercase tracking-wider text-xs">Criticality</th>
                <th className="p-3 text-left font-bold text-gray-500 dark:text-slate-300 uppercase tracking-wider text-xs">Risk Score</th>
                <th className="p-3 text-left font-bold text-gray-500 dark:text-slate-300 uppercase tracking-wider text-xs">OS</th>
                <th className="p-3 text-left font-bold text-gray-500 dark:text-slate-300 uppercase tracking-wider text-xs">Missing Patches</th>
                <th className="p-3 text-left font-bold text-gray-500 dark:text-slate-300 uppercase tracking-wider text-xs">Tags</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={7} className="p-8 text-center text-slate-500">Loading assets...</td>
                </tr>
              ) : filteredAssets.length === 0 ? (
                <tr>
                  <td colSpan={7} className="p-8 text-center text-slate-500 opacity-60">No assets found matching criteria.</td>
                </tr>
              ) : (
                Object.entries(groupedAssets).map(([groupName, groupAssets]) => (
                  <React.Fragment key={groupName}>
                    {groupBy !== "None" && (
                      <tr className="bg-slate-100 dark:bg-slate-800/70">
                        <td colSpan={7} className="px-4 py-2 text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-300">
                          {groupName} <span className="text-slate-400 dark:text-slate-500 font-normal">({groupAssets.length})</span>
                        </td>
                      </tr>
                    )}
                    {groupAssets.map((asset: any) => (
                      <tr key={asset.id} className="border-b border-gray-100 dark:border-slate-700 hover:bg-gray-50 dark:hover:bg-slate-800 transition">
                        <td className="p-3">
                          <div className="flex items-center">
                            <Server className="w-4 h-4 mr-2 text-slate-500" />
                            <div>
                              <div 
                                className="font-semibold text-blue-600 hover:underline cursor-pointer"
                                onClick={() => {
                                  setSelectedAsset(asset);
                                  setDrawerOpen(true);
                                }}
                              >
                                {asset.name}
                              </div>
                              <div className="text-gray-500 dark:text-slate-400 text-xs">{asset.ip}</div>
                            </div>
                          </div>
                        </td>
                        <td className="p-3">
                          {getStatusIndicator(asset.status)}
                        </td>
                        <td className="p-3">
                          <div className={`w-6 h-6 flex items-center justify-center text-xs font-bold text-white rounded ${
                            asset.criticality === 5 ? "bg-red-500" : 
                            asset.criticality === 4 ? "bg-orange-500" : 
                            "bg-yellow-500"
                          }`}>
                            {asset.criticality}
                          </div>
                        </td>
                        <td className="p-3">
                          <span className="border border-slate-200 dark:border-slate-600 rounded-full px-2 py-1 text-xs font-medium">
                            {asset.riskScore}
                          </span>
                        </td>
                        <td className="p-3 flex items-center">
                          {getOsIcon(asset.os)}
                          <span className="truncate max-w-[120px]" title={asset.os}>{asset.os}</span>
                        </td>
                        <td className="p-3 text-slate-800 dark:text-white">{asset.missingPatches}</td>
                        <td className="p-3">
                          <div className="flex flex-wrap gap-1">
                            {asset.tags && asset.tags.map((tag: string, index: number) => (
                              <span key={index} className="bg-gray-100 dark:bg-slate-700 text-gray-600 dark:text-slate-300 text-xs px-2 py-0.5 rounded">
                                {tag}
                              </span>
                            ))}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </React.Fragment>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Asset Drawer for details */}
      <AssetDrawer
        open={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        asset={selectedAsset}
      />
    </div>
  );
};

export default Assets;
