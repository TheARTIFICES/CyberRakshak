import React, { useState, useEffect } from "react";
import RightDrawer from "../ui/RightDrawer";
import { WhoisConfigForm } from "./configs/WhoisConfigForm";
import { NmapConfigForm } from "./configs/NmapConfigForm";
import { NucleiConfigForm } from "./configs/NucleiConfigForm";
import { ZapConfigForm } from "./configs/ZapConfigForm";
import { NiktoConfigForm } from "./configs/NiktoConfigForm";
import { MetasploitConfigForm } from "./configs/MetasploitConfigForm";
import { OpenVASConfigForm } from "./configs/OpenVASConfigForm";
import { WappalyzerConfigForm } from "./configs/WappalyzerConfigForm";
import { WhatWebConfigForm } from "./configs/WhatWebConfigForm";
import { DirsearchConfigForm } from "./configs/DirsearchConfigForm";
import { WfuzzConfigForm } from "./configs/WfuzzConfigForm";
import { DalfoxConfigForm } from "./configs/DalfoxConfigForm";
import { GrypeConfigForm } from "./configs/GrypeConfigForm";

const DEFAULT_CONFIGS = {
  nmap: { ports: "", speed: "T4", script: "" },
  nuclei: { tags: "cve", severity: "" },
  zap: { mode: "baseline" },
  nikto: { tuning: "" },
  metasploit: { modules: ["auxiliary/scanner/http/http_version"] },
  openvas: { profile: "Full and fast" },
  wappalyzer: { enabled: true },
  whois: { enabled: true },  // <--- Added comma here
  whatweb: { aggression: 1 }, // Added WhatWeb default config
  dirsearch: { extensions: "php,html,js,txt", threads: 50 },
  wfuzz: { wordlist: "common.txt", hide_codes: "404" },
  dalfox: { blind_url: "scanme.nmap.org" },
  grype: { scope: "Squashed" }
};

// FIX: Added currentConfig to props
const ScannerConfigDrawer = ({ open, scannerId, currentConfig, onClose, onSave }: any) => {
  const [config, setConfig] = useState({});

  useEffect(() => {
    if (scannerId) {
      // FIX: Use the passed currentConfig if available, otherwise use default
      const defaults = DEFAULT_CONFIGS[scannerId as keyof typeof DEFAULT_CONFIGS] || {};
      setConfig(currentConfig || defaults);
    }
  }, [scannerId, currentConfig]);

  const handleSave = () => {
    onSave(scannerId, config);
    onClose();
  };

  return (
    <RightDrawer
      open={open}
      onClose={onClose}
      title={`${scannerId?.toUpperCase()} Configuration`}
    >
      {scannerId === "nmap" && <NmapConfigForm config={config} setConfig={setConfig} />}
      {scannerId === "nuclei" && <NucleiConfigForm config={config} setConfig={setConfig} />}
      {scannerId === "zap" && <ZapConfigForm config={config} setConfig={setConfig} />}
      {scannerId === "nikto" && <NiktoConfigForm config={config} setConfig={setConfig} />}
      {scannerId === "metasploit" && <MetasploitConfigForm config={config} setConfig={setConfig} />}
      {scannerId === "openvas" && <OpenVASConfigForm config={config} setConfig={setConfig} />}
      {scannerId === "wappalyzer" && <WappalyzerConfigForm config={config} setConfig={setConfig} />}
      {scannerId === "whois" && <WhoisConfigForm config={config} setConfig={setConfig} />}
      {scannerId === "whatweb" && <WhatWebConfigForm config={config} setConfig={setConfig} />}
      {scannerId === "dirsearch" && <DirsearchConfigForm config={config} setConfig={setConfig} />}
      {scannerId === "wfuzz" && <WfuzzConfigForm config={config} setConfig={setConfig} />}
      {scannerId === "dalfox" && <DalfoxConfigForm config={config} setConfig={setConfig} />}
      {scannerId === "grype" && <GrypeConfigForm config={config} setConfig={setConfig} />}

      <button
        className="w-full mt-6 py-2 rounded bg-blue-600 text-white hover:bg-blue-700"
        onClick={handleSave}
      >
        Save Configuration
      </button>
    </RightDrawer>
  );
};

export default ScannerConfigDrawer;
