import React from "react";

export const GrypeConfigForm = ({ config, setConfig }: any) => (
  <div className="space-y-4">
    <div className="p-3 bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300 rounded text-sm mb-2">
      <strong>Note:</strong> Grype expects the Target to be a Docker Image name (e.g., <code>nginx:latest</code> or <code>my-app:1.0</code>).
    </div>

    <div>
      <label className="block mb-1 font-medium">Scan Scope</label>
      <select
        value={config.scope || "Squashed"}
        onChange={(e) => setConfig({ ...config, scope: e.target.value })}
        className="w-full p-2 rounded bg-slate-200 dark:bg-slate-800"
      >
        <option value="Squashed">Squashed (Final Layer only)</option>
        <option value="AllLayers">All Layers (Deep Scan)</option>
      </select>
    </div>
  </div>
);

