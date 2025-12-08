import React, { useState, useEffect } from "react";
import { useSearchParams } from "react-router-dom";
import AttackGraph from "../components/attack/AttackGraph";
import AttackNodeDrawer from "../components/attack/AttackNodeDrawer"; // Import the Drawer
import { Search, RefreshCw, AlertCircle } from "lucide-react";
import { getJobHistory, getScanGraph } from "../services/api";

const AttackPath = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const urlJobId = searchParams.get("job_id") || "";
  
  const [jobId, setJobId] = useState(urlJobId);
  const [graphData, setGraphData] = useState<any>({ nodes: [], edges: [] });
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [severityFilter, setSeverityFilter] = useState("All");

  // Drawer State (Lifted Up)
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [selectedNode, setSelectedNode] = useState<any>(null);

  // 1. Load Latest Job if none provided
  useEffect(() => {
    const init = async () => {
      if (jobId) {
        loadGraph(jobId);
        return;
      }

      try {
        const jobs = await getJobHistory(0, 1);
        const latestCompleted = jobs.find(j => j.status === "completed" || j.status === "partial_success");
        if (latestCompleted) {
          setJobId(latestCompleted.job_id);
          setSearchParams({ job_id: latestCompleted.job_id });
          loadGraph(latestCompleted.job_id);
        } else {
          setLoading(false);
        }
      } catch (e) {
        console.error("Failed to load initial job", e);
        setLoading(false);
      }
    };
    init();
  }, []);

  // 2. Fetch Graph Data for Table
  const loadGraph = async (id: string) => {
    setLoading(true);
    try {
      const data = await getScanGraph(id);
      if (data && data.nodes) {
        setGraphData(data);
      }
    } catch (error) {
      console.error("Failed to fetch graph data:", error);
    } finally {
      setLoading(false);
    }
  };

  // 3. Handle Node Selection (From Graph or Table)
  const handleNodeSelect = (node: any) => {
    setSelectedNode(node);
    setDrawerOpen(true);
  };

  // 4. Transform Graph Edges into Table Rows
  const getTableData = () => {
    if (!graphData.edges || !graphData.nodes) return [];

    const nodeMap = new Map(graphData.nodes.map((n: any) => [n.id, n]));

    return graphData.edges.map((edge: any) => {
      const sourceNode = nodeMap.get(edge.source);
      const targetNode = nodeMap.get(edge.target);

      // Determine severity based on target node type/style
      let severity = "Low";
      const targetColor = targetNode?.style?.background || "";
      if (targetColor.includes("#ef4444") || targetColor.includes("#991b1b")) severity = "Critical"; // Red
      else if (targetColor.includes("#f97316")) severity = "High"; // Orange
      else if (targetColor.includes("#facc15")) severity = "Medium"; // Yellow

      return {
        id: edge.id,
        sourceLabel: sourceNode?.data?.label || edge.source,
        targetLabel: targetNode?.data?.label || edge.target,
        sourceNode: sourceNode, // Store full object for click handler
        targetNode: targetNode, // Store full object for click handler
        type: targetNode?.type === "output" ? "Exploit Vulnerability" : "Network Connection",
        severity,
        probability: targetNode?.type === "output" ? "High" : "Medium"
      };
    });
  };

  const tableData = getTableData().filter(row => {
    const matchesSearch = 
      row.sourceLabel.toLowerCase().includes(searchTerm.toLowerCase()) || 
      row.targetLabel.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesSeverity = severityFilter === "All" || row.severity === severityFilter;
    return matchesSearch && matchesSeverity;
  });

  const getSeverityBadge = (severity: string) => {
    switch (severity) {
      case "Critical": return "bg-red-500/20 text-red-600 dark:text-red-400";
      case "High": return "bg-orange-500/20 text-orange-600 dark:text-orange-400";
      case "Medium": return "bg-yellow-500/20 text-yellow-600 dark:text-yellow-400";
      default: return "bg-blue-500/20 text-blue-600 dark:text-blue-400";
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-[#050b14] text-slate-900 dark:text-white p-6">
      
      {/* HEADER METRICS */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        {/* ... Metrics ... */}
        <div className="bg-white dark:bg-[#111625]/90 border border-slate-200 dark:border-white/10 rounded-lg p-4">
          <div className="text-2xl font-bold text-red-600 dark:text-red-500">
            {tableData.filter(r => r.severity === "Critical").length}
          </div>
          <div className="text-xs uppercase text-slate-500 dark:text-slate-400 mt-1">Critical Attack Paths</div>
        </div>
        <div className="bg-white dark:bg-[#111625]/90 border border-slate-200 dark:border-white/10 rounded-lg p-4">
          <div className="text-2xl font-bold text-purple-600 dark:text-purple-500">
            {graphData.nodes.length > 0 ? graphData.nodes[0]?.data?.label : "N/A"}
          </div>
          <div className="text-xs uppercase text-slate-500 dark:text-slate-400 mt-1">Entry Point</div>
        </div>
        <div className="bg-white dark:bg-[#111625]/90 border border-slate-200 dark:border-white/10 rounded-lg p-4">
          <div className="text-2xl font-bold text-orange-600 dark:text-orange-500">
            {graphData.nodes.length}
          </div>
          <div className="text-xs uppercase text-slate-500 dark:text-slate-400 mt-1">Total Nodes Mapped</div>
        </div>
        <div className="bg-white dark:bg-[#111625]/90 border border-slate-200 dark:border-white/10 rounded-lg p-4">
          <div className="text-2xl font-bold text-blue-600 dark:text-blue-500">
            {tableData.length}
          </div>
          <div className="text-xs uppercase text-slate-500 dark:text-slate-400 mt-1">Total Connections</div>
        </div>
      </div>

      {/* GRAPH VISUALIZATION */}
      <div className="h-[600px] w-full bg-slate-100 dark:bg-black/40 border border-slate-200 dark:border-white/5 rounded-xl relative overflow-hidden mb-6">
        <div className="w-full h-full">
          {/* PASS THE HANDLER HERE */}
          <AttackGraph initialJobId={jobId} onNodeClick={handleNodeSelect} />
        </div>
        
        {!jobId && !loading && (
           <div className="absolute inset-0 flex items-center justify-center bg-black/50 z-10">
             <div className="bg-white dark:bg-slate-800 p-6 rounded-lg shadow-xl text-center">
               <AlertCircle className="w-10 h-10 text-yellow-500 mx-auto mb-3" />
               <h3 className="text-lg font-bold">No Scan Selected</h3>
               <p className="text-sm opacity-70 mb-4">Run a scan to generate an attack graph.</p>
               <a href="/scan-console" className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm">Go to Scan Console</a>
             </div>
           </div>
        )}
      </div>

      {/* TABLE SECTION */}
      <div className="bg-white dark:bg-[#111625]/90 border border-slate-200 dark:border-white/10 rounded-xl overflow-hidden">
        {/* Toolbar */}
        <div className="flex flex-col sm:flex-row justify-between items-center p-4 border-b border-slate-200 dark:border-white/10 gap-4">
          <div className="text-lg font-semibold text-slate-900 dark:text-white">
            Attack Path Details 
            {jobId && <span className="ml-2 text-xs font-normal opacity-50 font-mono">Job: {jobId.slice(0,8)}...</span>}
          </div>
          
          <div className="flex items-center gap-3 w-full sm:w-auto">
            <div className="relative flex-1 sm:flex-none">
              <Search className="absolute left-2.5 top-1/2 transform -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input
                type="text"
                placeholder="Search paths..."
                className="w-full sm:w-64 bg-white dark:bg-[#111625] border border-slate-200 dark:border-white/10 rounded px-8 py-1.5 text-sm focus:outline-none focus:ring-1 focus:ring-blue-500 dark:text-white"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            
            <select 
              className="bg-white dark:bg-[#111625] border border-slate-200 dark:border-white/10 rounded px-3 py-1.5 text-sm focus:outline-none focus:ring-1 focus:ring-blue-500 dark:text-white"
              value={severityFilter}
              onChange={(e) => setSeverityFilter(e.target.value)}
            >
              <option value="All">All Severities</option>
              <option value="Critical">Critical</option>
              <option value="High">High</option>
              <option value="Medium">Medium</option>
              <option value="Low">Low</option>
            </select>
            
            <button 
              onClick={() => loadGraph(jobId)}
              className="p-2 text-slate-500 hover:text-blue-500 transition border border-slate-200 dark:border-white/10 rounded"
              title="Refresh Graph Data"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            </button>
          </div>
        </div>
        
        {/* Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-gray-100 dark:bg-white/5 text-left">
                <th className="p-3 font-semibold text-slate-600 dark:text-slate-400 uppercase text-xs">Source Node</th>
                <th className="p-3 font-semibold text-slate-600 dark:text-slate-400 uppercase text-xs">Target Node</th>
                <th className="p-3 font-semibold text-slate-600 dark:text-slate-400 uppercase text-xs">Relationship</th>
                <th className="p-3 font-semibold text-slate-600 dark:text-slate-400 uppercase text-xs">Probability</th>
                <th className="p-3 font-semibold text-slate-600 dark:text-slate-400 uppercase text-xs">Severity</th>
              </tr>
            </thead>
            <tbody>
              {tableData.length === 0 ? (
                <tr>
                  <td colSpan={5} className="p-8 text-center text-slate-500">
                    {loading ? "Loading graph data..." : "No attack paths found for this scan."}
                  </td>
                </tr>
              ) : (
                tableData.map((row) => (
                  <tr key={row.id} className="border-b border-slate-200 dark:border-white/5 hover:bg-slate-50 dark:hover:bg-white/5 transition">
                    <td 
                      className="p-3 font-mono text-blue-600 dark:text-blue-400 cursor-pointer hover:underline"
                      onClick={() => row.sourceNode && handleNodeSelect(row.sourceNode)}
                    >
                      {row.sourceLabel}
                    </td>
                    <td 
                      className="p-3 font-bold text-blue-600 dark:text-blue-400 cursor-pointer hover:underline flex items-center gap-2"
                      onClick={() => row.targetNode && handleNodeSelect(row.targetNode)}
                    >
                      {row.targetLabel}
                    </td>
                    <td className="p-3 text-slate-600 dark:text-slate-400 italic">{row.type}</td>
                    <td className="p-3 text-slate-900 dark:text-white">{row.probability}</td>
                    <td className="p-3">
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${getSeverityBadge(row.severity)}`}>
                        {row.severity}
                      </span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* DRAWER COMPONENT */}
      <AttackNodeDrawer
        open={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        node={selectedNode}
      />
    </div>
  );
};

export default AttackPath;
