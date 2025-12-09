import React from "react";

export const DalfoxConfigForm = ({ config, setConfig }: any) => (
  <div className="space-y-4">
    <div>
      <label className="block mb-1 font-medium">Blind XSS Server URL</label>
      <input
        type="text"
        value={config.blind_url || ""}
        placeholder="e.g. https://your-blind-xss-server.com"
        onChange={(e) => setConfig({ ...config, blind_url: e.target.value })}
        className="w-full p-2 rounded bg-slate-200 dark:bg-slate-800"
      />
      <p className="text-xs opacity-70 mt-1">Optional. Your callback URL for blind XSS detection.</p>
    </div>
  </div>
);
