import React, { useState, useEffect } from "react";
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

  // Max values for bar scaling
  const critMax = Math.max(countCrit1, countCrit2, countCrit3, countCrit4, countCrit5, 1);
  const detectMax = Math.max(countLow, countMed, countHigh, countCritical, 1);

  const getBarHeight = (value: number, max: number) => {
    return `${Math.max(4, (value / max) * 100)}%`;
  };

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
        
        {/* Card 1: Asset Criticality (The Bar Chart) */}
        <div className="bg-white dark:bg-[#1e293b] dark:border-slate-700 border border-gray-200 rounded-lg p-4 shadow-sm">
          <h3 className="text-sm font-semibold text-slate-500 dark:text-slate-400 mb-3">Asset Criticality</h3>
          <div className="w-full h-40 flex items-end justify-between px-4 gap-2 mt-4">
            {[countCrit1, countCrit2, countCrit3, countCrit4].map((count, i) => (
              <div key={i} className="flex flex-col items-center gap-1 w-full group">
                <div className="text-xs font-bold text-slate-400 dark:text-slate-500 mb-1">{count}</div>
                <div 
                  className={`w-full rounded-t-sm transition-all duration-500 ${i < 2 ? "bg-slate-200 dark:bg-slate-700" : "bg-blue-200 dark:bg-blue-900/40"}`} 
                  style={{ height: getBarHeight(count, critMax) }}
                ></div>
                <div className="text-xs font-bold text-slate-400 bg-slate-100 dark:bg-slate-800 px-1.5 py-0.5 rounded">[{i + 1}]</div>
              </div>
            ))}
            
            {/* Bar 5 (Critical) */}
            <div className="flex flex-col items-center gap-1 w-full group">
              <div className="text-xs font-bold text-red-600 mb-1">{countCrit5}</div>
              <div className="w-full bg-red-500 rounded-t-sm shadow-lg shadow-red-200 dark:shadow-none transition-all duration-500" 
                   style={{ height: getBarHeight(countCrit5, critMax) }}></div>
              <div className="text-xs font-bold text-white bg-red-500 px-1.5 py-0.5 rounded">[5]</div>
            </div>
          </div>
        </div>

        {/* Card 2: Detection Score (The Purple Histogram) */}
        <div className="bg-white dark:bg-[#1e293b] dark:border-slate-700 border border-gray-200 rounded-lg p-4 shadow-sm">
          <h3 className="text-sm font-semibold text-slate-500 dark:text-slate-400 mb-3">Detection Score</h3>
          <div className="w-full h-40 flex items-end justify-between px-8 gap-4 mt-4">
            <div className="flex flex-col items-center w-full">
              <div className="text-xs font-bold text-purple-400 dark:text-purple-300 mb-1">{countLow}</div>
              <div className="w-full bg-purple-200 dark:bg-purple-900/30 rounded-t-sm transition-all duration-500" style={{ height: getBarHeight(countLow, detectMax) }}></div>
              <span className="text-[10px] uppercase text-slate-400 mt-2">Low</span>
            </div>
            <div className="flex flex-col items-center w-full">
              <div className="text-xs font-bold text-purple-500 dark:text-purple-300 mb-1">{countMed}</div>
              <div className="w-full bg-purple-300 dark:bg-purple-800/50 rounded-t-sm transition-all duration-500" style={{ height: getBarHeight(countMed, detectMax) }}></div>
              <span className="text-[10px] uppercase text-slate-400 mt-2">Med</span>
            </div>
            <div className="flex flex-col items-center w-full">
              <div className="text-xs font-bold text-purple-600 dark:text-purple-400 mb-1">{countHigh}</div>
              <div className="w-full bg-purple-400 dark:bg-purple-600 rounded-t-sm transition-all duration-500" style={{ height: getBarHeight(countHigh, detectMax) }}></div>
              <span className="text-[10px] uppercase text-slate-400 mt-2">High</span>
            </div>
            <div className="flex flex-col items-center w-full">
              <div className="text-xs font-bold text-purple-700 dark:text-purple-400 mb-1">{countCritical}</div>
              <div className="w-full bg-purple-600 rounded-t-sm shadow-lg shadow-purple-200 dark:shadow-none transition-all duration-500" style={{ height: getBarHeight(countCritical, detectMax) }}></div>
              <span className="text-[10px] uppercase text-slate-400 mt-2">Crit</span>
            </div>
          </div>
        </div>

        {/* Card 3: Risk Score (The CSS Ring) */}
        <div className="bg-white dark:bg-[#1e293b] dark:border-slate-700 border border-gray-200 rounded-lg p-4 shadow-sm">
          <h3 className="text-sm font-semibold text-slate-500 dark:text-slate-400 mb-3">Risk Score</h3>
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
                filteredAssets.map((asset) => (
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
