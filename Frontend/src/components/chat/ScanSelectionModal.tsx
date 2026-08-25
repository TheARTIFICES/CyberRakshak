import React, { useState, useEffect } from "react";
import { X, FileText, Check } from "lucide-react";
import { getJobHistory } from "../../services/api";

interface Props {
  open: boolean;
  onClose: () => void;
  selectedIds: string[];
  onSelectionChange: (ids: string[]) => void;
}

const ScanSelectionModal = ({ open, onClose, selectedIds, onSelectionChange }: Props) => {
  const [scans, setScans] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (open) {
      loadScans();
    }
  }, [open]);

  const loadScans = async () => {
    setLoading(true);
    try {
      const data = await getJobHistory(0, 50);
      setScans(data);
    } catch (e) {
      console.error("Failed to load scans", e);
    } finally {
      setLoading(false);
    }
  };

  const toggleScan = (id: string) => {
    if (!id) return; // Safety check
    if (selectedIds.includes(id)) {
      onSelectionChange(selectedIds.filter(sid => sid !== id));
    } else {
      onSelectionChange([...selectedIds, id]);
    }
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
      <div className="bg-white dark:bg-slate-800 w-full max-w-lg rounded-xl shadow-2xl overflow-hidden border border-slate-200 dark:border-slate-700 flex flex-col max-h-[80vh]">
        
        {/* Header */}
        <div className="p-4 border-b border-slate-200 dark:border-slate-700 flex justify-between items-center bg-slate-50 dark:bg-slate-800/50">
          <div>
            <h3 className="font-bold text-slate-800 dark:text-white">Add Context</h3>
            <p className="text-xs text-slate-500 dark:text-slate-400">Select previous scans to include in your query.</p>
          </div>
          <button onClick={onClose} className="p-1 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-full transition">
            <X className="w-5 h-5 text-slate-500" />
          </button>
        </div>

        {/* List */}
        <div className="flex-1 overflow-y-auto p-2 space-y-1">
          {loading ? (
            <div className="p-8 text-center text-slate-500 text-sm">Loading history...</div>
          ) : scans.length === 0 ? (
            <div className="p-8 text-center text-slate-500 text-sm">No scan history found.</div>
          ) : (
            scans.map((scan) => {
              // --- FIX: Handle both 'id' and 'job_id' for safety ---
              const scanId = scan.id || scan.job_id;
              if (!scanId) return null; // Skip invalid rows

              const isSelected = selectedIds.includes(scanId);
              return (
                <div 
                  key={scanId}
                  onClick={() => toggleScan(scanId)}
                  className={`
                    flex items-center justify-between p-3 rounded-lg cursor-pointer border transition-all
                    ${isSelected 
                      ? "bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800" 
                      : "bg-transparent border-transparent hover:bg-slate-100 dark:hover:bg-slate-700/50"
                    }
                  `}
                >
                  <div className="flex items-center gap-3 overflow-hidden">
                    <div className={`p-2 rounded-full ${isSelected ? "bg-blue-100 dark:bg-blue-800 text-blue-600 dark:text-blue-200" : "bg-slate-100 dark:bg-slate-700 text-slate-400"}`}>
                      <FileText className="w-4 h-4" />
                    </div>
                    <div className="min-w-0">
                      <p className={`text-sm font-medium truncate ${isSelected ? "text-blue-700 dark:text-blue-300" : "text-slate-700 dark:text-slate-200"}`}>
                        {scan.target}
                      </p>
                      <p className="text-xs text-slate-500 dark:text-slate-400">
                        {new Date(scan.created_at).toLocaleString()} • <span className="uppercase">{scan.status}</span>
                      </p>
                    </div>
                  </div>
                  
                  <div className={`w-5 h-5 rounded border flex items-center justify-center transition-colors ${isSelected ? "bg-blue-600 border-blue-600" : "border-slate-300 dark:border-slate-600"}`}>
                    {isSelected && <Check className="w-3 h-3 text-white" />}
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50 flex justify-between items-center">
          <span className="text-xs text-slate-500">
            {selectedIds.length} scans selected
          </span>
          <button 
            onClick={onClose}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded-lg transition"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
};

export default ScanSelectionModal;
