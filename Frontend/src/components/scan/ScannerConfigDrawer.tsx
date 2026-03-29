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

const DEFAULT_CONFIGS: Record<string, any> = {
  nmap: {
    scan_type: null, ports: "", speed: "T4", service_detection: true,
    os_detection: false, aggressive: false, skip_discovery: false, ping_only: false,
    script: "", script_args: "", fragment: false, decoys: "",
    max_rate: null, min_rate: null, verbosity: null, raw_args: null,
  },
  nuclei: {
    tags: "cve", exclude_tags: null, severity: null, template_id: null,
    rate_limit: null, bulk_size: null, concurrency: null, timeout: null, retries: null,
    headless: false, new_templates: false, automatic_scan: false, raw_args: null,
  },
  zap: {
    mode: "baseline", spider_duration: null, ajax_spider: false,
    alert_level: null, short_output: false, zap_options: null,
    ignore_failures: false, debug: false, raw_args: null,
  },
  nikto: {
    tuning: null, port: null, ssl: false, nossl: false, vhost: null,
    evasion: null, display: null, no404: false, nolookup: false,
    add_header: null, maxtime: null, raw_args: null,
  },
  metasploit: {
    modules: ["auxiliary/scanner/http/http_version"], preset: null,
    threads: null, verbose: false, raw_args: null,
  },
  openvas: { profile: "Full and fast" },
  wappalyzer: {
    enabled: true, recursive: false, max_urls: null, max_depth: null,
    probe: null, no_scripts: false, no_redirect: false, user_agent: null, raw_args: null,
  },
  whois: { enabled: true, raw_args: null },
  whatweb: {
    aggression: 1, max_threads: null, follow_redirect: null, user_agent: null,
    plugins: null, grep: null, proxy: null, verbose: false, raw_args: null,
  },
  dirsearch: {
    extensions: "php,html,js,txt", exclude_extensions: null, threads: 50,
    recursive: false, recursion_depth: null, force_extensions: false,
    exclude_status: null, include_status: null, follow_redirects: false,
    wordlist: null, headers: null, user_agent: null, random_agent: false,
    cookie: null, timeout: null, prefixes: null, suffixes: null, raw_args: null,
  },
  wfuzz: {
    wordlist: "common.txt", hide_codes: "404", hide_lines: null, hide_words: null,
    hide_chars: null, show_codes: null, show_lines: null, show_words: null,
    show_chars: null, filter_expr: null, hide_regex: null, show_regex: null,
    threads: null, follow_redirects: false, headers: null, post_data: null,
    proxy: null, verbose: false, raw_args: null,
  },
  dalfox: {
    blind_url: null, headers: null, cookie: null, method: null, data: null,
    param: null, delay: null, worker: null, timeout: null, waf_evasion: false,
    deep_domxss: false, custom_payload: null, only_poc: false, silence: false,
    proxy: null, raw_args: null,
  },
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
