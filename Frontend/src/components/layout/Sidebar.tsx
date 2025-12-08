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
  Activity 
} from "lucide-react";

// Import the logo
import logo from '../../assets/indian logo.png';

const menu = [
  { path: "/", label: "Dashboard", icon: Home },
  { path: "/scan-console", label: "Scan Console", icon: Scan },
  { path: "/vulnerabilities", label: "Vulnerabilities", icon: Bug },
  { path: "/assets", label: "Asset Inventory", icon: ClipboardCheck },
  { path: "/attack-path", label: "Attack Path", icon: Map },
  { path: "/threat-intel", label: "Threat Intelligence", icon: Globe },
  { path: "/reports", label: "Reports", icon: FileText },
  { path: "/remediation", label: "Remediation", icon: ClipboardCheck },
  { path: "/assistant", label: "Chat Assistant", icon: MessageCircle },
  { path: "/audit-logs", label: "Audit Logs", icon: Activity },
];

const Sidebar = () => {
  const [collapsed, setCollapsed] = useState(false);

  return (
    <div
      onMouseEnter={() => setCollapsed(false)}
      onMouseLeave={() => setCollapsed(true)}
      className={`bg-white dark:bg-slate-950 shadow-md h-screen transition-all duration-300 flex flex-col 
      ${collapsed ? "w-16" : "w-64"}`}
    >
      <div className="h-20 flex items-center justify-center py-6">
        <img 
          src={logo} 
          alt="CyberRakshak Logo" 
          className="w-14 h-14 object-contain"
        />
      </div>

      <nav className="flex-1 overflow-y-auto">
        {menu.map((item) => (
          <NavLink
            key={item.path}
            to={item.path}
            className={({ isActive }) =>
              `flex items-center gap-3 px-4 py-3 text-sm transition 
              ${isActive ? "bg-blue-100 dark:bg-slate-800 font-semibold" : "text-slate-600 dark:text-slate-300"}`
            }
          >
            <item.icon className="w-5 h-5" />
            {!collapsed && item.label}
          </NavLink>
        ))}
      </nav>
    </div>
  );
};

export default Sidebar;
