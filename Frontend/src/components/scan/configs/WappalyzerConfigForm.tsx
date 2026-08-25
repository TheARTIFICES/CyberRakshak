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

export const WappalyzerConfigForm = ({ config, setConfig }: any) => (
  <div className="space-y-3">
    <Section title="Basic">
      <label className={checkRow}><input type="checkbox" checked={config.enabled !== false} onChange={(e) => setConfig({ ...config, enabled: e.target.checked })} />Enable Wappalyzer</label>
    </Section>

    <Section title="Crawling" defaultOpen={false}>
      <label className={checkRow}><input type="checkbox" checked={!!config.recursive} onChange={(e) => setConfig({ ...config, recursive: e.target.checked })} />Recursive — follow links and crawl</label>
      <div>
        <label className={labelCls}>Max URLs</label>
        <input type="number" value={config.max_urls || ""} placeholder="No limit" onChange={(e) => setConfig({ ...config, max_urls: e.target.value ? parseInt(e.target.value) : null })} className={inputCls} />
      </div>
      <div>
        <label className={labelCls}>Max Depth</label>
        <input type="number" value={config.max_depth || ""} placeholder="No limit" onChange={(e) => setConfig({ ...config, max_depth: e.target.value ? parseInt(e.target.value) : null })} className={inputCls} />
      </div>
    </Section>

    <Section title="Detection" defaultOpen={false}>
      <div>
        <label className={labelCls}>Probe Mode</label>
        <select value={config.probe || ""} onChange={(e) => setConfig({ ...config, probe: e.target.value || null })} className={inputCls}>
          <option value="">None</option>
          <option value="basic">Basic — DNS records</option>
          <option value="full">Full — DNS + additional requests</option>
        </select>
      </div>
      <label className={checkRow}><input type="checkbox" checked={!!config.no_scripts} onChange={(e) => setConfig({ ...config, no_scripts: e.target.checked })} />Disable JavaScript Execution</label>
      <label className={checkRow}><input type="checkbox" checked={!!config.no_redirect} onChange={(e) => setConfig({ ...config, no_redirect: e.target.checked })} />Disable Cross-Domain Redirects</label>
    </Section>

    <Section title="Identity" defaultOpen={false}>
      <div>
        <label className={labelCls}>Custom User Agent</label>
        <input type="text" value={config.user_agent || ""} placeholder="Mozilla/5.0 ..." onChange={(e) => setConfig({ ...config, user_agent: e.target.value || null })} className={inputCls} />
      </div>
    </Section>

    <Section title="Raw Arguments" defaultOpen={false}>
      <textarea value={config.raw_args_text || ""} placeholder="Additional CLI flags..." onChange={(e) => setConfig({ ...config, raw_args_text: e.target.value, raw_args: e.target.value ? e.target.value.split(/\s+/).filter(Boolean) : null })} className={inputCls} rows={3} />
      <p className={hintCls}>Space-separated. Appended as-is.</p>
    </Section>
  </div>
);