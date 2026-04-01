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

export const WfuzzConfigForm = ({ config, setConfig }: any) => (
  <div className="space-y-3">
    <Section title="Payload">
      <div>
        <label className={labelCls}>Wordlist</label>
        <select value={config.wordlist || "common.txt"} onChange={(e) => setConfig({ ...config, wordlist: e.target.value })} className={inputCls}>
          <option value="common.txt">common.txt (SecLists)</option>
          <option value="big.txt">big.txt</option>
          <option value="raft-medium-directories.txt">raft-medium-directories.txt</option>
        </select>
      </div>
    </Section>

    <Section title="Hide Filters">
      <p className={hintCls}>Hide responses matching these criteria. All filters can be combined.</p>
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className={labelCls}>Hide Codes (--hc)</label>
          <input type="text" value={config.hide_codes || "404"} onChange={(e) => setConfig({ ...config, hide_codes: e.target.value })} className={inputCls} />
        </div>
        <div>
          <label className={labelCls}>Hide Lines (--hl)</label>
          <input type="text" value={config.hide_lines || ""} placeholder="e.g. 0" onChange={(e) => setConfig({ ...config, hide_lines: e.target.value || null })} className={inputCls} />
        </div>
        <div>
          <label className={labelCls}>Hide Words (--hw)</label>
          <input type="text" value={config.hide_words || ""} placeholder="e.g. 12" onChange={(e) => setConfig({ ...config, hide_words: e.target.value || null })} className={inputCls} />
        </div>
        <div>
          <label className={labelCls}>Hide Chars (--hh)</label>
          <input type="text" value={config.hide_chars || ""} placeholder="e.g. 0" onChange={(e) => setConfig({ ...config, hide_chars: e.target.value || null })} className={inputCls} />
        </div>
      </div>
      <div>
        <label className={labelCls}>Hide Regex (--hs)</label>
        <input type="text" value={config.hide_regex || ""} placeholder="Regex to match in response body" onChange={(e) => setConfig({ ...config, hide_regex: e.target.value || null })} className={inputCls} />
      </div>
    </Section>

    <Section title="Show Filters" defaultOpen={false}>
      <p className={hintCls}>Show only responses matching these criteria.</p>
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className={labelCls}>Show Codes (--sc)</label>
          <input type="text" value={config.show_codes || ""} placeholder="200,301" onChange={(e) => setConfig({ ...config, show_codes: e.target.value || null })} className={inputCls} />
        </div>
        <div>
          <label className={labelCls}>Show Lines (--sl)</label>
          <input type="text" value={config.show_lines || ""} placeholder="e.g. 10" onChange={(e) => setConfig({ ...config, show_lines: e.target.value || null })} className={inputCls} />
        </div>
        <div>
          <label className={labelCls}>Show Words (--sw)</label>
          <input type="text" value={config.show_words || ""} placeholder="..." onChange={(e) => setConfig({ ...config, show_words: e.target.value || null })} className={inputCls} />
        </div>
        <div>
          <label className={labelCls}>Show Chars (--sh)</label>
          <input type="text" value={config.show_chars || ""} placeholder="..." onChange={(e) => setConfig({ ...config, show_chars: e.target.value || null })} className={inputCls} />
        </div>
      </div>
      <div>
        <label className={labelCls}>Show Regex (--ss)</label>
        <input type="text" value={config.show_regex || ""} placeholder="Regex to match" onChange={(e) => setConfig({ ...config, show_regex: e.target.value || null })} className={inputCls} />
      </div>
    </Section>

    <Section title="Advanced Filter" defaultOpen={false}>
      <div>
        <label className={labelCls}>Filter Expression (--filter)</label>
        <input type="text" value={config.filter_expr || ""} placeholder='c=200 and w>100' onChange={(e) => setConfig({ ...config, filter_expr: e.target.value || null })} className={inputCls} />
        <p className={hintCls}>Logical expression using c (code), l (lines), w (words), h (chars).</p>
      </div>
    </Section>

    <Section title="Performance" defaultOpen={false}>
      <div>
        <label className={labelCls}>Threads</label>
        <input type="number" value={config.threads || ""} placeholder="10" onChange={(e) => setConfig({ ...config, threads: e.target.value ? parseInt(e.target.value) : null })} className={inputCls} />
      </div>
    </Section>

    <Section title="Request" defaultOpen={false}>
      <label className={checkRow}><input type="checkbox" checked={!!config.follow_redirects} onChange={(e) => setConfig({ ...config, follow_redirects: e.target.checked })} />Follow HTTP Redirects (-L)</label>
      <label className={checkRow}><input type="checkbox" checked={!!config.verbose} onChange={(e) => setConfig({ ...config, verbose: e.target.checked })} />Verbose Output</label>
      <div>
        <label className={labelCls}>Custom Headers (-H)</label>
        <input type="text" value={config.headers || ""} placeholder="X-Custom: value" onChange={(e) => setConfig({ ...config, headers: e.target.value || null })} className={inputCls} />
      </div>
      <div>
        <label className={labelCls}>POST Data (-d)</label>
        <input type="text" value={config.post_data || ""} placeholder="id=FUZZ&action=test" onChange={(e) => setConfig({ ...config, post_data: e.target.value || null })} className={inputCls} />
        <p className={hintCls}>Use FUZZ keyword for substitution points.</p>
      </div>
      <div>
        <label className={labelCls}>Proxy (-p)</label>
        <input type="text" value={config.proxy || ""} placeholder="ip:port:type" onChange={(e) => setConfig({ ...config, proxy: e.target.value || null })} className={inputCls} />
      </div>
    </Section>

    <Section title="Raw Arguments" defaultOpen={false}>
      <textarea value={config.raw_args_text || ""} placeholder="Additional CLI flags..." onChange={(e) => setConfig({ ...config, raw_args_text: e.target.value, raw_args: e.target.value ? e.target.value.split(/\s+/).filter(Boolean) : null })} className={inputCls} rows={3} />
      <p className={hintCls}>Space-separated. Appended as-is.</p>
    </Section>
  </div>
);
