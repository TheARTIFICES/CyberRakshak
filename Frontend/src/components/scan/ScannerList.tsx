import React from "react";

interface ScannerItem {
  id: string;        // backend scanner key
  name: string;      // display name
  description: string;
}

const scanners: ScannerItem[] = [
  {
    id: "nmap",
    name: "Nmap",
    description: "Port scanning, service detection, NSE scripts.",
  },
  {
    id: "nuclei",
    name: "Nuclei",
    description: "Template-based vulnerability scanning (CVE, misconfig).",
  },
  {
    id: "zap",
    name: "OWASP ZAP",
    description: "Baseline + full active web scanning.",
  },
  {
    id: "nikto",
    name: "Nikto",
    description: "Web server vulnerability testing.",
  },
  {
    id: "metasploit",
    name: "Metasploit",
    description: "Exploit modules & auxiliary scanners.",
  },
  {
    id: "openvas",
    name: "OpenVAS",
    description: "Comprehensive vulnerability scanning.",
  },
  {
    id: "wappalyzer",
    name: "Wappalyzer",
    description: "Tech stack detection & fingerprinting.",
  },
  {
    id: "whois",
    name: "Whois",
    description: "Domain registration, ownership details, and expiry data.",
  },
  {
    id: "whatweb",
    name: "WhatWeb",
    description: "Next-gen web scanner to identify CMS, blogging platforms, and JS libraries.",
  },
  {
    id: "dirsearch",
    name: "Dirsearch",
    description: "Web path scanner. Brute forces directories and files.",
  },
  {
    id: "wfuzz",
    name: "Wfuzz",
    description: "Web application brute-forcer for discovery.",
  },
  {
    id: "dalfox",
    name: "Dalfox",
    description: "Parameter analysis and XSS scanning tool.",
  },
];

interface Props {
  selected: Record<string, boolean>;
  onToggle: (scannerId: string) => void;
  onConfigure: (scannerId: string) => void;
}

const ScannerList: React.FC<Props> = ({ selected, onToggle, onConfigure }) => {
  return (
    <div className="grid grid-cols-2 gap-4">
      {scanners.map((scanner) => (
        <div
          key={scanner.id}
          className="
            p-4 rounded-xl shadow border
            bg-white dark:bg-slate-800
            border-slate-200 dark:border-slate-700
          "
        >
          <div className="flex items-center justify-between">
            <h3 className="font-semibold">{scanner.name}</h3>

            <label className="relative inline-flex cursor-pointer items-center">
              <input
                type="checkbox"
                className="peer sr-only"
                checked={selected[scanner.id] || false}
                onChange={() => onToggle(scanner.id)}
              />
              <div
                className="
                  w-9 h-5 rounded-full bg-slate-300 peer-checked:bg-blue-600
                  after:absolute after:top-[2px] after:left-[2px]
                  after:w-4 after:h-4 after:bg-white after:rounded-full
                  peer-checked:after:translate-x-4
                  after:transition-all
                "
              ></div>
            </label>
          </div>

          <p className="text-sm opacity-70 mt-1">{scanner.description}</p>

          <button
            onClick={() => onConfigure(scanner.id)}
            className="
              mt-3 text-xs px-3 py-1.5 rounded-lg
              bg-slate-200 dark:bg-slate-700
              hover:bg-slate-300 dark:hover:bg-slate-600
              transition
            "
          >
            Configure
          </button>
        </div>
      ))}
    </div>
  );
};

export default ScannerList;
