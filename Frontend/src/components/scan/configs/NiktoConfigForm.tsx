import React, { useState } from "react";

const Section = ({ title, children, defaultOpen = true }: { title: string; children: React.ReactNode; defaultOpen?: boolean }) => {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div className="border border-slate-200 dark:border-slate-700 rounded-lg overflow-hidden">
      <button type="button" onClick={() => setOpen(!open)} className="w-full flex items-center justify-between px-3 py-2 bg-slate-100 dark:bg-slate-800/60 text-sm font-semibold text-left">
        {title}<span className="text-xs opacity-60">{open ? "▾" : "▸"}</span>
      </button>
      {open && <div className="p-3 space-y-3">{children}</div>}
    </div>
  );
};

const inputCls = "w-full p-2 rounded bg-slate-200 dark:bg-slate-800 text-sm";
const labelCls = "block mb-1 text-sm font-medium";
const hintCls = "text-xs opacity-60 mt-1";
const checkRow = "flex items-center gap-2 text-sm";

const TUNING_OPTIONS = [
  { value: "0", label: "File Upload" },
  { value: "1", label: "Interesting File / Seen in Logs" },
  { value: "2", label: "Misconfiguration / Default File" },
  { value: "3", label: "Information Disclosure" },
  { value: "4", label: "Injection (XSS/Script/HTML)" },
  { value: "5", label: "Remote File Retrieval — Inside Web Root" },
  { value: "6", label: "Denial of Service" },
  { value: "7", label: "Remote File Retrieval — Server Wide" },
  { value: "8", label: "Command Execution / Remote Shell" },
  { value: "9", label: "SQL Injection" },
  { value: "a", label: "Authentication Bypass" },
  { value: "b", label: "Software Identification" },
  { value: "c", label: "Remote Source Inclusion" },
];

const EVASION_OPTIONS = [
  { value: "1", label: "Random URI Encoding" },
  { value: "2", label: "Directory Self-Reference (/./)" },
  { value: "3", label: "Premature URL Ending" },
  { value: "4", label: "Prepend Long Random String" },
  { value: "5", label: "Fake Parameter" },
  { value: "6", label: "TAB as Request Spacer" },
  { value: "7", label: "Change URL Case" },
  { value: "8", label: "Windows Directory Separator (\\)" },
];

const DISPLAY_OPTIONS = [
  { value: "1", label: "Show Redirects" },
  { value: "2", label: "Show Cookies Received" },
  { value: "3", label: "Show All 200/OK Responses" },
  { value: "4", label: "Show URLs Requiring Auth" },
  { value: "V", label: "Verbose Output" },
];

const parseMulti = (s: string | undefined): string[] => s ? s.split("") : [];
const joinMulti = (arr: string[]): string | null => arr.length ? arr.join("") : null;

