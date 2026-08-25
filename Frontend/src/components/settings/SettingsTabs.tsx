import React from "react";

const tabs = [
  { key: "profile", label: "Profile" },
  { key: "preferences", label: "Preferences" },
  { key: "security", label: "Security" },
  { key: "connectors", label: "Connectors" },
];

const SettingsTabs = ({ active, setActive }: any) => {
  return (
    <div className="flex gap-4 border-b dark:border-slate-700 pb-2 mb-6">
      {tabs.map((t) => (
        <button
          key={t.key}
          onClick={() => setActive(t.key)}
          className={`
            pb-2 text-sm font-medium transition relative
            ${
              active === t.key
                ? "text-blue-600 dark:text-blue-400"
                : "text-slate-600 dark:text-slate-300 hover:text-blue-500"
            }
          `}
        >
          {t.label}

          {active === t.key && (
            <span className="absolute left-0 right-0 -bottom-[2px] h-[2px] bg-blue-600 dark:bg-blue-400 rounded-full"></span>
          )}
        </button>
      ))}
    </div>
  );
};

export default SettingsTabs;