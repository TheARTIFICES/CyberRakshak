import React from "react";
import { Shield, AlertTriangle, Server, Network } from "lucide-react";

interface Props {
  open: boolean;
  onClose: () => void;
  node: any;
}

const AttackNodeDrawer = ({ open, onClose, node }: Props) => {
  if (!open || !node) return null;

  const data = node.data || {};
  const isVuln = data.node_type === "Vulnerability";
  const isAsset = data.node_type === "Asset";
  const isService = data.node_type === "Service";

  // Helper to clean HTML tags but preserve readability
  const cleanHtml = (html: string) => {
    if (!html) return "No description provided.";
    
    // 1. Replace block-level closing tags with newlines to preserve structure
    let text = html.replace(/<\/(p|div|h[1-6]|li|br)>/gi, "\n");
    
    // 2. Replace list item opening tags with bullet points
    text = text.replace(/<li>/gi, "• ");
    
    // 3. Strip all remaining HTML tags
    text = text.replace(/<[^>]+>/g, "");
    
    // 4. Decode common HTML entities (basic)
    text = text
      .replace(/&nbsp;/g, " ")
      .replace(/&amp;/g, "&")
      .replace(/&lt;/g, "<")
      .replace(/&gt;/g, ">")
      .replace(/&quot;/g, '"');

    // 5. Trim extra whitespace
    return text.trim();
  };

  return (
    <div className="fixed inset-0 z-50 flex">

      {/* BACKDROP */}
      <div className="flex-1 bg-black/40 backdrop-blur-sm" onClick={onClose} />

      {/* DRAWER */}
      <div className="w-full sm:w-[450px] lg:w-[600px] bg-white dark:bg-slate-800 shadow-2xl p-6 overflow-y-auto animate-slide-left border-l dark:border-slate-700">

        {/* HEADER */}
        <div className="flex justify-between items-start mb-6 border-b dark:border-slate-700 pb-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              {isVuln && <AlertTriangle className="w-5 h-5 text-red-500" />}
              {isAsset && <Server className="w-5 h-5 text-blue-500" />}
              {isService && <Network className="w-5 h-5 text-green-500" />}
              <span className="text-xs uppercase font-bold text-slate-500 dark:text-slate-400">
                {data.node_type || "Node Details"}
              </span>
            </div>
            <h2 className="text-xl font-bold text-slate-900 dark:text-white leading-tight break-all">
              {data.label}
            </h2>
            <p className="opacity-60 text-xs font-mono mt-1">ID: {node.id}</p>
          </div>

          <button
            onClick={onClose}
            className="p-2 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-full transition"
          >
            ✕
          </button>
        </div>

        {/* SECTION: VULNERABILITY DETAILS */}
        {isVuln && (
          <div className="space-y-6">
            <div className="flex gap-2">
              <span className={`px-3 py-1 rounded-full text-xs font-bold text-white ${
                data.severity === "Critical" ? "bg-red-600" :
                data.severity === "High" ? "bg-orange-500" :
                data.severity === "Medium" ? "bg-yellow-500" : "bg-blue-500"
              }`}>
                {data.severity || "Info"}
              </span>
              {data.cve && data.cve !== "N/A" && (
                <span className="px-3 py-1 rounded-full text-xs font-bold bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300">
                  {data.cve}
                </span>
              )}
            </div>

            <div>
              <h3 className="font-semibold mb-2">Description</h3>
              {/* UPDATED: font-mono and overflow-x-auto for text tables */}
              <div className="text-xs font-mono opacity-80 leading-relaxed whitespace-pre-wrap bg-slate-50 dark:bg-slate-900/50 p-3 rounded-lg border dark:border-slate-700 overflow-x-auto">
                {cleanHtml(data.description)}
              </div>
            </div>

            <div>
              <h3 className="font-semibold mb-2 text-green-600 dark:text-green-400">Remediation</h3>
              {/* UPDATED: font-mono for technical steps */}
              <div className="text-xs font-mono opacity-80 p-3 bg-green-50 dark:bg-green-900/10 border border-green-100 dark:border-green-900/30 rounded-lg whitespace-pre-wrap overflow-x-auto">
                {cleanHtml(data.remediation)}
              </div>
            </div>

            <div>
              <h3 className="font-semibold mb-2">Attack Path Context</h3>
              <p className="text-sm opacity-70">
                This vulnerability exists on a service that is part of the active attack surface. 
                Compromising this node allows attackers to proceed to connected assets.
              </p>
            </div>
          </div>
        )}

        {/* SECTION: ASSET DETAILS */}
        {isAsset && (
          <div className="space-y-6">
            <div className="p-4 bg-blue-50 dark:bg-blue-900/10 rounded-xl border border-blue-100 dark:border-blue-800">
              <h3 className="font-semibold text-blue-700 dark:text-blue-300 mb-1">Target Asset</h3>
              <p className="text-sm opacity-80">
                This is the root node of the scan. All paths originate from external access to this IP/Domain.
              </p>
            </div>
            <ul className="space-y-2 text-sm">
              <li className="flex justify-between border-b dark:border-slate-700 pb-2">
                <span className="opacity-60">IP Address</span>
                <span className="font-mono">{data.ip}</span>
              </li>
              <li className="flex justify-between border-b dark:border-slate-700 pb-2">
                <span className="opacity-60">Type</span>
                <span>Primary Target</span>
              </li>
            </ul>
          </div>
        )}

        {/* SECTION: SERVICE / TECH DETAILS */}
        {!isVuln && !isAsset && (
          <div className="space-y-6">
            <div>
              <h3 className="font-semibold mb-2">Node Information</h3>
              <p className="text-sm opacity-80">
                This represents a detected service or technology stack component.
                Vulnerabilities linked to this node affect the specific version running on the port.
              </p>
            </div>
            
            {data.service && (
               <div className="bg-slate-100 dark:bg-slate-700 p-3 rounded-lg text-sm font-mono">
                 Service: {data.service}
               </div>
            )}
          </div>
        )}

        {/* SECTION: AI ANALYSIS (Generic for all) */}
        <div className="mt-8 pt-6 border-t dark:border-slate-700">
          <h3 className="font-semibold flex items-center gap-2 mb-2">
            <Shield className="w-4 h-4 text-purple-500" /> AI Strategic Analysis
          </h3>
          <p className="text-sm opacity-70 italic">
            "Prioritize securing this node. Based on the graph topology, it serves as a critical junction. 
            {isVuln ? "Patching this specific vulnerability will break the attack chain." : "Hardening this service reduces the attack surface significantly."}"
          </p>
        </div>

      </div>
    </div>
  );
};

export default AttackNodeDrawer;
