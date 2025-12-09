import React from "react";

export const DirsearchConfigForm = ({ config, setConfig }: any) => (
  <div className="space-y-4">
    <div>
      <label className="block mb-1 font-medium">Extensions</label>
      <input
        type="text"
        value={config.extensions || "php,html,js,txt"}
        placeholder="php,html,js,txt"
        onChange={(e) => setConfig({ ...config, extensions: e.target.value })}
        className="w-full p-2 rounded bg-slate-200 dark:bg-slate-800"
      />
      <p className="text-xs opacity-70 mt-1">Comma-separated list of extensions to force.</p>
    </div>
    
    <div>
      <label className="block mb-1 font-medium">Threads</label>
      <input
        type="number"
        value={config.threads || 50}
        onChange={(e) => setConfig({ ...config, threads: parseInt(e.target.value) })}
        className="w-full p-2 rounded bg-slate-200 dark:bg-slate-800"
      />
    </div>
  </div>
);
