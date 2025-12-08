import React, { useEffect, useState } from "react";
import { getAuditLogs } from "../services/api";
import { Terminal, Clock, Search } from "lucide-react";

const AuditLogs = () => {
  const [logs, setLogs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");

  const fetchLogs = async () => {
    setLoading(true);
    try {
      const data = await getAuditLogs(100, searchTerm); // Pass search term
      setLogs(data);
    } catch (error) {
      console.error("Failed to fetch audit logs:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const timer = setTimeout(() => fetchLogs(), 500); // Debounce
    return () => clearTimeout(timer);
  }, [searchTerm]);

  const getEventColor = (type: string) => {
    if (type.includes("ERROR") || type.includes("FAILED")) return "text-red-500";
    if (type.includes("COMPLETED")) return "text-green-500";
    if (type.includes("STARTED")) return "text-blue-500";
    return "text-slate-500";
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold">System Audit Logs</h1>
        <p className="opacity-70 text-sm">
          Track all user actions, scan events, and system errors in real-time.
        </p>
      </div>

      {/* Search Bar */}
      <div className="bg-white dark:bg-slate-800 rounded-xl shadow p-4 flex items-center gap-3">
        <Search className="w-5 h-5 opacity-50" />
        <input
          type="text"
          placeholder="Search logs (e.g., 'scanme', 'admin', 'failed')..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="flex-1 bg-transparent outline-none"
        />
      </div>

      {/* Logs Container */}
      <div className="bg-slate-950 rounded-xl shadow overflow-hidden border border-slate-800 font-mono text-sm">
        <div className="p-3 bg-slate-900 border-b border-slate-800 flex justify-between items-center">
          <div className="flex items-center gap-2 text-slate-400">
            <Terminal className="w-4 h-4" />
            <span>/var/log/cyberrakshak/audit.log</span>
          </div>
          <span className="text-xs px-2 py-1 bg-slate-800 rounded text-slate-400">
            {logs.length} Events
          </span>
        </div>

        <div className="p-4 max-h-[600px] overflow-y-auto space-y-2 custom-scrollbar">
          {loading ? (
            <p className="text-slate-500 animate-pulse">Loading system logs...</p>
          ) : logs.length === 0 ? (
            <p className="text-slate-600">No logs found matching your search.</p>
          ) : (
            logs.map((log) => (
              <div key={log.id} className="flex gap-4 hover:bg-slate-900/50 p-1 rounded transition">
                {/* Timestamp */}
                <span className="text-slate-500 whitespace-nowrap flex items-center gap-1 w-40">
                  <Clock className="w-3 h-3" />
                  {new Date(log.timestamp).toLocaleString()}
                </span>

                {/* Event Type */}
                <span className={`font-bold w-32 ${getEventColor(log.event_type)}`}>
                  {log.event_type}
                </span>

                {/* Details */}
                <span className="text-slate-300 break-all">
                  {typeof log.details === "string"
                    ? log.details
                    : JSON.stringify(log.details).replace(/[{}"]/g, " ")}
                </span>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};

export default AuditLogs;
