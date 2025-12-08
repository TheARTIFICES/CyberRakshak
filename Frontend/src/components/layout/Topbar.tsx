import React, { useState, useEffect, useRef } from "react";
import { Bell, Sun, Moon, User, LogOut, Settings } from "lucide-react";
import { useLocation, useNavigate } from "react-router-dom";
import { getNotifications, markNotificationRead } from "../../services/api";
import type { Notification } from "../../services/api";

const Topbar = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const [darkMode, setDarkMode] = useState(false);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [showNotifications, setShowNotifications] = useState(false);
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  
  // Refs for click outside handling
  const profileRef = useRef<HTMLDivElement>(null);
  const notifRef = useRef<HTMLDivElement>(null);

  // Route mapping for dynamic titles
  const routeMapping: Record<string, { title: string; subtitle: string }> = {
    "/": { title: "Command Center", subtitle: "Overview of security posture & active threats." },
    "/scan-console": { title: "Scan Console", subtitle: "Initiate and manage vulnerability scans." },
    "/assets": { title: "Asset Inventory", subtitle: "View and manage all discovered assets." },
    "/vulnerabilities": { title: "Vulnerabilities", subtitle: "Explore and analyze detected risks." },
    "/attack-path": { title: "Attack Path Analysis", subtitle: "Visualize exploit chains and high-risk routes." },
    "/threat-intel": { title: "Threat Intelligence", subtitle: "Real-time feed of global vulnerabilities." },
    "/reports": { title: "Reports", subtitle: "Centralized repository for audits and summaries." },
    "/remediation": { title: "Remediation Operations", subtitle: "Automated defense console." },
    "/audit-logs": { title: "Audit Logs", subtitle: "System activity and user actions." },
    "/settings": { title: "Settings", subtitle: "Platform configuration and preferences." },
    "/profile": { title: "User Profile", subtitle: "Manage your account details and preferences." }
  };

  const currentRouteInfo = routeMapping[location.pathname] || { 
    title: "Dashboard", 
    subtitle: "Security overview and analytics" 
  };

  const toggleTheme = () => {
    setDarkMode(!darkMode);
    document.documentElement.classList.toggle("dark");
  };

  // Close dropdowns when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (profileRef.current && !profileRef.current.contains(event.target as Node)) {
        setShowProfileMenu(false);
      }
      if (notifRef.current && !notifRef.current.contains(event.target as Node)) {
        setShowNotifications(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Poll for notifications
  const fetchNotifications = async () => {
    try {
      const data = await getNotifications();
      // Ensure we don't overwrite read status if a sync happens while menu is open,
      // though typically the API should return the correct read status.
      setNotifications(data);
    } catch (error) {
      console.error("Failed to fetch notifications", error);
    }
  };

  useEffect(() => {
    fetchNotifications();
    const interval = setInterval(fetchNotifications, 10000); 
    return () => clearInterval(interval);
  }, []);

  const unreadCount = notifications.filter((n) => !n.is_read).length;

  const handleNotificationClick = async (id: string) => {
    // 1. Optimistically update local state immediately
    setNotifications(prev => prev.map(n => 
      n.id === id ? { ...n, is_read: true } : n
    ));

    // 2. Call API to persist change
    try {
      await markNotificationRead(id);
    } catch (error) {
      console.error("Failed to mark notification read", error);
      // Optional: Revert state if API fails, though usually overkill for read status
    }
  };

  const handleLogout = () => {
    localStorage.removeItem("token");
    navigate("/login"); 
  };

  return (
    <header className="h-16 bg-white dark:bg-slate-950 border-b dark:border-slate-800 flex items-center justify-between px-6 sticky top-0 z-40">
      {/* Left: Title */}
      <div>
        <h1 className="text-lg font-semibold text-slate-900 dark:text-white">
          {currentRouteInfo.title}
        </h1>
        <p className="text-xs text-slate-500 dark:text-slate-400 hidden md:block">
          {currentRouteInfo.subtitle}
        </p>
      </div>

      {/* Right: Actions */}
      <div className="flex items-center gap-4">
        
        {/* Theme Toggle */}
        <button
          onClick={toggleTheme}
          className="p-2 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 transition text-slate-600 dark:text-slate-300"
        >
          {darkMode ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
        </button>

        {/* Notifications Dropdown */}
        <div className="relative" ref={notifRef}>
          <button 
            className={`p-2 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 transition text-slate-600 dark:text-slate-300 relative ${showNotifications ? 'bg-slate-100 dark:bg-slate-800' : ''}`}
            onClick={() => setShowNotifications(!showNotifications)}
          >
            <Bell className="w-5 h-5" />
            {unreadCount > 0 && (
              <span className="absolute top-1 right-1 w-2.5 h-2.5 bg-red-500 rounded-full border-2 border-white dark:border-slate-950"></span>
            )}
          </button>

          {showNotifications && (
            <div className="absolute right-0 mt-2 w-80 bg-white dark:bg-slate-900 rounded-xl shadow-xl border border-slate-200 dark:border-slate-700 overflow-hidden z-50">
              <div className="p-3 border-b dark:border-slate-700 font-semibold text-sm flex justify-between items-center bg-slate-50 dark:bg-slate-800/50">
                <span>Notifications</span>
                <span className="text-xs font-normal text-slate-500 bg-slate-200 dark:bg-slate-700 px-2 py-0.5 rounded-full">{unreadCount} New</span>
              </div>
              
              <div className="max-h-80 overflow-y-auto">
                {notifications.length === 0 ? (
                  <div className="p-8 text-center text-slate-500 dark:text-slate-400 text-sm">
                    <Bell className="w-8 h-8 mx-auto mb-2 opacity-20" />
                    No notifications yet
                  </div>
                ) : (
                  notifications.map((n) => (
                    <div 
                      key={n.id}
                      onClick={() => handleNotificationClick(n.id)}
                      className={`
                        p-3 border-b border-slate-100 dark:border-slate-800 text-sm cursor-pointer transition-colors
                        ${!n.is_read 
                          ? "bg-blue-50/50 dark:bg-blue-900/10 hover:bg-blue-100/50 dark:hover:bg-blue-900/20" 
                          : "hover:bg-slate-50 dark:hover:bg-slate-800/50"
                        }
                      `}
                    >
                      <div className="flex justify-between items-start gap-2">
                        <p className={`font-medium ${n.type === 'error' ? 'text-red-600 dark:text-red-400' : 'text-slate-800 dark:text-slate-200'}`}>
                          {n.title}
                        </p>
                        {!n.is_read && (
                          <span className="w-2 h-2 bg-blue-500 rounded-full flex-shrink-0 mt-1.5"></span>
                        )}
                      </div>
                      <p className="opacity-70 text-xs mt-1 text-slate-600 dark:text-slate-400 line-clamp-2">{n.message}</p>
                      <p className="text-[10px] text-slate-400 mt-2 text-right">
                        {new Date(n.timestamp).toLocaleString()}
                      </p>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}
        </div>

        {/* User Profile Dropdown */}
        <div className="relative pl-4 border-l dark:border-slate-800" ref={profileRef}>
          <button 
            className="flex items-center gap-3 hover:bg-slate-50 dark:hover:bg-slate-800 rounded-lg p-1 transition"
            onClick={() => setShowProfileMenu(!showProfileMenu)}
          >
            <div className="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center text-white font-bold text-sm">
              A
            </div>
            <div className="hidden md:block text-left">
              <p className="text-sm font-semibold leading-tight text-slate-900 dark:text-white">Admin</p>
              <p className="text-xs text-slate-500 dark:text-slate-400">Super Admin</p>
            </div>
          </button>

          {showProfileMenu && (
            <div className="absolute right-0 mt-2 w-48 bg-white dark:bg-slate-900 rounded-xl shadow-xl border border-slate-200 dark:border-slate-700 overflow-hidden z-50 py-1 animate-in fade-in zoom-in-95 duration-100">
              <button
                onClick={() => {
                  navigate("/profile");
                  setShowProfileMenu(false);
                }}
                className="w-full text-left px-4 py-2.5 text-sm text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800 flex items-center gap-2 transition-colors"
              >
                <User className="w-4 h-4" />
                My Profile
              </button>
              
              <button
                onClick={() => {
                  navigate("/settings");
                  setShowProfileMenu(false);
                }}
                className="w-full text-left px-4 py-2.5 text-sm text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800 flex items-center gap-2 transition-colors"
              >
                <Settings className="w-4 h-4" />
                Settings
              </button>

              <div className="h-px bg-slate-200 dark:bg-slate-800 my-1"></div>

              <button
                onClick={handleLogout}
                className="w-full text-left px-4 py-2.5 text-sm text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 flex items-center gap-2 transition-colors"
              >
                <LogOut className="w-4 h-4" />
                Logout
              </button>
            </div>
          )}
        </div>

      </div>
    </header>
  );
};

export default Topbar;
