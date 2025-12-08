import React, { useState, useEffect } from "react";
import { FileText, Download, Filter, Plus, AlertTriangle, CheckCircle, ArrowDownCircle, FileStack, Clock, Loader2 } from "lucide-react";
import GenerateReportModal from "../components/reports/GenerateReportModal";
import { getReports, getReportStats, getScanReport } from "../services/api";

const Reports = () => {
  const [searchTerm, setSearchTerm] = useState("");
  const [showFilterDropdown, setShowFilterDropdown] = useState(false);
  const [statusFilter, setStatusFilter] = useState("All"); // New State for Status Filter
  const [modalOpen, setModalOpen] = useState(false);
  
  // Data State
  const [reports, setReports] = useState<any[]>([]);
  const [stats, setStats] = useState({ total: 0, completed: 0, pending: 0, failed: 0 });
  const [loading, setLoading] = useState(true);
  const [downloadingId, setDownloadingId] = useState<string | null>(null);

  // Fetch Data with Server-Side Filtering
  const fetchData = async () => {
    setLoading(true);
    try {
      const filters: any = {};
      if (searchTerm) filters.search = searchTerm;
      if (statusFilter !== "All") filters.status = [statusFilter.toLowerCase()];

      const [reportsData, statsData] = await Promise.all([
        getReports(0, 50, filters),
        getReportStats()
      ]);
      setReports(reportsData);
      setStats(statsData);
    } catch (error) {
      console.error("Failed to load reports:", error);
    } finally {
      setLoading(false);
    }
  };

  // Debounce effect for search and filter changes
  useEffect(() => {
    const timer = setTimeout(() => fetchData(), 500);
    return () => clearTimeout(timer);
  }, [searchTerm, statusFilter]);

  // Handle PDF Download
  const handleDownload = async (id: string, name: string) => {
    setDownloadingId(id);
    try {
      const blob = await getScanReport(id);
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      const cleanName = name.replace(/[^a-z0-9]/gi, '_').toLowerCase();
      a.download = `${cleanName}.pdf`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (error) {
      console.error("Download failed:", error);
      alert("Failed to download report. It might not be ready yet.");
    } finally {
      setDownloadingId(null);
    }
  };

  // Dynamic Metrics based on Real API Data
  const vaultMetrics = [
    { 
      id: 1, 
      value: stats.total.toString(), 
      label: "Reports Available",
      visual: "document-stack",
      color: "text-slate-900 dark:text-white",
      glow: "hover:border-cyan-500/30"
    },
    { 
      id: 2, 
      value: stats.failed.toString(), 
      label: "Failed / Attention Needed",
      visual: "alert",
      color: "text-red-500",
      glow: "hover:border-red-500/30"
    },
    { 
      id: 3, 
      value: stats.pending.toString(), 
      label: "Pending Scans", 
      visual: "clock",
      color: "text-yellow-500",
      glow: "hover:border-yellow-500/30"
    },
    { 
      id: 4, 
      value: stats.completed.toString(), 
      label: "Ready for Export",
      visual: "download",
      color: "text-green-500",
      glow: "hover:border-green-500/30"
    }
  ];

  const getStatusColor = (status: string) => {
    const s = status.toLowerCase();
    if (s === "available" || s === "completed") return "text-green-500";
    if (s === "failed") return "text-red-500";
    return "text-yellow-500";
  };

  return (
    <div className="min-h-screen bg-[#f0f2f5] dark:bg-[#050b14] text-slate-900 dark:text-white p-6 max-w-[1600px] mx-auto">
      
      {/* Generate Report Button */}
      <div className="flex justify-end mb-8">
        <button
          onClick={() => setModalOpen(true)}
          className="px-4 py-2 bg-cyan-500 hover:bg-cyan-600 text-white rounded-lg shadow-lg transition flex items-center gap-2"
        >
          <Plus className="w-4 h-4" />
          Generate Report
        </button>
      </div>

      {/* TOP ROW: 4 SYMMETRICAL TILES */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {vaultMetrics.map((metric) => (
          <div 
            key={metric.id} 
            className={`bg-white dark:bg-[#1e293b] border border-slate-200 dark:border-slate-700 p-6 rounded-xl ${metric.glow} transition-all`}
          >
            <div className={`text-2xl font-bold mb-1 ${metric.color}`}>{metric.value}</div>
            <div className="text-sm text-slate-500 dark:text-slate-400 font-medium">{metric.label}</div>
            
            {/* Visual Elements */}
            {metric.visual === "document-stack" && (
              <div className="flex justify-center mt-4">
                <FileStack className="w-12 h-12 text-cyan-500" />
              </div>
            )}
            
            {metric.visual === "alert" && (
              <div className="flex justify-center mt-4">
                <AlertTriangle className={`w-12 h-12 ${parseInt(metric.value) > 0 ? "text-red-500 animate-pulse" : "text-slate-300"}`} />
              </div>
            )}
            
            {metric.visual === "clock" && (
              <div className="flex justify-center mt-4">
                <Clock className={`w-12 h-12 ${parseInt(metric.value) > 0 ? "text-yellow-500" : "text-slate-300"}`} />
              </div>
            )}
            
            {metric.visual === "download" && (
              <div className="flex flex-col items-center mt-4">
                <ArrowDownCircle className="w-8 h-8 text-green-500 mb-2" />
                <div className="w-full h-1.5 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-green-500 rounded-full" 
                    style={{ width: `${stats.total > 0 ? (stats.completed / stats.total) * 100 : 0}%` }}
                  ></div>
                </div>
              </div>
            )}
          </div>
        ))}
      </div>

      {/* ROW 2: RECENT INTELLIGENCE (Latest 4 Reports) */}
      <div className="mb-8">
        <h2 className="text-lg font-semibold text-slate-900 dark:text-white mb-4">Recent Intelligence</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {reports.slice(0, 4).map((doc) => (
            <div 
              key={doc.id} 
              className="bg-white dark:bg-[#1e293b] border border-slate-200 dark:border-slate-700 p-6 rounded-xl hover:border-cyan-500/30 transition-all group hover:-translate-y-2 hover:shadow-cyan-500/20 relative overflow-hidden"
            >
              <div className="flex justify-between items-start mb-4">
                <FileText className="w-5 h-5 text-gray-400" />
                <span className="text-[10px] border border-slate-300 dark:border-slate-600 text-slate-500 px-2 py-1 rounded">AUTO-GENERATED</span>
              </div>
              
              <div className="text-sm font-semibold text-slate-900 dark:text-white mb-8 line-clamp-2 h-10">
                {doc.name}
              </div>
              
              <div className="text-xs text-slate-500 dark:text-slate-400 flex justify-between items-end">
                <span>{doc.date}</span>
                <span className={getStatusColor(doc.status)}>{doc.status}</span>
              </div>
              
              {/* Hover Download Button */}
              <div className="absolute inset-0 bg-black/50 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity rounded-xl">
                <button 
                  onClick={() => handleDownload(doc.id, doc.name)}
                  disabled={downloadingId === doc.id}
                  className="flex items-center gap-2 bg-cyan-500 text-white px-4 py-2 rounded-lg hover:bg-cyan-600 transition"
                >
                  {downloadingId === doc.id ? <Loader2 className="w-4 h-4 animate-spin" /> : <Download className="w-4 h-4" />}
                  {downloadingId === doc.id ? "Downloading..." : "Download"}
                </button>
              </div>
            </div>
          ))}
          {reports.length === 0 && !loading && (
             <div className="col-span-4 p-8 text-center text-slate-500 border border-dashed border-slate-300 dark:border-slate-700 rounded-xl">
               No recent reports generated. Run a scan to create one.
             </div>
          )}
        </div>
      </div>

      {/* ROW 3: THE ARCHIVE (Full Width Table) */}
      <div className="bg-white dark:bg-[#1e293b] border border-slate-200 dark:border-slate-700 rounded-xl overflow-hidden">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between p-6 border-b border-slate-200 dark:border-slate-700 gap-4">
          <h3 className="text-lg font-semibold text-slate-900 dark:text-white">Report Archive</h3>
          
          <div className="flex flex-wrap gap-3">
            <div className="relative">
              <input
                type="text"
                placeholder="Search archives..."
                className="pl-3 pr-10 py-2 bg-white dark:bg-[#0f172a] border border-slate-200 dark:border-slate-700 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-cyan-500 dark:text-white"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            
            <div className="relative">
              <button 
                className="flex items-center gap-2 px-3 py-2 bg-white dark:bg-[#0f172a] border border-slate-200 dark:border-slate-700 rounded-lg text-sm hover:bg-slate-50 dark:hover:bg-[#111625]/80 transition"
                onClick={() => setShowFilterDropdown(!showFilterDropdown)}
              >
                <Filter className="w-4 h-4" />
                Filter: {statusFilter}
              </button>
              
              {showFilterDropdown && (
                <div className="absolute right-0 mt-1 w-48 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg shadow-lg z-10">
                  <div className="p-2">
                    {["All", "Completed", "Pending", "Failed"].map(status => (
                      <div 
                        key={status}
                        className={`px-3 py-2 rounded cursor-pointer text-sm ${statusFilter === status ? "bg-cyan-500/10 text-cyan-500" : "hover:bg-slate-100 dark:hover:bg-slate-800"}`}
                        onClick={() => {
                          setStatusFilter(status);
                          setShowFilterDropdown(false);
                        }}
                      >
                        {status}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Archive Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-slate-50 dark:bg-[#0f172a] text-left">
                <th className="p-4 font-semibold text-slate-500 dark:text-gray-400 text-xs">Report Name</th>
                <th className="p-4 font-semibold text-slate-500 dark:text-gray-400 text-xs">Type</th>
                <th className="p-4 font-semibold text-slate-500 dark:text-gray-400 text-xs">Generated Date</th>
                <th className="p-4 font-semibold text-slate-500 dark:text-gray-400 text-xs">Status</th>
                <th className="p-4 font-semibold text-slate-500 dark:text-gray-400 text-xs">Download</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={5} className="p-8 text-center">Loading archive...</td></tr>
              ) : reports.length === 0 ? (
                <tr><td colSpan={5} className="p-8 text-center text-slate-500">No reports found matching your criteria.</td></tr>
              ) : (
                reports.map((report) => (
                  <tr 
                    key={report.id} 
                    className="border-b border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 transition"
                  >
                    <td className="p-4 font-medium text-slate-900 dark:text-white">{report.name}</td>
                    <td className="p-4">
                      <span className="flex items-center">
                        <span className="w-2 h-2 rounded-full mr-2 bg-blue-500"></span>
                        <span className="text-slate-700 dark:text-slate-300">{report.type}</span>
                      </span>
                    </td>
                    <td className="p-4 text-slate-500 dark:text-slate-400">{report.date}</td>
                    <td className={`p-4 font-medium ${getStatusColor(report.status)}`}>{report.status}</td>
                    <td className="p-4">
                      <button 
                        onClick={() => handleDownload(report.id, report.name)}
                        disabled={downloadingId === report.id}
                        className="p-2 rounded hover:bg-slate-200 dark:hover:bg-slate-700 transition text-cyan-600 dark:text-cyan-500"
                      >
                        {downloadingId === report.id ? <Loader2 className="w-4 h-4 animate-spin" /> : <Download className="w-4 h-4" />}
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      <GenerateReportModal 
        open={modalOpen} 
        onClose={() => setModalOpen(false)} 
      />
    </div>
  );
};

export default Reports;