export const NiktoConfigForm = ({ config, setConfig }: any) => {
  const selectedTuning = parseMulti(config.tuning);
  const selectedEvasion = parseMulti(config.evasion);
  const selectedDisplay = parseMulti(config.display);

  const toggleMulti = (field: string, current: string[], val: string) => {
    const next = current.includes(val) ? current.filter(v => v !== val) : [...current, val];
    setConfig({ ...config, [field]: joinMulti(next) });
  };

  return (
    <div className="space-y-3">
      <Section title="Tuning Categories">
        <div className="space-y-1.5">
          {TUNING_OPTIONS.map(opt => (
            <label key={opt.value} className={`${checkRow} px-2 py-1 rounded border ${selectedTuning.includes(opt.value) ? "border-blue-500 bg-blue-500/10" : "border-slate-300 dark:border-slate-600"}`}>
              <input type="checkbox" checked={selectedTuning.includes(opt.value)} onChange={() => toggleMulti("tuning", selectedTuning, opt.value)} />
              <span className="text-xs font-mono mr-1 opacity-60">{opt.value}</span> {opt.label}
            </label>
          ))}
        </div>
        <p className={hintCls}>Select which test categories to run. Leave all unchecked for default.</p>
      </Section>

      <Section title="Connection" defaultOpen={false}>
        <div>
          <label className={labelCls}>Port</label>
          <input type="text" value={config.port || ""} placeholder="80,443,8080" onChange={(e) => setConfig({ ...config, port: e.target.value || null })} className={inputCls} />
        </div>
        <label className={checkRow}><input type="checkbox" checked={!!config.ssl} onChange={(e) => setConfig({ ...config, ssl: e.target.checked })} />Force SSL/TLS (-ssl)</label>
        <label className={checkRow}><input type="checkbox" checked={!!config.nossl} onChange={(e) => setConfig({ ...config, nossl: e.target.checked })} />Disable SSL/TLS (-nossl)</label>
        <div>
          <label className={labelCls}>Virtual Host</label>
          <input type="text" value={config.vhost || ""} placeholder="www.example.com" onChange={(e) => setConfig({ ...config, vhost: e.target.value || null })} className={inputCls} />
          <p className={hintCls}>Set Host header for virtual hosting.</p>
        </div>
      </Section>

      <Section title="Evasion Techniques" defaultOpen={false}>
        <div className="space-y-1.5">
          {EVASION_OPTIONS.map(opt => (
            <label key={opt.value} className={`${checkRow} px-2 py-1 rounded border ${selectedEvasion.includes(opt.value) ? "border-blue-500 bg-blue-500/10" : "border-slate-300 dark:border-slate-600"}`}>
              <input type="checkbox" checked={selectedEvasion.includes(opt.value)} onChange={() => toggleMulti("evasion", selectedEvasion, opt.value)} />
              <span className="text-xs font-mono mr-1 opacity-60">{opt.value}</span> {opt.label}
            </label>
          ))}
        </div>
        <p className={hintCls}>Select multiple IDS evasion techniques to combine.</p>
      </Section>

      <Section title="Display Options" defaultOpen={false}>
        <div className="space-y-1.5">
          {DISPLAY_OPTIONS.map(opt => (
            <label key={opt.value} className={`${checkRow} px-2 py-1 rounded border ${selectedDisplay.includes(opt.value) ? "border-blue-500 bg-blue-500/10" : "border-slate-300 dark:border-slate-600"}`}>
              <input type="checkbox" checked={selectedDisplay.includes(opt.value)} onChange={() => toggleMulti("display", selectedDisplay, opt.value)} />
              {opt.label}
            </label>
          ))}
        </div>
      </Section>

      <Section title="Behavior" defaultOpen={false}>
        <label className={checkRow}><input type="checkbox" checked={!!config.no404} onChange={(e) => setConfig({ ...config, no404: e.target.checked })} />Disable 404 Checking</label>
        <label className={checkRow}><input type="checkbox" checked={!!config.nolookup} onChange={(e) => setConfig({ ...config, nolookup: e.target.checked })} />Disable DNS Lookups</label>
        <div>
          <label className={labelCls}>Custom Headers</label>
          <input type="text" value={config.add_header || ""} placeholder="X-Custom: value" onChange={(e) => setConfig({ ...config, add_header: e.target.value || null })} className={inputCls} />
        </div>
        <div>
          <label className={labelCls}>Max Scan Time (seconds)</label>
          <input type="number" value={config.maxtime || ""} placeholder="No limit" onChange={(e) => setConfig({ ...config, maxtime: e.target.value ? parseInt(e.target.value) : null })} className={inputCls} />
        </div>
      </Section>

      <Section title="Raw Arguments" defaultOpen={false}>
        <textarea value={config.raw_args_text || ""} placeholder="Additional CLI flags..." onChange={(e) => setConfig({ ...config, raw_args_text: e.target.value, raw_args: e.target.value ? e.target.value.split(/\s+/).filter(Boolean) : null })} className={inputCls} rows={3} />
        <p className={hintCls}>Space-separated. Appended as-is.</p>
      </Section>
    </div>
  );
};