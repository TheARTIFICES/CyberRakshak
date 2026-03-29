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

const SEVERITIES = ["critical", "high", "medium", "low", "info"];

// Parse severity string to array and back
const parseSeverity = (s: string | undefined): string[] => s ? s.split(",").filter(Boolean) : [];
const joinSeverity = (arr: string[]): string => arr.join(",");

export const NucleiConfigForm = ({ config, setConfig }: any) => {
  const selectedSevs = parseSeverity(config.severity);
  const toggleSev = (sev: string) => {
    const next = selectedSevs.includes(sev) ? selectedSevs.filter(s => s !== sev) : [...selectedSevs, sev];
    setConfig({ ...config, severity: next.length ? joinSeverity(next) : null });
  };

  return (
    <div className="space-y-3">
      <Section title="Templates">
        <div>
          <label className={labelCls}>Tags</label>
          <input type="text" value={config.tags || "cve"} onChange={(e) => setConfig({ ...config, tags: e.target.value })} className={inputCls} />
          <p className={hintCls}>Comma-separated: cve, misconfig, exposure, default-login, etc.</p>
        </div>
        <div>
          <label className={labelCls}>Exclude Tags</label>
          <input type="text" value={config.exclude_tags || ""} placeholder="e.g. dos,fuzz" onChange={(e) => setConfig({ ...config, exclude_tags: e.target.value || null })} className={inputCls} />
        </div>
        <div>
          <label className={labelCls}>Template IDs</label>
          <input type="text" value={config.template_id || ""} placeholder="CVE-2021-44228,tech-detect" onChange={(e) => setConfig({ ...config, template_id: e.target.value || null })} className={inputCls} />
        </div>
      </Section>

      <Section title="Severity Filter">
        <div className="flex flex-wrap gap-2">
          {SEVERITIES.map((sev) => (
            <label key={sev} className={`${checkRow} px-2 py-1 rounded border ${selectedSevs.includes(sev) ? "border-blue-500 bg-blue-500/10" : "border-slate-300 dark:border-slate-600"}`}>
              <input type="checkbox" checked={selectedSevs.includes(sev)} onChange={() => toggleSev(sev)} />
              {sev.charAt(0).toUpperCase() + sev.slice(1)}
            </label>
          ))}
        </div>
        <p className={hintCls}>Select multiple. Leave all unchecked for any severity.</p>
      </Section>

      <Section title="Performance" defaultOpen={false}>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className={labelCls}>Rate Limit</label>
            <input type="number" value={config.rate_limit || ""} placeholder="150" onChange={(e) => setConfig({ ...config, rate_limit: e.target.value ? parseInt(e.target.value) : null })} className={inputCls} />
            <p className={hintCls}>Req/sec</p>
          </div>
          <div>
            <label className={labelCls}>Bulk Size</label>
            <input type="number" value={config.bulk_size || ""} placeholder="25" onChange={(e) => setConfig({ ...config, bulk_size: e.target.value ? parseInt(e.target.value) : null })} className={inputCls} />
          </div>
          <div>
            <label className={labelCls}>Concurrency</label>
            <input type="number" value={config.concurrency || ""} placeholder="25" onChange={(e) => setConfig({ ...config, concurrency: e.target.value ? parseInt(e.target.value) : null })} className={inputCls} />
          </div>
          <div>
            <label className={labelCls}>Timeout (sec)</label>
            <input type="number" value={config.timeout || ""} placeholder="10" onChange={(e) => setConfig({ ...config, timeout: e.target.value ? parseInt(e.target.value) : null })} className={inputCls} />
          </div>
          <div>
            <label className={labelCls}>Retries</label>
            <input type="number" value={config.retries || ""} placeholder="1" onChange={(e) => setConfig({ ...config, retries: e.target.value ? parseInt(e.target.value) : null })} className={inputCls} />
          </div>
        </div>
      </Section>

      <Section title="Features" defaultOpen={false}>
        <label className={checkRow}><input type="checkbox" checked={!!config.headless} onChange={(e) => setConfig({ ...config, headless: e.target.checked })} />Headless Browser Templates</label>
        <label className={checkRow}><input type="checkbox" checked={!!config.new_templates} onChange={(e) => setConfig({ ...config, new_templates: e.target.checked })} />New Templates Only</label>
        <label className={checkRow}><input type="checkbox" checked={!!config.automatic_scan} onChange={(e) => setConfig({ ...config, automatic_scan: e.target.checked })} />Automatic Scan</label>
      </Section>

      <Section title="Raw Arguments" defaultOpen={false}>
        <textarea value={config.raw_args_text || ""} placeholder="-proxy http://127.0.0.1:8080" onChange={(e) => setConfig({ ...config, raw_args_text: e.target.value, raw_args: e.target.value ? e.target.value.split(/\s+/).filter(Boolean) : null })} className={inputCls} rows={3} />
        <p className={hintCls}>Space-separated. Appended as-is.</p>
      </Section>
    </div>
  );
};