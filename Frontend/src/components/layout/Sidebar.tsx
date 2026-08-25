import { NavLink } from "react-router-dom";
import { useState } from "react";
import {
  Home,
  Scan,
  Bug,
  Map,
  Globe,
  FileText,
  ClipboardCheck,
  MessageCircle,
  Activity,
  Zap,
  ExternalLink,
  Building2,
  Sliders,
  Scale,
  Wallet,
  Settings as SettingsIcon,
  Plug,
  type LucideIcon,
} from "lucide-react";

// Import the logo
import logo from "../../assets/indian logo.png";

interface NavItem {
  path: string;
  label: string;
  icon: LucideIcon;
}

interface NavGroup {
  label: string;
  items: NavItem[];
}

/**
 * Grouped by audience/workflow rather than a flat alphabetical-ish list, so the
 * executive surfaces (Overview), the quantification surfaces (Risk & Simulation)
 * and the analyst surfaces (Security Operations) read as distinct product areas.
 */
const NAV_GROUPS: NavGroup[] = [
  {
    label: "Overview",
    items: [
      { path: "/dashboard", label: "Dashboard", icon: Home },
      { path: "/board-portal", label: "Board Governance", icon: Building2 },
    ],
  },
  {
    label: "Risk & Simulation",
    items: [
      { path: "/scenario-simulator", label: "Scenario Simulator", icon: Sliders },
      { path: "/attack-path", label: "Attack Path", icon: Map },
      { path: "/investment-actions", label: "Investment Action Board", icon: Wallet },
    ],
  },
  {
    label: "Security Operations",
    items: [
      { path: "/scan-console", label: "Scan Console", icon: Scan },
      { path: "/vulnerabilities", label: "Vulnerabilities", icon: Bug },
      { path: "/assets", label: "Asset Inventory", icon: ClipboardCheck },
      { path: "/threat-intel", label: "Threat Intelligence", icon: Globe },
      { path: "/remediation", label: "Remediation", icon: Zap },
    ],
  },
  {
    label: "Governance",
    items: [
      { path: "/compliance-center", label: "Compliance & Audit", icon: Scale },
      { path: "/reports", label: "Reports", icon: FileText },
      { path: "/audit-logs", label: "Audit Logs", icon: Activity },
    ],
  },
  {
    label: "AI & System",
    items: [
      { path: "/assistant", label: "Chat Assistant", icon: MessageCircle },
      { path: "/connectors", label: "Connectors", icon: Plug },
      { path: "/settings", label: "Settings", icon: SettingsIcon },
    ],
  },
];

const Sidebar = () => {
  const [collapsed, setCollapsed] = useState(false);

  return (
    <div
      onMouseEnter={() => setCollapsed(false)}
      onMouseLeave={() => setCollapsed(true)}
      className={`bg-white dark:bg-slate-950 shadow-md h-screen sticky top-0 z-50 transition-all duration-300 flex flex-col
      ${collapsed ? "w-16" : "w-64"}`}
    >
      {/* The logo scales with the rail. At a fixed size it sat well inside the
          64px collapsed rail but read as undersized against the 256px expanded
          panel, so both the header height and the mark grow together. */}
      <div
        className={`flex items-center justify-center flex-shrink-0 transition-all duration-300 ${
          collapsed ? "h-20" : "h-28"
        }`}
      >
        <img
          src={logo}
          alt="CyberRakshak Logo"
          className={`object-contain transition-all duration-300 ${
            collapsed ? "w-12 h-12" : "w-20 h-20"
          }`}
        />
      </div>

      <nav className="flex-1 overflow-y-auto pb-2">
        {NAV_GROUPS.map((group, groupIndex) => (
          <div
            key={group.label}
            className={
              groupIndex > 0
                ? "mt-3 pt-3 border-t border-slate-200/70 dark:border-slate-800/70"
                : undefined
            }
          >
            {/* Section label — presentational only, never focusable/clickable. */}
            {collapsed ? (
              <div className="h-3" aria-hidden="true" />
            ) : (
              <p className="px-4 pb-1 text-[10px] font-semibold uppercase tracking-wider text-slate-400 dark:text-slate-500 select-none">
                {group.label}
              </p>
            )}

            {group.items.map((item) => (
              <NavLink
                key={item.path}
                to={item.path}
                title={collapsed ? item.label : undefined}
                className={({ isActive }) =>
                  `flex items-center gap-3 px-4 py-2.5 text-sm transition
                  ${
                    isActive
                      ? "bg-blue-100 dark:bg-slate-800 font-semibold text-blue-600 dark:text-cyan-400"
                      : "text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-900"
                  }`
                }
              >
                <item.icon className="w-5 h-5 flex-shrink-0" />
                {!collapsed && <span className="truncate">{item.label}</span>}
              </NavLink>
            ))}
          </div>
        ))}
      </nav>

      {/* Website Link — stays pinned below every group */}
      <div className="p-3 border-t border-slate-200 dark:border-slate-800 flex-shrink-0">
        <NavLink
          to="/"
          className="flex items-center gap-3 px-3 py-2 text-xs font-medium text-slate-500 dark:text-slate-400 hover:text-cyan-500 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-900 transition"
        >
          <ExternalLink className="w-4 h-4 flex-shrink-0" />
          {!collapsed && <span>Public Website</span>}
        </NavLink>
      </div>
    </div>
  );
};

export default Sidebar;
