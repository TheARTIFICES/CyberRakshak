import React, { useState } from "react";

const Section = ({ title, children, defaultOpen = true }: { title: string; children: React.ReactNode; defaultOpen?: boolean }) => {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div className="border border-slate-200 dark:border-slate-700 rounded-lg overflow-hidden">
      <button type="button" onClick={() => setOpen(!open)} className="w-full flex items-center justify-between px-3 py-2 bg-slate-100 dark:bg-slate-800/60 text-sm font-semibold text-left">
        {title}
        <span className="text-xs opacity-60">{open ? "▾" : "▸"}</span>
      </button>
      {open && <div className="p-3 space-y-3">{children}</div>}
    </div>
  );
};

const inputCls = "w-full p-2 rounded bg-slate-200 dark:bg-slate-800 text-sm";
const labelCls = "block mb-1 text-sm font-medium";
const hintCls = "text-xs opacity-60 mt-1";
const checkRow = "flex items-center gap-2 text-sm";

export const NmapConfigForm = ({ config, setConfig }: any) => (
  <div className="space-y-3">
    <Section title="Basic">
      <div>
        <label className={labelCls}>Scan Type</label>
        <select value={config.scan_type || ""} onChange={(e) => setConfig({ ...config, scan_type: e.target.value || null })} className={inputCls}>
          <option value="">Default (SYN)</option>
          <option value="sS">SYN Scan (-sS)</option>
          <option value="sT">TCP Connect (-sT)</option>
          <option value="sU">UDP Scan (-sU)</option>
          <option value="sN">Null Scan (-sN)</option>
          <option value="sF">FIN Scan (-sF)</option>
          <option value="sX">Xmas Scan (-sX)</option>
          <option value="sA">ACK Scan (-sA)</option>
        </select>
      </div>
      <div>
        <label className={labelCls}>Ports</label>
        <input type="text" value={config.ports || ""} placeholder="22,80,443 or 1-1024 or top-100" onChange={(e) => setConfig({ ...config, ports: e.target.value })} className={inputCls} />
        <p className={hintCls}>Use "top-N" for top ports, ranges like "1-1024", or comma-separated.</p>
      </div>
      <div>
        <label className={labelCls}>Timing Template</label>
        <select value={config.speed || "T4"} onChange={(e) => setConfig({ ...config, speed: e.target.value })} className={inputCls}>
          {["T0","T1","T2","T3","T4","T5"].map((s) => (
            <option key={s} value={s}>{s} {s === "T0" ? "(Paranoid)" : s === "T1" ? "(Sneaky)" : s === "T2" ? "(Polite)" : s === "T3" ? "(Normal)" : s === "T4" ? "(Aggressive)" : "(Insane)"}</option>
          ))}
        </select>
      </div>
    </Section>

    <Section title="Detection">
      <label className={checkRow}>
        <input type="checkbox" checked={config.service_detection !== false} onChange={(e) => setConfig({ ...config, service_detection: e.target.checked })} />
        Service/Version Detection (-sV)
      </label>
      <label className={checkRow}>
        <input type="checkbox" checked={!!config.os_detection} onChange={(e) => setConfig({ ...config, os_detection: e.target.checked })} />
        OS Detection (-O)
      </label>
      <label className={checkRow}>
        <input type="checkbox" checked={!!config.aggressive} onChange={(e) => setConfig({ ...config, aggressive: e.target.checked })} />
        Aggressive Scan (-A) — OS + version + scripts + traceroute
      </label>
    </Section>

    <Section title="Host Discovery" defaultOpen={false}>
      <label className={checkRow}>
        <input type="checkbox" checked={!!config.skip_discovery} onChange={(e) => setConfig({ ...config, skip_discovery: e.target.checked })} />
        Skip Host Discovery (-Pn) — treat all hosts as online
      </label>
      <label className={checkRow}>
        <input type="checkbox" checked={!!config.ping_only} onChange={(e) => setConfig({ ...config, ping_only: e.target.checked })} />
        Ping Scan Only (-sn) — disable port scan
      </label>
    </Section>

    <Section title="Scripts">
      <div>
        <label className={labelCls}>NSE Script Categories</label>
        <input type="text" value={config.script || ""} placeholder="vuln, default, safe, discovery..." onChange={(e) => setConfig({ ...config, script: e.target.value })} className={inputCls} />
      </div>
      <div>
        <label className={labelCls}>Script Arguments</label>
        <input type="text" value={config.script_args || ""} placeholder="key=value,key2=value2" onChange={(e) => setConfig({ ...config, script_args: e.target.value })} className={inputCls} />
      </div>
    </Section>

    <Section title="Performance" defaultOpen={false}>
      <div>
        <label className={labelCls}>Max Rate (packets/sec)</label>
        <input type="number" value={config.max_rate || ""} placeholder="e.g. 1000" onChange={(e) => setConfig({ ...config, max_rate: e.target.value ? parseInt(e.target.value) : null })} className={inputCls} />
      </div>
      <div>
        <label className={labelCls}>Min Rate (packets/sec)</label>
        <input type="number" value={config.min_rate || ""} placeholder="e.g. 100" onChange={(e) => setConfig({ ...config, min_rate: e.target.value ? parseInt(e.target.value) : null })} className={inputCls} />
      </div>
    </Section>

    <Section title="Evasion" defaultOpen={false}>
      <label className={checkRow}>
        <input type="checkbox" checked={!!config.fragment} onChange={(e) => setConfig({ ...config, fragment: e.target.checked })} />
        Fragment Packets (-f)
      </label>
      <div>
        <label className={labelCls}>Decoys (-D)</label>
        <input type="text" value={config.decoys || ""} placeholder="decoy1,decoy2,ME" onChange={(e) => setConfig({ ...config, decoys: e.target.value })} className={inputCls} />
        <p className={hintCls}>Comma-separated decoy IPs. Use ME for your real IP position.</p>
      </div>
    </Section>

    <Section title="Output" defaultOpen={false}>
      <div>
        <label className={labelCls}>Verbosity</label>
        <select value={config.verbosity || ""} onChange={(e) => setConfig({ ...config, verbosity: e.target.value || null })} className={inputCls}>
          <option value="">Normal</option>
          <option value="v">Verbose (-v)</option>
          <option value="vv">Very Verbose (-vv)</option>
        </select>
      </div>
    </Section>

    <Section title="Raw Arguments" defaultOpen={false}>
      <div>
        <label className={labelCls}>Additional CLI Flags</label>
        <textarea value={config.raw_args_text || ""} placeholder="--min-parallelism 10 --scan-delay 500ms" onChange={(e) => setConfig({ ...config, raw_args_text: e.target.value, raw_args: e.target.value ? e.target.value.split(/\s+/).filter(Boolean) : null })} className={inputCls} rows={3} />
        <p className={hintCls}>Space-separated. Appended to the command as-is.</p>
      </div>
    </Section>
  </div>
);