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

const MODULE_PRESETS: Record<string, string[]> = {
  http: ["auxiliary/scanner/http/http_version", "auxiliary/scanner/http/http_header", "auxiliary/scanner/http/dir_scanner", "auxiliary/scanner/http/robots_txt"],
  ssh: ["auxiliary/scanner/ssh/ssh_version", "auxiliary/scanner/ssh/ssh_login"],
  smb: ["auxiliary/scanner/smb/smb_version", "auxiliary/scanner/smb/smb_enumshares"],
  ftp: ["auxiliary/scanner/ftp/ftp_version", "auxiliary/scanner/ftp/anonymous"],
  database: ["auxiliary/scanner/mysql/mysql_version", "auxiliary/scanner/postgres/postgres_version"],
  full: [
    "auxiliary/scanner/http/http_version", "auxiliary/scanner/http/http_header", "auxiliary/scanner/http/dir_scanner", "auxiliary/scanner/http/robots_txt",
    "auxiliary/scanner/ssh/ssh_version", "auxiliary/scanner/ssh/ssh_login",
    "auxiliary/scanner/smb/smb_version", "auxiliary/scanner/smb/smb_enumshares",
    "auxiliary/scanner/ftp/ftp_version", "auxiliary/scanner/ftp/anonymous",
    "auxiliary/scanner/mysql/mysql_version", "auxiliary/scanner/postgres/postgres_version",
  ],
};

export const MetasploitConfigForm = ({ config, setConfig }: any) => {
  const modules = Array.isArray(config.modules) ? config.modules : [];

  const applyPreset = (presetName: string) => {
    const mods = MODULE_PRESETS[presetName];
    if (mods) {
      setConfig({ ...config, modules: mods, preset: presetName });
    }
  };

  return (
    <div className="space-y-3">
      <Section title="Module Presets">
        <div className="grid grid-cols-3 gap-2">
          {Object.keys(MODULE_PRESETS).map(name => (
            <button key={name} type="button" onClick={() => applyPreset(name)}
              className={`px-3 py-1.5 rounded text-xs font-medium border transition ${config.preset === name ? "bg-blue-600 text-white border-blue-600" : "bg-slate-100 dark:bg-slate-800 border-slate-300 dark:border-slate-600 hover:bg-slate-200 dark:hover:bg-slate-700"}`}>
              {name.charAt(0).toUpperCase() + name.slice(1)}
            </button>
          ))}
        </div>
      </Section>

      <Section title="Modules">
        <div>
          <label className={labelCls}>Module Paths</label>
          <textarea value={modules.join("\n")} placeholder="auxiliary/scanner/http/http_version&#10;auxiliary/scanner/ssh/ssh_version"
            onChange={(e) => setConfig({ ...config, modules: e.target.value.split("\n").map((m: string) => m.trim()).filter(Boolean), preset: "custom" })}
            className={inputCls} rows={5} />
          <p className={hintCls}>One module per line. Each is executed sequentially against the target.</p>
        </div>
      </Section>

      <Section title="Settings" defaultOpen={false}>
        <div>
          <label className={labelCls}>Threads per Module</label>
          <input type="number" value={config.threads || ""} placeholder="1" onChange={(e) => setConfig({ ...config, threads: e.target.value ? parseInt(e.target.value) : null })} className={inputCls} />
        </div>
        <label className={checkRow}><input type="checkbox" checked={!!config.verbose} onChange={(e) => setConfig({ ...config, verbose: e.target.checked })} />Verbose Output</label>
      </Section>

      <Section title="Raw Arguments" defaultOpen={false}>
        <textarea value={config.raw_args_text || ""} placeholder="Additional msfconsole flags..." onChange={(e) => setConfig({ ...config, raw_args_text: e.target.value, raw_args: e.target.value ? e.target.value.split(/\s+/).filter(Boolean) : null })} className={inputCls} rows={3} />
        <p className={hintCls}>Space-separated. Appended as-is.</p>
      </Section>
    </div>
  );
};
