import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { FileText, Activity } from "lucide-react";
import { getJobHistory, getScanReport } from "../../services/api";

interface ScanJob {
  job_id: string;
  target: string;
  status: string;
  created_at: string;
  scanners_used: string[];
  risk?: string;
}

const statusColors: Record<string, string> = {
  completed: "bg-green-500",
  failed: "bg-red-500",
  running: "bg-yellow-500",
  pending: "bg-gray-500",
  partial_success: "bg-orange-500",
};

const riskColors: Record<string, string> = {
  Critical: "text-red-500",
  High: "text-orange-500",
  Medium: "text-yellow-500",
  Low: "text-blue-500",
  "N/A": "text-gray-500",
};

const ScanHistory = () => {
  const navigate = useNavigate();
  const [history, setHistory] = useState<ScanJob[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchHistory = async () => {
      try {
        const data = await getJobHistory();
        // @ts-ignore
        const fetchedHistory = Array.isArray(data) && data.length > 0 ? data : [];
        setHistory(fetchedHistory);
      } catch (error) {
        console.error("Failed to fetch scan history:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchHistory();
  }, []);

  const handleReportClick = async (jobId: string) => {
    try {
      const blob = await getScanReport(jobId);
      
      if (blob.type === 'application/json') {
        alert("Report is not ready yet or generation failed.");
        return;
      }

      const url = window.URL.createObjectURL(blob);
      window.open(url, '_blank');
      
      setTimeout(() => window.URL.revokeObjectURL(url), 1000);
    } catch (error) {
      console.error("Failed to open report:", error);
      alert("Could not load report. Please try again later.");
    }
  };

  const handleGraphClick = (jobId: string) => {
    navigate(`/attack-path?job_id=${jobId}`);
  };

  // UPDATED: Show full Date and Time string
  const formatDate = (dateString: string) => {
    if (!dateString) return "N/A";
    return new Date(dateString).toLocaleString(); // e.g. "12/7/2025, 4:30:00 PM"
  };

  if (loading) {
    return (
      <div className="w-full mt-10 p-4 text-center opacity-60 text-sm">
        Loading scan history...
      </div>
    );
  }

  return (
    <div className="w-full mt-10">
      <h3 className="text-lg font-semibold mb-4">Scan History</h3>

      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="text-left bg-slate-100 dark:bg-slate-700">
              <th className="p-3">Target</th>
              <th className="p-3">Tools</th>
              <th className="p-3">Status</th>
              <th className="p-3">Risk</th>
              <th className="p-3">Start Time</th>
              <th className="p-3">Actions</th>
            </tr>
          </thead>

          <tbody>
            {history.length === 0 ? (
              <tr>
                <td colSpan={6} className="p-6 text-center opacity-60">
                  No scans found. Start a scan above!
                </td>
              </tr>
            ) : (
              history.map((item) => (
                <tr 
                  key={item.job_id} 
                  className="border-b dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-white/5 transition-colors"
                >
                  <td className="p-3">
                    <div 
                      className="flex items-center gap-3 text-cyan-400 font-medium hover:underline hover:text-cyan-300 transition-colors cursor-pointer"
                      onClick={() => handleReportClick(item.job_id)}
                    >
                      <FileText size={16} />
                      <span>{item.target}</span>
                    </div>
                  </td>
                  <td className="p-3 opacity-80">
                    {item.scanners_used && item.scanners_used.length > 0 
                      ? item.scanners_used.join(", ") 
                      : "Unknown"}
                  </td>
                  <td className="p-3">
                    <span
                      className={`px-3 py-1 rounded-full text-white text-xs ${
                        statusColors[item.status] || "bg-gray-500"
                      }`}
                    >
                      {item.status.toUpperCase()}
                    </span>
                  </td>
                  <td className="p-3">
                    <span className={riskColors[item.risk || "N/A"] || "text-gray-500"}>
                      {item.risk || "N/A"}
                    </span>
                  </td>
                  <td className="p-3 opacity-80 whitespace-nowrap">
                    {formatDate(item.created_at)}
                  </td>
                  <td className="p-3">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleGraphClick(item.job_id);
                      }}
                      className="text-gray-400 hover:text-cyan-400 transition-colors p-1"
                      title="View Attack Graph"
                    >
                      <Activity size={18} />
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default ScanHistory;
