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

export const ZapConfigForm = ({ config, setConfig }: any) => (
  <div className="space-y-3">
    <Section title="Scan Mode">
      <div>
        <label className={labelCls}>Mode</label>
        <select value={config.mode || "baseline"} onChange={(e) => setConfig({ ...config, mode: e.target.value })} className={inputCls}>
          <option value="baseline">Baseline (Passive — safe for production)</option>
          <option value="full">Full Scan (Active attacks — non-production only)</option>
          <option value="api">API Scan (OpenAPI/Swagger target)</option>
        </select>
      </div>
      <div>
        <label className={labelCls}>Spider Duration (minutes)</label>
        <input type="number" value={config.spider_duration || ""} placeholder="1" onChange={(e) => setConfig({ ...config, spider_duration: e.target.value ? parseInt(e.target.value) : null })} className={inputCls} />
        <p className={hintCls}>How long to spider/crawl before scanning.</p>
      </div>
    </Section>

    <Section title="Features">
      <label className={checkRow}><input type="checkbox" checked={!!config.ajax_spider} onChange={(e) => setConfig({ ...config, ajax_spider: e.target.checked })} />Enable AJAX Spider — crawls JS-heavy SPAs</label>
      <div>
        <label className={labelCls}>Min Alert Level</label>
        <select value={config.alert_level || ""} onChange={(e) => setConfig({ ...config, alert_level: e.target.value || null })} className={inputCls}>
          <option value="">Default</option>
          <option value="PASS">PASS</option>
          <option value="IGNORE">IGNORE</option>
          <option value="INFO">INFO</option>
          <option value="WARN">WARN</option>
          <option value="FAIL">FAIL</option>
        </select>
      </div>
    </Section>

    <Section title="Behavior" defaultOpen={false}>
      <label className={checkRow}><input type="checkbox" checked={!!config.short_output} onChange={(e) => setConfig({ ...config, short_output: e.target.checked })} />Short Output — hide PASSes and example URLs</label>
      <label className={checkRow}><input type="checkbox" checked={!!config.debug} onChange={(e) => setConfig({ ...config, debug: e.target.checked })} />Debug Mode</label>
      <label className={checkRow}><input type="checkbox" checked={!!config.ignore_failures} onChange={(e) => setConfig({ ...config, ignore_failures: e.target.checked })} />Ignore Failures — exit 0 even with warnings</label>
      <div>
        <label className={labelCls}>ZAP Config Options (-z)</label>
        <input type="text" value={config.zap_options || ""} placeholder='-config rules.csrf.ignorelist=search' onChange={(e) => setConfig({ ...config, zap_options: e.target.value || null })} className={inputCls} />
        <p className={hintCls}>Raw ZAP -config parameters.</p>
      </div>
    </Section>

    <Section title="Raw Arguments" defaultOpen={false}>
      <textarea value={config.raw_args_text || ""} placeholder="Additional CLI flags..." onChange={(e) => setConfig({ ...config, raw_args_text: e.target.value, raw_args: e.target.value ? e.target.value.split(/\s+/).filter(Boolean) : null })} className={inputCls} rows={3} />
      <p className={hintCls}>Space-separated. Appended as-is.</p>
    </Section>
  </div>
);