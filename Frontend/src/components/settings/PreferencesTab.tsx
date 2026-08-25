import React, { useState } from "react";
import { Moon, Sun } from "lucide-react";
import useTheme from "../../hooks/useTheme";

interface NotificationSettings {
  scan: boolean;
  critical: boolean;
  report: boolean;
  threatIntel: boolean;
}

interface NotificationItem {
  key: keyof NotificationSettings;
  label: string;
}

const PreferencesTab = () => {
  const { isDark, setTheme } = useTheme();
  const [notifications, setNotifications] = useState<NotificationSettings>({
    scan: true,
    critical: true,
    report: false,
    threatIntel: true,
  });

  const [defaultScan, setDefaultScan] = useState("Quick Scan");

  return (
    <div className="space-y-10 animate-fade-up">

      {/* THEME — canonical home for the theme control, relocated out of the Topbar */}
      <div>
        <h2 className="text-lg font-semibold mb-1">Appearance</h2>
        <p className="text-xs text-slate-500 mb-4">Your choice is remembered on this device.</p>

        <div className="flex gap-4">
          <button
            onClick={() => setTheme(false)}
            aria-pressed={!isDark}
            className={`px-4 py-2 rounded-lg border inline-flex items-center gap-2 text-sm transition ${
              !isDark
                ? "bg-blue-600 border-blue-600 text-white"
                : "bg-slate-200 dark:bg-slate-700 border-transparent"
            }`}
          >
            <Sun className="w-4 h-4" />
            Light Mode
          </button>

          <button
            onClick={() => setTheme(true)}
            aria-pressed={isDark}
            className={`px-4 py-2 rounded-lg border inline-flex items-center gap-2 text-sm transition ${
              isDark
                ? "bg-blue-600 border-blue-600 text-white"
                : "bg-slate-200 dark:bg-slate-700 border-transparent"
            }`}
          >
            <Moon className="w-4 h-4" />
            Dark Mode
          </button>
        </div>
      </div>


      {/* NOTIFICATIONS */}
      <div>
        <h2 className="text-lg font-semibold mb-4">Notifications</h2>

        <div className="space-y-4">

          {(Object.keys(notifications) as (keyof NotificationSettings)[]).map((key) => (
            <label key={key} className="flex items-center justify-between bg-slate-100 dark:bg-slate-700 p-3 rounded-lg">
              <span>
                {key === "scan" && "Notify when a scan completes"}
                {key === "critical" && "Alert for critical vulnerabilities"}
                {key === "report" && "Notify when a report is generated"}
                {key === "threatIntel" && "Threat intelligence update alerts"}
              </span>

              <input
                type="checkbox"
                checked={notifications[key]}
                onChange={(e) =>
                  setNotifications({ ...notifications, [key]: e.target.checked })
                }
              />
            </label>
          ))}

        </div>
      </div>


      {/* DEFAULT SCAN MODE */}
      <div>
        <h2 className="text-lg font-semibold mb-4">Default Scan Mode</h2>

        <select
          value={defaultScan}
          onChange={(e) => setDefaultScan(e.target.value)}
          className="p-2 rounded-lg bg-slate-100 dark:bg-slate-700 border border-slate-300 dark:border-slate-600"
        >
          <option>Quick Scan</option>
          <option>Full Scan</option>
          <option>Custom</option>
        </select>
      </div>


      {/* SAVE BUTTON */}
      <div>
        <button className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition">
          Save Preferences
        </button>
      </div>

    </div>
  );
};

export default PreferencesTab;