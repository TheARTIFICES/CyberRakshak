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

export const DirsearchConfigForm = ({ config, setConfig }: any) => (
  <div className="space-y-3">
    <Section title="Dictionary">
      <div>
        <label className={labelCls}>Extensions</label>
        <input type="text" value={config.extensions || "php,html,js,txt"} onChange={(e) => setConfig({ ...config, extensions: e.target.value })} className={inputCls} />
        <p className={hintCls}>Comma-separated extensions to force.</p>
      </div>
      <div>
        <label className={labelCls}>Exclude Extensions</label>
        <input type="text" value={config.exclude_extensions || ""} placeholder="e.g. png,jpg,gif" onChange={(e) => setConfig({ ...config, exclude_extensions: e.target.value || null })} className={inputCls} />
      </div>
      <label className={checkRow}><input type="checkbox" checked={!!config.force_extensions} onChange={(e) => setConfig({ ...config, force_extensions: e.target.checked })} />Force Extensions — append to every wordlist entry</label>
      <div>
        <label className={labelCls}>Custom Wordlist</label>
        <input type="text" value={config.wordlist || ""} placeholder="Path to custom wordlist" onChange={(e) => setConfig({ ...config, wordlist: e.target.value || null })} className={inputCls} />
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className={labelCls}>Prefixes</label>
          <input type="text" value={config.prefixes || ""} placeholder="e.g. admin,test" onChange={(e) => setConfig({ ...config, prefixes: e.target.value || null })} className={inputCls} />
        </div>
        <div>
          <label className={labelCls}>Suffixes</label>
          <input type="text" value={config.suffixes || ""} placeholder="e.g. .bak,.old" onChange={(e) => setConfig({ ...config, suffixes: e.target.value || null })} className={inputCls} />
        </div>
      </div>
    </Section>

    <Section title="Performance">
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className={labelCls}>Threads</label>
          <input type="number" value={config.threads || 50} onChange={(e) => setConfig({ ...config, threads: parseInt(e.target.value) })} className={inputCls} />
        </div>
        <div>
          <label className={labelCls}>Timeout (sec)</label>
          <input type="number" value={config.timeout || ""} placeholder="Default" onChange={(e) => setConfig({ ...config, timeout: e.target.value ? parseInt(e.target.value) : null })} className={inputCls} />
        </div>
      </div>
    </Section>

    <Section title="Recursion" defaultOpen={false}>
      <label className={checkRow}><input type="checkbox" checked={!!config.recursive} onChange={(e) => setConfig({ ...config, recursive: e.target.checked })} />Enable Recursive Scanning</label>
      <div>
        <label className={labelCls}>Recursion Depth</label>
        <input type="number" value={config.recursion_depth || ""} placeholder="No limit" onChange={(e) => setConfig({ ...config, recursion_depth: e.target.value ? parseInt(e.target.value) : null })} className={inputCls} />
      </div>
    </Section>

    <Section title="Filtering" defaultOpen={false}>
      <div>
        <label className={labelCls}>Exclude Status Codes</label>
        <input type="text" value={config.exclude_status || ""} placeholder="403,404,500" onChange={(e) => setConfig({ ...config, exclude_status: e.target.value || null })} className={inputCls} />
      </div>
      <div>
        <label className={labelCls}>Include Status Codes Only</label>
        <input type="text" value={config.include_status || ""} placeholder="200,301,302" onChange={(e) => setConfig({ ...config, include_status: e.target.value || null })} className={inputCls} />
      </div>
    </Section>

    <Section title="Request" defaultOpen={false}>
      <label className={checkRow}><input type="checkbox" checked={!!config.follow_redirects} onChange={(e) => setConfig({ ...config, follow_redirects: e.target.checked })} />Follow HTTP Redirects</label>
      <label className={checkRow}><input type="checkbox" checked={!!config.random_agent} onChange={(e) => setConfig({ ...config, random_agent: e.target.checked })} />Random User Agent</label>
      <div>
        <label className={labelCls}>Custom Headers</label>
        <input type="text" value={config.headers || ""} placeholder="X-Custom: value" onChange={(e) => setConfig({ ...config, headers: e.target.value || null })} className={inputCls} />
      </div>
      <div>
        <label className={labelCls}>User Agent</label>
        <input type="text" value={config.user_agent || ""} placeholder="Custom UA string" onChange={(e) => setConfig({ ...config, user_agent: e.target.value || null })} className={inputCls} />
      </div>
      <div>
        <label className={labelCls}>Cookie</label>
        <input type="text" value={config.cookie || ""} placeholder="session=abc123" onChange={(e) => setConfig({ ...config, cookie: e.target.value || null })} className={inputCls} />
      </div>
    </Section>

    <Section title="Raw Arguments" defaultOpen={false}>
      <textarea value={config.raw_args_text || ""} placeholder="Additional CLI flags..." onChange={(e) => setConfig({ ...config, raw_args_text: e.target.value, raw_args: e.target.value ? e.target.value.split(/\s+/).filter(Boolean) : null })} className={inputCls} rows={3} />
      <p className={hintCls}>Space-separated. Appended as-is.</p>
    </Section>
  </div>
);
