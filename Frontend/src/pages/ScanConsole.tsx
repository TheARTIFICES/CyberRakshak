import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import ScanHistory from "../components/scan/ScanHistory";
import ScannerList from "../components/scan/ScannerList";
import ScannerConfigDrawer from "../components/scan/ScannerConfigDrawer";
import { startScan, getScanStatus } from "../services/api";

interface ActiveScan {
  id: string;
  target: string;
  tools: string[];
  status: "pending" | "running" | "completed" | "failed";
  progress: number;
  jobId?: string;
  startTime: Date;
}

type ScanProfile = "quick" | "deep" | "web" | "network" | "custom";

const ScanConsole = () => {
  const navigate = useNavigate();
  
  // DEFAULT: Nmap selected by default
  const [selectedScanners, setSelectedScanners] = useState<Record<string, boolean>>({
    nmap: true, 
    nuclei: false,
    zap: false,
    nikto: false,
    metasploit: false,
    openvas: false,
    wappalyzer: false,
    nessus: false,
  });
  
  const [drawerScanner, setDrawerScanner] = useState<string | null>(null);
  const [scannerConfigs, setScannerConfigs] = useState<Record<string, any>>({});
  const [target, setTarget] = useState("");
  const [targetError, setTargetError] = useState<string | null>(null);
  const [activeScans, setActiveScans] = useState<ActiveScan[]>([]);
  const [historyKey, setHistoryKey] = useState(0);
  const [scanProfile, setScanProfile] = useState<ScanProfile>("quick");

  // --- Notification State ---
  const [notifyEmail, setNotifyEmail] = useState(false);
  const [emailList, setEmailList] = useState("");
  // -------------------------------

  // Validations
  const isValidIp = (value: string) => {
    const ipv4Regex = /^(25[0-5]|2[0-4]\d|1\d{2}|[1-9]?\d)(\.(25[0-5]|2[0-4]\d|1\d{2}|[1-9]?\d)){3}$/;
    return ipv4Regex.test(value);
  };

  const isValidDomain = (value: string) => {
    const domainRegex = /^(?!-)[A-Za-z0-9-]{1,63}(?<!-)(\.[A-Za-z0-9-]{1,63})*\.[A-Za-z]{2,}$/;
    return domainRegex.test(value);
  };

  const validateTarget = (value: string) => {
    if (!value) {
      setTargetError("Target is required.");
      return false;
    }
    if (!(isValidIp(value) || isValidDomain(value))) {
      setTargetError("Enter a valid IPv4 address or domain (e.g., 192.168.1.1 or scanme.nmap.org).");
      return false;
    }
    setTargetError(null);
    return true;
  };

  // --- SCAN PROFILES LOGIC ---
  useEffect(() => {
    const resetScanners = {
      nmap: false, nuclei: false, zap: false, nikto: false,
      metasploit: false, openvas: false, wappalyzer: false, nessus: false
    };

    if (scanProfile === "quick") {
      // Quick Scan: Nmap, ZAP, Metasploit, Wappalyzer
      setSelectedScanners({ ...resetScanners, nmap: true, zap: true, metasploit: true, wappalyzer: true });
      setScannerConfigs((prev) => ({
        ...prev,
        nmap: { speed: "T4", raw_args: ["-F"] }, // Fast scan
        zap: { mode: "baseline" }
      }));
    } 
    else if (scanProfile === "deep") {
      // Deep Scan: All except Nessus
      setSelectedScanners({ ...resetScanners, nmap: true, nuclei: true, zap: true, nikto: true, metasploit: true, openvas: true, wappalyzer: true });
      setScannerConfigs((prev) => ({
        ...prev,
        nmap: { raw_args: ["-A", "-p-"] }, // Aggressive, all ports
        zap: { mode: "full" },
        openvas: { profile: "Full and fast" },
        nuclei: { severity: "critical,high,medium,low" }
      }));
    }
    else if (scanProfile === "web") {
      // Web App Attack: SQLi, XSS focus
      setSelectedScanners({ ...resetScanners, zap: true, nuclei: true, nikto: true, wappalyzer: true });
      setScannerConfigs((prev) => ({
        ...prev,
        nuclei: { tags: "sqli,xss,cve" },
        zap: { mode: "full" },
        nikto: { tuning: "49" } // 4=XSS, 9=SQL Injection
      }));
    }
    else if (scanProfile === "network") {
      // Network Infrastructure
      setSelectedScanners({ ...resetScanners, nmap: true, openvas: true, metasploit: true });
      setScannerConfigs((prev) => ({
        ...prev,
        nmap: { raw_args: ["-sV", "-O", "--script", "vuln"] },
        openvas: { profile: "Discovery" }
      }));
    }
    // Custom: Do not overwrite user selections
  }, [scanProfile]);

  const buildScanPayload = () => {
    const scannersPayload: Record<string, any> = {};
    Object.keys(selectedScanners).forEach((scannerId) => {
      if (selectedScanners[scannerId]) {
        scannersPayload[scannerId] = {
          enabled: true,
          params: scannerConfigs[scannerId] || {},
        };
      }
    });

    return { 
      target, 
      scanners: scannersPayload,
      notify_email: notifyEmail,
      email_recipients: notifyEmail ? emailList.split(",").map(e => e.trim()).filter(e => e) : []
    };
  };

  // Progress simulation and polling for each active scan
  useEffect(() => {
    const intervals: Record<string, ReturnType<typeof setInterval>> = {};

    activeScans.forEach((scan) => {
      if (scan.status !== "completed" && scan.status !== "failed") {
        // Progress simulation
        const progressInterval = setInterval(() => {
          setActiveScans((prev) =>
            prev.map((s) => {
              if (s.id === scan.id && s.progress < 100) {
                const newProgress = Math.min(s.progress + Math.random() * 3, 100);
                let newStatus: "pending" | "running" | "completed" | "failed" = s.status;
                
                if (newProgress >= 100) {
                  newStatus = "completed";
                } else if (newProgress > 10) {
                  newStatus = "running";
                }

                return { ...s, progress: newProgress, status: newStatus };
              }
              return s;
            })
          );
        }, 200);

        intervals[scan.id] = progressInterval;

        // Poll real status if jobId exists
        if (scan.jobId) {
          const pollInterval = setInterval(async () => {
            try {
              const statusData = await getScanStatus(scan.jobId!);
              if (["completed", "failed", "partial_success"].includes(statusData.status)) {
                setActiveScans((prev) =>
                  prev.map((s) => {
                    if (s.id === scan.id) {
                      const completed: ActiveScan = { 
                        ...s, 
                        status: statusData.status === "failed" ? "failed" : "completed" as "pending" | "running" | "completed" | "failed", 
                        progress: 100 
                      };
                      // Move to history after a delay
                      setTimeout(() => {
                        setActiveScans((prev) => prev.filter((scan) => scan.id !== s.id));
                        setHistoryKey((prev) => prev + 1);
                      }, 2000);
                      return completed;
                    }
                    return s;
                  })
                );
                clearInterval(pollInterval);
              }
            } catch (error) {
              console.error("Poll error:", error);
            }
          }, 2000);

          intervals[`poll-${scan.id}`] = pollInterval;
        }
      }
    });

    return () => {
      Object.values(intervals).forEach((interval) => clearInterval(interval));
    };
  }, [activeScans]);

  const handleRunScan = async () => {
    if (!validateTarget(target)) return;

    const payload = buildScanPayload();
    const selectedToolNames = Object.keys(payload.scanners);
    if (selectedToolNames.length === 0) {
      alert("Please select at least one scanner.");
      return;
    }

    const scanId = `scan-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    const newScan: ActiveScan = {
      id: scanId,
      target,
      tools: selectedToolNames,
      status: "pending",
      progress: 0,
      startTime: new Date(),
    };

    setActiveScans((prev) => [...prev, newScan]);

    try {
      const response = await startScan(payload);
      setActiveScans((prev) =>
        prev.map((s) => (s.id === scanId ? { ...s, jobId: response.job_id, status: "running" } : s))
      );
      setTarget("");
    } catch (err: any) {
      console.error(err);
      const errorMsg = err.message || "Unknown error";
      setActiveScans((prev) =>
        prev.map((s) =>
          s.id === scanId ? { ...s, status: "failed", progress: 100 } : s
        )
      );
      alert(`Failed to start scan: ${errorMsg}`);
    }
  };

  const handleStopScan = (scanId: string) => {
    setActiveScans((prev) =>
      prev.map((s) => (s.id === scanId ? { ...s, status: "failed", progress: 100 } : s))
    );
  };

  const toggleScanner = (id: string) => {
    setSelectedScanners((prev) => ({ ...prev, [id]: !prev[id] }));
    // Auto-switch to custom when manually changing scanners
    setScanProfile("custom");
  };

  const openConfigDrawer = (id: string) => {
    setDrawerScanner(id);
  };

  const saveScannerConfig = (id: string, config: any) => {
    setScannerConfigs((prev) => ({ ...prev, [id]: config }));
  };

  const hasAnyScannerSelected = Object.values(selectedScanners).some(Boolean);
  const canRunScan = hasAnyScannerSelected && !targetError && target.length > 0;

  return (
    <div>
      <div className="space-y-6">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="col-span-1">
            <ScannerList
              selected={selectedScanners}
              onToggle={toggleScanner}
              onConfigure={openConfigDrawer}
            />
          </div>

          <div className="col-span-2 bg-white dark:bg-slate-800 rounded-xl shadow p-6">
            {/* Scan Profile Dropdown */}
            <div className="space-y-2 mb-4">
              <label className="font-medium text-sm">Scan Profile</label>
              <select
                value={scanProfile}
                onChange={(e) => setScanProfile(e.target.value as ScanProfile)}
                className="w-full p-2 rounded-lg border bg-slate-50 dark:bg-slate-900/40 text-slate-900 dark:text-slate-100 border-slate-300 dark:border-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="quick">Quick Scan (Fast Discovery)</option>
                <option value="deep">Deep Audit (Full Coverage)</option>
                <option value="web">Web App Attack (SQLi & XSS)</option>
                <option value="network">Network Infrastructure (OS & Services)</option>
                <option value="custom">Custom</option>
              </select>
            </div>

            <div className="space-y-2">
              <label className="font-medium text-sm">Target</label>
              <input
                type="text"
                value={target}
                onChange={(e) => {
                  const value = e.target.value.trim();
                  setTarget(value);
                  if (value.length > 0) validateTarget(value);
                }}
                placeholder="Enter IP / Domain (example: 192.168.1.1, scanme.nmap.org)"
                className={`
                  w-full p-2 rounded-lg border
                  bg-slate-50 dark:bg-slate-900/40 text-slate-900 dark:text-slate-100
                  border-slate-300 dark:border-slate-700 focus:outline-none
                  focus:ring-2 focus:ring-blue-500
                  ${targetError ? "border-red-500 focus:ring-red-500" : ""}
                `}
              />
              <p className="text-xs opacity-70">Supports single IPv4 or domain.</p>
              {targetError && <p className="text-xs text-red-400">{targetError}</p>}
            </div>

            {/* Email Notification UI */}
            <div className="mt-4 p-4 bg-slate-50 dark:bg-slate-900/50 rounded-lg border border-slate-200 dark:border-slate-700">
              <div className="flex items-center gap-2 mb-2">
                <input 
                  type="checkbox" 
                  checked={notifyEmail} 
                  onChange={(e) => setNotifyEmail(e.target.checked)}
                  className="w-4 h-4"
                />
                <label className="text-sm font-semibold">Email Notification</label>
              </div>
              
              {notifyEmail && (
                <input
                  type="text"
                  value={emailList}
                  onChange={(e) => setEmailList(e.target.value)}
                  placeholder="Enter emails (comma separated)..."
                  className="w-full p-2 text-sm rounded border bg-white dark:bg-slate-800"
                />
              )}
            </div>

            <button
              disabled={!canRunScan}
              onClick={handleRunScan}
              className={`
                px-4 py-2 rounded-lg text-sm font-semibold mt-4
                ${canRunScan
                  ? "bg-blue-600 hover:bg-blue-700 text-white cursor-pointer"
                  : "bg-slate-500 text-slate-300 cursor-not-allowed"}
              `}
            >
              Run Scan
            </button>

            <div className="mt-6">
              <h2 className="font-semibold mb-2">Live Operations</h2>
              {activeScans.length === 0 ? (
                <div className="p-4 bg-slate-50 dark:bg-slate-900/40 rounded-lg border border-slate-200 dark:border-slate-700 text-sm text-slate-500 dark:text-slate-400">
                  No active scans. Start a scan to see progress here.
                </div>
              ) : (
                <div className="space-y-3">
                  {activeScans.map((scan) => (
                    <div
                      key={scan.id}
                      className="p-3 bg-slate-50 dark:bg-slate-900/40 rounded-lg border border-slate-200 dark:border-slate-700"
                    >
                      <div className="flex items-center justify-between mb-2">
                        <div>
                          <span className="font-mono font-semibold text-sm text-slate-900 dark:text-slate-100">
                            {scan.target}
                          </span>
                          <span className="text-xs text-slate-500 dark:text-slate-400 ml-2">
                            - {scan.tools.join(", ")}
                          </span>
                        </div>
                        <button
                          onClick={() => handleStopScan(scan.id)}
                          className="text-xs text-red-500 hover:text-red-600 font-medium px-2 py-1"
                        >
                          Stop
                        </button>
                      </div>
                      <div className="w-full h-1 bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden mb-1">
                        <div
                          className="h-full bg-blue-500 transition-all duration-300"
                          style={{ width: `${scan.progress}%` }}
                        ></div>
                      </div>
                      <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
                        <span className="capitalize">{scan.status}</span>
                        <span>{Math.round(scan.progress)}%</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      <ScanHistory key={historyKey} />

      <ScannerConfigDrawer
        open={drawerScanner !== null}
        scannerId={drawerScanner}
        currentConfig={drawerScanner ? scannerConfigs[drawerScanner] : null}
        onClose={() => setDrawerScanner(null)}
        onSave={saveScannerConfig}
      />
    </div>
  );
};

export default ScanConsole;
