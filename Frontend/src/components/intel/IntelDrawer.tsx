import React from "react";
import { Shield, AlertTriangle, Bug, ExternalLink } from "lucide-react";

interface Props {
  open: boolean;
  onClose: () => void;
  intel: any;
}

const IntelDrawer = ({ open, onClose, intel }: Props) => {
  if (!open || !intel) return null;

  // Helper to clean HTML tags but preserve readability (Same as AttackNodeDrawer)
  const cleanHtml = (html: string) => {
    if (!html) return "No description provided.";
    
    let text = html.replace(/<\/(p|div|h[1-6]|li|br)>/gi, "\n");
    text = text.replace(/<li>/gi, "• ");
    text = text.replace(/<[^>]+>/g, "");
    text = text
      .replace(/&nbsp;/g, " ")
      .replace(/&amp;/g, "&")
      .replace(/&lt;/g, "<")
      .replace(/&gt;/g, ">")
      .replace(/&quot;/g, '"');

    return text.trim();
  };

  return (
    <div className="fixed inset-0 z-50 flex">

      {/* BACKDROP */}
      <div 
        className="flex-1 bg-black/40 backdrop-blur-sm" 
        onClick={onClose} 
      />

      {/* DRAWER */}
      <div className="w-full sm:w-[450px] lg:w-[600px] bg-white dark:bg-slate-800 shadow-2xl p-6 overflow-y-auto animate-slide-left border-l dark:border-slate-700">

        {/* HEADER */}
        <div className="flex justify-between items-start mb-6 border-b dark:border-slate-700 pb-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <Shield className="w-5 h-5 text-red-500" />
              <span className="text-xs uppercase font-bold text-slate-500 dark:text-slate-400">
                Threat Intelligence
              </span>
            </div>
            <h2 className="text-xl font-bold text-slate-900 dark:text-white leading-tight">
              {intel.cve}
            </h2>
            <p className="opacity-60 text-xs font-mono mt-1">Source: NVD / CISA</p>
          </div>

          <button
            onClick={onClose}
            className="p-2 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-full transition"
          >
            ✕
          </button>
        </div>

        {/* SECTION: KEY METRICS */}
        <div className="grid grid-cols-2 gap-4 mb-6">
          <div className="p-3 bg-slate-50 dark:bg-slate-900/50 rounded-lg border dark:border-slate-700">
            <span className="text-xs text-slate-500 uppercase font-semibold">Severity</span>
            <div className="mt-1 flex items-center gap-2">
              <div className={`w-2 h-2 rounded-full ${
                intel.severity?.toUpperCase() === 'CRITICAL' ? 'bg-red-600' :
                intel.severity?.toUpperCase() === 'HIGH' ? 'bg-orange-500' : 'bg-yellow-500'
              }`}></div>
              <span className="font-bold text-slate-700 dark:text-slate-200">
                {intel.severity || "Unknown"}
              </span>
            </div>
          </div>

          <div className="p-3 bg-slate-50 dark:bg-slate-900/50 rounded-lg border dark:border-slate-700">
            <span className="text-xs text-slate-500 uppercase font-semibold">Exploit Status</span>
            <div className="mt-1 font-bold text-slate-700 dark:text-slate-200">
              {intel.exploit || "None"}
            </div>
          </div>
        </div>

        {/* SECTION: SUMMARY / DESCRIPTION */}
        <div className="mb-6">
          <h3 className="font-semibold mb-2 flex items-center gap-2">
            <Bug className="w-4 h-4 text-slate-500" /> Vulnerability Summary
          </h3>
          <div className="text-xs font-mono opacity-80 leading-relaxed whitespace-pre-wrap bg-slate-50 dark:bg-slate-900/50 p-3 rounded-lg border dark:border-slate-700 overflow-x-auto">
            {cleanHtml(intel.summary)}
          </div>
        </div>

        {/* SECTION: AFFECTED PRODUCTS (Static Mock) */}
        <div className="mb-6">
          <h3 className="font-semibold mb-2">Affected Products</h3>
          <ul className="list-disc list-inside text-sm opacity-80 space-y-1 bg-slate-50 dark:bg-slate-900/30 p-3 rounded-lg border dark:border-slate-700">
            <li>Apache HTTP Server 2.4.x</li>
            <li>Ubuntu Server 22.04 LTS</li>
            <li>RedHat Enterprise Linux 9</li>
          </ul>
        </div>

        {/* SECTION: MITRE ATT&CK (Static Mock) */}
        <div className="mb-6">
          <h3 className="font-semibold mb-2">MITRE ATT&CK Techniques</h3>
          <div className="flex flex-wrap gap-2">
            <span className="px-2 py-1 bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 text-xs rounded border border-blue-200 dark:border-blue-800">
              T1190 - Exploit Public-Facing Application
            </span>
            <span className="px-2 py-1 bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 text-xs rounded border border-blue-200 dark:border-blue-800">
              T1059 - Command Execution
            </span>
          </div>
        </div>

        {/* SECTION: THREAT ACTORS (Static Mock) */}
        <div className="mb-6">
          <h3 className="font-semibold mb-2">Threat Actor Associations</h3>
          <div className="text-sm opacity-80 p-3 border dark:border-slate-700 rounded-lg">
            <p className="mb-2">Groups known to leverage this vulnerability:</p>
            <ul className="list-disc list-inside space-y-1">
              <li>APT28 (Fancy Bear)</li>
              <li>Lazarus Group</li>
            </ul>
          </div>
        </div>

        {/* SECTION: AI ANALYSIS */}
        <div className="mt-8 pt-6 border-t dark:border-slate-700">
          <h3 className="font-semibold flex items-center gap-2 mb-2">
            <Shield className="w-4 h-4 text-purple-500" /> AI Strategic Analysis
          </h3>
          <p className="text-sm opacity-70 italic">
            "This vulnerability is highly critical due to confirmed exploitation in the wild. 
            Attackers can leverage it for remote code execution and persistent access. 
            Immediate patching or mitigation (WAF rules) is recommended."
          </p>
        </div>

        {/* ACTIONS */}
        <div className="flex gap-3 pt-4 mt-6">
          <button className="flex-1 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-medium transition shadow-sm">
            Add to Watchlist
          </button>
          <button className="flex-1 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 rounded-lg text-sm font-medium transition flex items-center justify-center gap-2">
            <ExternalLink className="w-4 h-4" /> View NVD
          </button>
        </div>

      </div>
    </div>
  );
};

export default IntelDrawer;
