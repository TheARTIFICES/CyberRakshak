const tabs = [
  { key: "organization", label: "Organization" },
  { key: "users", label: "Users & Roles" },
  { key: "profile", label: "Profile" },
  { key: "preferences", label: "Preferences" },
  { key: "security", label: "Security" },
];

interface Props {
  active: string;
  setActive: (key: string) => void;
}

const SettingsTabs = ({ active, setActive }: Props) => {
  return (
    <div className="flex gap-4 border-b dark:border-slate-700 pb-2 mb-6 overflow-x-auto">
      {tabs.map((t) => (
        <button
          key={t.key}
          onClick={() => setActive(t.key)}
          className={`
            pb-2 text-sm font-medium transition relative whitespace-nowrap
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
