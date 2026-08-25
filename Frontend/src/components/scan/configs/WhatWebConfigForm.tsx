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

export const WhatWebConfigForm = ({ config, setConfig }: any) => (
  <div className="space-y-3">
    <Section title="Basic">
      <div>
        <label className={labelCls}>Aggression Level</label>
        <select value={config.aggression || 1} onChange={(e) => setConfig({ ...config, aggression: parseInt(e.target.value) })} className={inputCls}>
          <option value={1}>1 — Stealthy (single request, default)</option>
          <option value={3}>3 — Aggressive (follow-up probes on matches)</option>
          <option value={4}>4 — Heavy (all tests on all targets)</option>
        </select>
        <p className={hintCls}>Higher levels are faster but noisier.</p>
      </div>
    </Section>

    <Section title="Performance" defaultOpen={false}>
      <div>
        <label className={labelCls}>Max Threads</label>
        <input type="number" value={config.max_threads || ""} placeholder="25" onChange={(e) => setConfig({ ...config, max_threads: e.target.value ? parseInt(e.target.value) : null })} className={inputCls} />
      </div>
    </Section>

    <Section title="Behavior" defaultOpen={false}>
      <div>
        <label className={labelCls}>Follow Redirects</label>
        <select value={config.follow_redirect || ""} onChange={(e) => setConfig({ ...config, follow_redirect: e.target.value || null })} className={inputCls}>
          <option value="">Default</option>
          <option value="never">Never</option>
          <option value="http-only">HTTP Only</option>
          <option value="meta-only">Meta Only</option>
          <option value="same-site">Same Site</option>
          <option value="always">Always</option>
        </select>
      </div>
      <label className={checkRow}><input type="checkbox" checked={!!config.verbose} onChange={(e) => setConfig({ ...config, verbose: e.target.checked })} />Verbose Output</label>
    </Section>

    <Section title="Identity" defaultOpen={false}>
      <div>
        <label className={labelCls}>Custom User Agent</label>
        <input type="text" value={config.user_agent || ""} placeholder="Mozilla/5.0 ..." onChange={(e) => setConfig({ ...config, user_agent: e.target.value || null })} className={inputCls} />
      </div>
    </Section>

    <Section title="Plugins & Filtering" defaultOpen={false}>
      <div>
        <label className={labelCls}>Plugins</label>
        <input type="text" value={config.plugins || ""} placeholder="Comma-separated plugin names" onChange={(e) => setConfig({ ...config, plugins: e.target.value || null })} className={inputCls} />
      </div>
      <div>
        <label className={labelCls}>Grep</label>
        <input type="text" value={config.grep || ""} placeholder="Search for string/regex in response" onChange={(e) => setConfig({ ...config, grep: e.target.value || null })} className={inputCls} />
      </div>
    </Section>

    <Section title="Network" defaultOpen={false}>
      <div>
        <label className={labelCls}>Proxy</label>
        <input type="text" value={config.proxy || ""} placeholder="hostname:port" onChange={(e) => setConfig({ ...config, proxy: e.target.value || null })} className={inputCls} />
      </div>
    </Section>

    <Section title="Raw Arguments" defaultOpen={false}>
      <textarea value={config.raw_args_text || ""} placeholder="Additional CLI flags..." onChange={(e) => setConfig({ ...config, raw_args_text: e.target.value, raw_args: e.target.value ? e.target.value.split(/\s+/).filter(Boolean) : null })} className={inputCls} rows={3} />
      <p className={hintCls}>Space-separated. Appended as-is.</p>
    </Section>
  </div>
);
