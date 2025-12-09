import React from "react";

export const WfuzzConfigForm = ({ config, setConfig }: any) => (
  <div className="space-y-4">
    <div>
      <label className="block mb-1 font-medium">Wordlist</label>
      <select
        value={config.wordlist || "common.txt"}
        onChange={(e) => setConfig({ ...config, wordlist: e.target.value })}
        className="w-full p-2 rounded bg-slate-200 dark:bg-slate-800"
      >
        <option value="common.txt">common.txt (SecLists)</option>
        {/* Add more if you bake them into the Dockerfile */}
      </select>
    </div>

    <div>
      <label className="block mb-1 font-medium">Hide Codes (--hc)</label>
      <input
        type="text"
        value={config.hide_codes || "404"}
        placeholder="404,403"
        onChange={(e) => setConfig({ ...config, hide_codes: e.target.value })}
        className="w-full p-2 rounded bg-slate-200 dark:bg-slate-800"
      />
      <p className="text-xs opacity-70 mt-1">Comma-separated response codes to ignore.</p>
    </div>
  </div>
);
