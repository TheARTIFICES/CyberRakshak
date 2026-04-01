import React, { useState, useEffect, useRef } from "react";

import ScanHistory from "../components/scan/ScanHistory";
import ScannerList from "../components/scan/ScannerList";
import ScannerConfigDrawer from "../components/scan/ScannerConfigDrawer";
import { startScan, getScanStatus, getActiveJobs } from "../services/api";

// Estimated relative durations for each scanner (used as weights for progress calculation)
const SCANNER_WEIGHTS: Record<string, number> = {
  nmap: 10,
  nuclei: 15,
  zap: 20,
  nikto: 12,
  metasploit: 15,
  openvas: 25,
  wappalyzer: 5,
  whois: 3,
  whatweb: 5,
  dirsearch: 10,
  wfuzz: 10,
  dalfox: 12,
  grype: 8,
};

interface ActiveScan {
  id: string; // internal or job_id
  jobId: string;
  target: string;
  tools: string[];
  status: "pending" | "running" | "completed" | "failed";
  toolStatus: Record<string, string>;
  startTime: string;
}

// Calculate progress percentage from tool_status using scanner weights
function calculateProgress(tools: string[], toolStatus: Record<string, string>): number {
  if (!tools.length) return 0;
  const totalWeight = tools.reduce((sum, t) => sum + (SCANNER_WEIGHTS[t] || 10), 0);
  const completedWeight = tools.reduce((sum, t) => {
    const status = (toolStatus[t] || "pending").toLowerCase();
    if (status === "completed" || status === "failed" || status === "error") {
      return sum + (SCANNER_WEIGHTS[t] || 10);
    }
    if (status === "running") {
      return sum + (SCANNER_WEIGHTS[t] || 10) * 0.5; // running = ~50% of that scanner's weight
    }
    return sum;
  }, 0);
  return Math.min(100, Math.round((completedWeight / totalWeight) * 100));
}

type ScanProfile = "quick" | "deep" | "web" | "network" | "custom";

