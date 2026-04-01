import React from "react";

const inputCls = "w-full p-2 rounded bg-slate-200 dark:bg-slate-800 text-sm";
const hintCls = "text-xs opacity-60 mt-1";
const checkRow = "flex items-center gap-2 text-sm";

export const WhoisConfigForm = ({ config, setConfig }: any) => (
  <div className="space-y-4">
    <label className={checkRow}>
      <input type="checkbox" checked={config.enabled !== false} onChange={(e) => setConfig({ ...config, enabled: e.target.checked })} />
      <span className="font-medium">Enable Whois Lookup</span>
    </label>
    <p className={hintCls}>
      Whois performs a passive lookup to identify domain ownership, registrar, and registration details.
    </p>
    <div>
      <label className="block mb-1 text-sm font-medium">Raw Arguments</label>
      <textarea value={config.raw_args_text || ""} placeholder="Additional whois flags..." onChange={(e) => setConfig({ ...config, raw_args_text: e.target.value, raw_args: e.target.value ? e.target.value.split(/\s+/).filter(Boolean) : null })} className={inputCls} rows={3} />
      <p className={hintCls}>Space-separated. Appended as-is.</p>
    </div>
  </div>
);
