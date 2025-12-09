import React from "react";

export const WhoisConfigForm = ({ config, setConfig }: any) => (
  <div className="space-y-4">
    <div className="flex items-center gap-2">
      <input
        type="checkbox"
        checked={config.enabled !== false}
        onChange={(e) => setConfig({ ...config, enabled: e.target.checked })}
      />
      <label className="font-medium">Enable Whois Lookup</label>
    </div>
    <p className="text-xs opacity-70">
      Whois performs a passive lookup to identify domain ownership and registration details.
    </p>
  </div>
);
