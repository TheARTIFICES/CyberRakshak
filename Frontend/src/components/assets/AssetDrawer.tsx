import React, { useState, useEffect } from "react";
import { X, Shield, AlertTriangle, Activity, Server, Cloud, Globe } from "lucide-react";
import { getVulnerabilities } from "../../services/api";

interface Props {
  open: boolean;
  onClose: () => void;
  asset: any;
}

const AssetDrawer = ({ open, onClose, asset }: Props) => {
  const [vulnerabilities, setVulnerabilities] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  // Fetch vulnerabilities when asset changes or drawer opens
  useEffect(() => {
    if (open && asset) {
      fetchAssetVulns();
    }
  }, [open, asset]);

  const fetchAssetVulns = async () => {
    setLoading(true);
    try {
      // Use the asset name or IP to filter vulnerabilities
      // The backend 'search' parameter checks against asset name/ip
      const query = asset.name || asset.ip;
      const data = await getVulnerabilities(0, 50, { search: query });
      setVulnerabilities(data);
    } catch (error) {
      console.error("Failed to fetch asset vulnerabilities:", error);
      setVulnerabilities([]);
    } finally {
      setLoading(false);
    }
  };

  if (!open || !asset) return null;

  // Helper to determine severity color
  const getSeverityColor = (severity: string) => {
    const s = severity.toLowerCase();
    if (s === "critical") return "text-red-600 bg-red-100 dark:bg-red-900/30 dark:text-red-400";
    if (s === "high") return "text-orange-600 bg-orange-100 dark:bg-orange-900/30 dark:text-orange-400";
    if (s === "medium") return "text-yellow-600 bg-yellow-100 dark:bg-yellow-900/30 dark:text-yellow-400";
    return "text-blue-600 bg-blue-100 dark:bg-blue-900/30 dark:text-blue-400";
  };

  // Generate dynamic summary
  const criticalCount = vulnerabilities.filter(v => v.severity.toLowerCase() === "critical").length;
  const highCount = vulnerabilities.filter(v => v.severity.toLowerCase() === "high").length;
  
  const aiSummary = criticalCount > 0 
    ? `This asset is under CRITICAL threat. It has ${criticalCount} critical vulnerabilities that could allow remote code execution. Immediate patching is required.`
    : highCount > 0
    ? `This asset presents ELEVATED risk with ${highCount} high-severity issues. Attackers could leverage these for privilege escalation.`
    : vulnerabilities.length > 0
    ? `This asset has ${vulnerabilities.length} moderate/low issues. Routine maintenance recommended.`
    : `No significant vulnerabilities detected. Asset appears healthy.`;

  return (
    <div className="fixed inset-0 z-50 flex justify-end">
      
      {/* BACKDROP */}
      <div 
        className="fixed inset-0 bg-black/40 backdrop-blur-sm transition-opacity" 
        onClick={onClose} 
      />

      {/* DRAWER */}
      <div className="relative w-full sm:w-[480px] h-full bg-white dark:bg-slate-900 shadow-2xl overflow-y-auto animate-slide-left border-l dark:border-slate-700">
        
        {/* HEADER */}
        <div className="sticky top-0 bg-white/95 dark:bg-slate-900/95 backdrop-blur z-10 px-6 py-4 border-b border-gray-100 dark:border-slate-800 flex justify-between items-start">
          <div>
            <h2 className="text-xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <Server className="w-5 h-5 text-blue-600" />
              {asset.name}
            </h2>
            <p className="text-sm text-slate-500 dark:text-slate-400 font-mono mt-1">{asset.ip}</p>
          </div>
          <button 
            onClick={onClose}
            className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full transition-colors text-slate-500"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 space-y-8">

          {/* SECTION: Asset Overview */}
          <div>
            <h3 className="text-sm font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-3 flex items-center gap-2">
              <Activity className="w-4 h-4" /> Overview
            </h3>
            <div className="bg-slate-50 dark:bg-slate-800/50 rounded-xl p-4 grid grid-cols-2 gap-4 text-sm">
              <div>
                <p className="text-slate-500 dark:text-slate-400 text-xs">Operating System</p>
                <p className="font-medium mt-0.5">{asset.os}</p>
              </div>
              <div>
                <p className="text-slate-500 dark:text-slate-400 text-xs">Exposure</p>
                <div className="flex items-center gap-1.5 mt-0.5">
                  {asset.exposure === "Internet-facing" ? (
                    <Globe className="w-3.5 h-3.5 text-red-500" />
                  ) : (
                    <Shield className="w-3.5 h-3.5 text-green-500" />
                  )}
                  <span className="font-medium">{asset.exposure}</span>
                </div>
              </div>
              <div>
                <p className="text-slate-500 dark:text-slate-400 text-xs">Risk Level</p>
                <p className={`font-medium mt-0.5 ${
                  asset.risk === 'Critical' ? 'text-red-600' : 
                  asset.risk === 'High' ? 'text-orange-600' : 'text-blue-600'
                }`}>
                  {asset.risk}
                </p>
              </div>
              <div>
                <p className="text-slate-500 dark:text-slate-400 text-xs">Environment</p>
                <div className="flex items-center gap-1.5 mt-0.5">
                  <Cloud className="w-3.5 h-3.5 text-purple-500" />
                  <span className="font-medium">{asset.cloud || "On-Prem"}</span>
                </div>
              </div>
            </div>
          </div>

          {/* SECTION: AI Analysis */}
          <div>
            <h3 className="text-sm font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-3 flex items-center gap-2">
              <Shield className="w-4 h-4" /> AI Threat Assessment
            </h3>
            <div className="p-4 rounded-xl bg-blue-50 dark:bg-blue-900/10 border border-blue-100 dark:border-blue-800">
              <p className="text-sm text-slate-700 dark:text-slate-300 leading-relaxed">
                {aiSummary}
              </p>
            </div>
          </div>

          {/* SECTION: Vulnerabilities (Updated with Scroll) */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400 flex items-center gap-2">
                <AlertTriangle className="w-4 h-4" /> Vulnerabilities
              </h3>
              <span className="text-xs bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded-full text-slate-500">
                {vulnerabilities.length} Found
              </span>
            </div>
            
            {loading ? (
              <div className="text-center py-8 opacity-50 text-sm">Loading security findings...</div>
            ) : vulnerabilities.length === 0 ? (
              <div className="text-center py-8 bg-slate-50 dark:bg-slate-800/50 rounded-xl text-slate-500 text-sm">
                No vulnerabilities detected for this asset.
              </div>
            ) : (
              <div className="space-y-3 max-h-80 overflow-y-auto pr-2 custom-scrollbar">
                {vulnerabilities.map((vuln, idx) => (
                  <div key={idx} className="p-3 rounded-lg border border-slate-100 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition">
                    <div className="flex justify-between items-start mb-1">
                      <span className="font-mono text-xs font-semibold text-blue-600 dark:text-blue-400">
                        {vuln.cve || "NON-CVE"}
                      </span>
                      <span className={`text-[10px] px-2 py-0.5 rounded-full font-medium ${getSeverityColor(vuln.severity)}`}>
                        {vuln.severity}
                      </span>
                    </div>
                    <p className="text-sm font-medium text-slate-800 dark:text-slate-200 line-clamp-1">{vuln.title}</p>
                    <p className="text-xs text-slate-500 mt-1">CVSS: {vuln.cvss}</p>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* SECTION: Attack Path */}
          <div>
            <h3 className="text-sm font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-3">
              Attack Path Relevance
            </h3>
            {asset.exposure === "Internet-facing" ? (
              <div className="p-4 rounded-xl bg-red-50 dark:bg-red-900/10 border border-red-100 dark:border-red-900/30 text-sm text-red-800 dark:text-red-300">
                <p className="font-semibold mb-1">High Exposure Node</p>
                <p className="opacity-90">
                  This asset is directly exposed to the internet. If compromised, it can serve as an initial foothold for lateral movement into the internal network ({asset.ip}).
                </p>
              </div>
            ) : (
              <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800 text-sm text-slate-600 dark:text-slate-400">
                <p>
                  Internal node. Accessible only via lateral movement or compromised VPN credentials.
                </p>
              </div>
            )}
          </div>

          {/* ACTIONS */}
          <div className="pt-4 border-t dark:border-slate-800 flex gap-3">
            <button className="flex-1 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-medium transition shadow-sm">
              Assign Owner
            </button>
            <button className="flex-1 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 rounded-lg text-sm font-medium transition">
              Add to Watchlist
            </button>
          </div>

        </div>
      </div>
    </div>
  );
};

export default AssetDrawer;
