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

export const DalfoxConfigForm = ({ config, setConfig }: any) => (
  <div className="space-y-3">
    <Section title="XSS Detection">
      <div>
        <label className={labelCls}>Blind XSS Callback URL</label>
        <input type="text" value={config.blind_url || ""} placeholder="https://your-blind-xss-server.com" onChange={(e) => setConfig({ ...config, blind_url: e.target.value || null })} className={inputCls} />
        <p className={hintCls}>Optional. Your callback URL for blind XSS detection.</p>
      </div>
      <label className={checkRow}><input type="checkbox" checked={!!config.waf_evasion} onChange={(e) => setConfig({ ...config, waf_evasion: e.target.checked })} />WAF Evasion — use payloads designed to bypass WAFs</label>
      <label className={checkRow}><input type="checkbox" checked={!!config.deep_domxss} onChange={(e) => setConfig({ ...config, deep_domxss: e.target.checked })} />Deep DOM XSS — intensive headless DOM testing</label>
      <div>
        <label className={labelCls}>Custom Payload File</label>
        <input type="text" value={config.custom_payload || ""} placeholder="Path to custom payloads" onChange={(e) => setConfig({ ...config, custom_payload: e.target.value || null })} className={inputCls} />
      </div>
    </Section>

    <Section title="Request" defaultOpen={false}>
      <div>
        <label className={labelCls}>HTTP Method</label>
        <select value={config.method || ""} onChange={(e) => setConfig({ ...config, method: e.target.value || null })} className={inputCls}>
          <option value="">Default (GET)</option>
          <option value="GET">GET</option>
          <option value="POST">POST</option>
          <option value="PUT">PUT</option>
        </select>
      </div>
      <div>
        <label className={labelCls}>POST Data (-d)</label>
        <input type="text" value={config.data || ""} placeholder="key=value&key2=value2" onChange={(e) => setConfig({ ...config, data: e.target.value || null })} className={inputCls} />
      </div>
      <div>
        <label className={labelCls}>Specific Parameters to Test (-p)</label>
        <input type="text" value={config.param || ""} placeholder="id,name,q" onChange={(e) => setConfig({ ...config, param: e.target.value || null })} className={inputCls} />
        <p className={hintCls}>Comma-separated. Only these params will be tested.</p>
      </div>
      <div>
        <label className={labelCls}>Custom Headers (-H)</label>
        <input type="text" value={config.headers || ""} placeholder="Authorization: Bearer xxx" onChange={(e) => setConfig({ ...config, headers: e.target.value || null })} className={inputCls} />
      </div>
      <div>
        <label className={labelCls}>Cookie (-C)</label>
        <input type="text" value={config.cookie || ""} placeholder="session=abc123" onChange={(e) => setConfig({ ...config, cookie: e.target.value || null })} className={inputCls} />
      </div>
    </Section>

    <Section title="Performance" defaultOpen={false}>
      <div className="grid grid-cols-3 gap-3">
        <div>
          <label className={labelCls}>Delay (ms)</label>
          <input type="number" value={config.delay || ""} placeholder="0" onChange={(e) => setConfig({ ...config, delay: e.target.value ? parseInt(e.target.value) : null })} className={inputCls} />
        </div>
        <div>
          <label className={labelCls}>Workers</label>
          <input type="number" value={config.worker || ""} placeholder="40" onChange={(e) => setConfig({ ...config, worker: e.target.value ? parseInt(e.target.value) : null })} className={inputCls} />
        </div>
        <div>
          <label className={labelCls}>Timeout (sec)</label>
          <input type="number" value={config.timeout || ""} placeholder="10" onChange={(e) => setConfig({ ...config, timeout: e.target.value ? parseInt(e.target.value) : null })} className={inputCls} />
        </div>
      </div>
    </Section>

    <Section title="Output" defaultOpen={false}>
      <label className={checkRow}><input type="checkbox" checked={!!config.only_poc} onChange={(e) => setConfig({ ...config, only_poc: e.target.checked })} />Only PoC — show only proof-of-concept code</label>
      <label className={checkRow}><input type="checkbox" checked={!!config.silence} onChange={(e) => setConfig({ ...config, silence: e.target.checked })} />Silence — print only PoC and progress</label>
    </Section>

    <Section title="Network" defaultOpen={false}>
      <div>
        <label className={labelCls}>Proxy</label>
        <input type="text" value={config.proxy || ""} placeholder="http://127.0.0.1:8080" onChange={(e) => setConfig({ ...config, proxy: e.target.value || null })} className={inputCls} />
      </div>
    </Section>

    <Section title="Raw Arguments" defaultOpen={false}>
      <textarea value={config.raw_args_text || ""} placeholder="Additional CLI flags..." onChange={(e) => setConfig({ ...config, raw_args_text: e.target.value, raw_args: e.target.value ? e.target.value.split(/\s+/).filter(Boolean) : null })} className={inputCls} rows={3} />
      <p className={hintCls}>Space-separated. Appended as-is.</p>
    </Section>
  </div>
);
