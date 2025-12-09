import React from "react";

export const WhatWebConfigForm = ({ config, setConfig }: any) => (
  <div className="space-y-4">
    <div>
      <label className="block mb-1 font-medium">Aggression Level</label>
      <select
        value={config.aggression || 1}
        onChange={(e) => setConfig({ ...config, aggression: parseInt(e.target.value) })}
        className="w-full p-2 rounded bg-slate-200 dark:bg-slate-800"
      >
        <option value={1}>1 - Stealthy (Default)</option>
        <option value={3}>3 - Aggressive</option>
        <option value={4}>4 - Heavy</option>
      </select>
      <p className="text-xs opacity-70 mt-1">
        Higher levels are faster but more likely to be detected.
      </p>
    </div>
  </div>
);