const ScanConsole = () => {

  
  const [selectedScanners, setSelectedScanners] = useState<Record<string, boolean>>({
    nmap: true, 
    nuclei: false,
    zap: false,
    nikto: false,
    metasploit: false,
    openvas: false,
    wappalyzer: false,
    whois: true,
  });
  
  const [drawerScanner, setDrawerScanner] = useState<string | null>(null);
  const [scannerConfigs, setScannerConfigs] = useState<Record<string, any>>({});
  const [target, setTarget] = useState("");
  const [targetError, setTargetError] = useState<string | null>(null);
  const [activeScans, setActiveScans] = useState<ActiveScan[]>([]);
  const [historyRefreshKey, setHistoryRefreshKey] = useState(0);
  const [scanProfile, setScanProfile] = useState<ScanProfile>("quick");

  const [notifyEmail, setNotifyEmail] = useState(false);
  const [emailList, setEmailList] = useState("");

  // Track known job IDs to avoid duplicates
  const knownJobIds = useRef<Set<string>>(new Set());

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

  // --- SCAN PROFILES ---
  useEffect(() => {
    const resetScanners: Record<string, boolean> = {
      nmap: false, nuclei: false, zap: false, nikto: false,
      metasploit: false, openvas: false, wappalyzer: false, whois: false,
      whatweb: false, dirsearch: false, wfuzz: false, dalfox: false,
    };

    if (scanProfile === "quick") {
      // FAST DISCOVERY — lightweight, low-noise scans
      setSelectedScanners({
        ...resetScanners,
        nmap: true, zap: true, wappalyzer: true, whois: true, whatweb: true,
      });
      setScannerConfigs({
        nmap: {
          scan_type: "sS", ports: "top-100", speed: "T4",
          service_detection: true, os_detection: false, skip_discovery: false,
          aggressive: false, fragment: false,
        },
        zap: { mode: "baseline", spider_duration: 1, ajax_spider: false },
        wappalyzer: { enabled: true, recursive: false, probe: "basic" },
        whois: { enabled: true },
        whatweb: { aggression: 1 },
      });
    }
    else if (scanProfile === "deep") {
      // DEEP AUDIT — maximum coverage, all scanners, full port range
      setSelectedScanners({
        ...resetScanners,
        nmap: true, nuclei: true, zap: true, nikto: true,
        metasploit: true, openvas: true, wappalyzer: true, whois: true,
        whatweb: true, dirsearch: true, wfuzz: true, dalfox: true,
      });
      setScannerConfigs({
        nmap: {
          scan_type: "sS", ports: "1-65535", speed: "T4",
          service_detection: true, os_detection: true, skip_discovery: true,
          script: "vuln,default",
        },
        nuclei: {
          tags: "cve,misconfig,exposure,default-login",
          severity: "critical,high,medium,low",
          rate_limit: 150, concurrency: 25, retries: 2, headless: true,
        },
        zap: { mode: "full", ajax_spider: true, spider_duration: 5 },
        nikto: { tuning: "123456789abc" },
        metasploit: {
          preset: "full",
          modules: [
            "auxiliary/scanner/http/http_version", "auxiliary/scanner/http/http_header",
            "auxiliary/scanner/ssh/ssh_version", "auxiliary/scanner/smb/smb_version",
            "auxiliary/scanner/ftp/ftp_version",
          ],
          threads: 10, verbose: true,
        },
        openvas: { profile: "Full and fast" },
        wappalyzer: { enabled: true, recursive: true, max_depth: 3, probe: "full" },
        whois: { enabled: true },
        whatweb: { aggression: 3, max_threads: 25, verbose: true },
        dirsearch: {
          extensions: "php,html,js,txt,asp,aspx,jsp,bak,old,conf",
          threads: 50, recursive: true, recursion_depth: 3, force_extensions: true,
        },
        wfuzz: {
          wordlist: "common.txt", hide_codes: "404",
          threads: 40, follow_redirects: true,
        },
        dalfox: { waf_evasion: true, deep_domxss: true, worker: 40 },
      });
    }
    else if (scanProfile === "web") {
      // WEB APP ATTACK — XSS, SQLi, OWASP, directory discovery focus
      setSelectedScanners({
        ...resetScanners,
        zap: true, nuclei: true, nikto: true, wappalyzer: true,
        dirsearch: true, dalfox: true, wfuzz: true,
      });
      setScannerConfigs({
        zap: { mode: "full", ajax_spider: true, spider_duration: 3 },
        nuclei: {
          tags: "sqli,xss,cve,owasp,injection,lfi,rfi,ssrf,ssti",
          severity: "critical,high,medium",
          rate_limit: 100, headless: true,
        },
        nikto: { tuning: "459ac" },
        wappalyzer: { enabled: true, recursive: true, probe: "full" },
        dirsearch: {
          extensions: "php,html,asp,aspx,jsp,js",
          threads: 50, recursive: true, recursion_depth: 2,
        },
        dalfox: { waf_evasion: true, deep_domxss: true, worker: 30 },
        wfuzz: { wordlist: "common.txt", hide_codes: "404,403", threads: 30 },
      });
    }
    else if (scanProfile === "network") {
      // NETWORK INFRASTRUCTURE — OS, services, SMB/SSH/FTP, port-level analysis
      setSelectedScanners({
        ...resetScanners,
        nmap: true, openvas: true, metasploit: true, whois: true, whatweb: true,
      });
      setScannerConfigs({
        nmap: {
          scan_type: "sS", ports: "1-65535", speed: "T3",
          service_detection: true, os_detection: true, skip_discovery: true,
          script: "vuln,smb-enum-shares,ssh-hostkey,ftp-anon",
        },
        openvas: { profile: "Discovery" },
        metasploit: {
          preset: "full",
          modules: [
            "auxiliary/scanner/http/http_version", "auxiliary/scanner/ssh/ssh_version",
            "auxiliary/scanner/smb/smb_version", "auxiliary/scanner/smb/smb_enumshares",
            "auxiliary/scanner/ftp/ftp_version", "auxiliary/scanner/ftp/anonymous",
            "auxiliary/scanner/mysql/mysql_version", "auxiliary/scanner/postgres/postgres_version",
          ],
          threads: 5, verbose: true,
        },
        whois: { enabled: true },
        whatweb: { aggression: 3, max_threads: 15 },
      });
    }
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

  // --- LOAD ACTIVE JOBS ON MOUNT (persist across refresh) ---
  useEffect(() => {
    const loadActiveJobs = async () => {
      try {
        const activeJobs = await getActiveJobs();
        const scans: ActiveScan[] = activeJobs.map((job) => {
          knownJobIds.current.add(job.job_id);
          return {
            id: job.job_id,
            jobId: job.job_id,
            target: job.target,
            tools: job.scanners_requested,
            status: job.status as "pending" | "running",
            toolStatus: job.tool_status,
            startTime: job.created_at,
          };
        });
        setActiveScans(scans);
      } catch (error) {
        console.error("Failed to load active jobs:", error);
      }
    };
    loadActiveJobs();
  }, []);

  // --- POLL ACTIVE SCANS for real tool_status updates ---
  useEffect(() => {
    const activeScanIds = activeScans.filter(
      (s) => s.status !== "completed" && s.status !== "failed"
    );
    
    if (activeScanIds.length === 0) return;

    const pollInterval = setInterval(async () => {
      let anyFinished = false;

      for (const scan of activeScanIds) {
        try {
          const statusData = await getScanStatus(scan.jobId);
          
          setActiveScans((prev) =>
            prev.map((s) => {
              if (s.jobId !== scan.jobId) return s;

              const isFinal = ["completed", "failed", "partial_success"].includes(statusData.status);
              
              if (isFinal) {
                anyFinished = true;
              }

              return {
                ...s,
                status: isFinal
                  ? (statusData.status === "failed" ? "failed" : "completed")
                  : (statusData.status as "pending" | "running"),
                toolStatus: statusData.tool_status || s.toolStatus,
              };
            })
          );
        } catch (error) {
          console.error("Poll error:", error);
        }
      }

      if (anyFinished) {
        // Refresh history when a scan finishes
        setHistoryRefreshKey((prev) => prev + 1);
        // Remove completed scans after a short delay
        setTimeout(() => {
          setActiveScans((prev) =>
            prev.filter((s) => s.status !== "completed" && s.status !== "failed")
          );
        }, 3000);
      }
    }, 3000);

    return () => clearInterval(pollInterval);
  }, [activeScans]);

  const handleRunScan = async () => {
    if (!validateTarget(target)) return;

    const payload = buildScanPayload();
    const selectedToolNames = Object.keys(payload.scanners);
    if (selectedToolNames.length === 0) {
      alert("Please select at least one scanner.");
      return;
    }

    const tempId = `temp-${Date.now()}`;
    const newScan: ActiveScan = {
      id: tempId,
      jobId: "",
      target,
      tools: selectedToolNames,
      status: "pending",
      toolStatus: Object.fromEntries(selectedToolNames.map((t) => [t, "pending"])),
      startTime: new Date().toISOString(),
    };

    setActiveScans((prev) => [...prev, newScan]);

    try {
      const response = await startScan(payload);
      const jobId = response.job_id;
      knownJobIds.current.add(jobId);
      setActiveScans((prev) =>
        prev.map((s) =>
          s.id === tempId ? { ...s, id: jobId, jobId: jobId, status: "running" } : s
        )
      );
      setTarget("");
    } catch (err: any) {
      console.error(err);
      setActiveScans((prev) =>
        prev.map((s) =>
          s.id === tempId ? { ...s, status: "failed" } : s
        )
      );
      alert(`Failed to start scan: ${err.message || "Unknown error"}`);
    }
  };

  const handleStopScan = (scanId: string) => {
    setActiveScans((prev) =>
      prev.map((s) => (s.id === scanId ? { ...s, status: "failed" } : s))
    );
    setTimeout(() => {
      setActiveScans((prev) => prev.filter((s) => s.id !== scanId));
    }, 2000);
  };

  const toggleScanner = (id: string) => {
    setSelectedScanners((prev) => ({ ...prev, [id]: !prev[id] }));
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
                <div className="space-y-4">
                  {activeScans.map((scan) => {
                    const progress = scan.status === "completed" 
                      ? 100 
                      : scan.status === "failed" 
                        ? 100 
                        : calculateProgress(scan.tools, scan.toolStatus);
                    
                    const completedTools = scan.tools.filter(
                      (t) => (scan.toolStatus[t] || "").toLowerCase() === "completed"
                    );
                    const runningTools = scan.tools.filter(
                      (t) => (scan.toolStatus[t] || "").toLowerCase() === "running"
                    );
                    const pendingTools = scan.tools.filter(
                      (t) => {
                        const s = (scan.toolStatus[t] || "pending").toLowerCase();
                        return s === "pending";
                      }
                    );

                    return (
                      <div
                        key={scan.id}
                        className="p-4 bg-slate-50 dark:bg-slate-900/40 rounded-lg border border-slate-200 dark:border-slate-700"
                      >
                        {/* Header */}
                        <div className="flex items-center justify-between mb-3">
                          <div>
                            <span className="font-mono font-semibold text-sm text-slate-900 dark:text-slate-100">
                              {scan.target}
                            </span>
                            <span className={`ml-2 text-xs px-2 py-0.5 rounded-full font-medium ${
                              scan.status === "completed" ? "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400" :
                              scan.status === "failed" ? "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400" :
                              scan.status === "running" ? "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400" :
                              "bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400"
                            }`}>
                              {scan.status.toUpperCase()}
                            </span>
                          </div>
                          {scan.status !== "completed" && scan.status !== "failed" && (
                            <button
                              onClick={() => handleStopScan(scan.id)}
                              className="text-xs text-red-500 hover:text-red-600 font-medium px-2 py-1"
                            >
                              Stop
                            </button>
                          )}
                        </div>

                        {/* Progress Bar */}
                        <div className="w-full h-2 bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden mb-2">
                          <div
                            className={`h-full rounded-full transition-all duration-700 ${
                              scan.status === "failed" ? "bg-red-500" :
                              scan.status === "completed" ? "bg-green-500" :
                              "bg-blue-500"
                            }`}
                            style={{ width: `${progress}%` }}
                          ></div>
                        </div>

                        <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400 mb-3">
                          <span>{completedTools.length}/{scan.tools.length} scanners complete</span>
                          <span className="font-semibold">{progress}%</span>
                        </div>

                        {/* Per-Scanner Status */}
                        <div className="flex flex-wrap gap-1.5">
                          {scan.tools.map((tool) => {
                            const toolSt = (scan.toolStatus[tool] || "pending").toLowerCase();
                            let dotColor = "bg-slate-300 dark:bg-slate-600"; // pending
                            let textStyle = "text-slate-400 dark:text-slate-500";
                            
                            if (toolSt === "completed") {
                              dotColor = "bg-green-500";
                              textStyle = "text-green-700 dark:text-green-400";
                            } else if (toolSt === "running") {
                              dotColor = "bg-blue-500 animate-pulse";
                              textStyle = "text-blue-700 dark:text-blue-400";
                            } else if (toolSt === "failed" || toolSt === "error") {
                              dotColor = "bg-red-500";
                              textStyle = "text-red-600 dark:text-red-400";
                            }

                            return (
                              <span
                                key={tool}
                                className={`inline-flex items-center gap-1 text-[11px] px-2 py-0.5 rounded-full border border-slate-200 dark:border-slate-600 ${textStyle}`}
                                title={`${tool}: ${toolSt}`}
                              >
                                <span className={`w-1.5 h-1.5 rounded-full ${dotColor}`}></span>
                                {tool}
                              </span>
                            );
                          })}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      <ScanHistory key={historyRefreshKey} />

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
