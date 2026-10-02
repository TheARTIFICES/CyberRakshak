import { useCallback, useEffect, useState } from "react";

const STORAGE_KEY = "cyberrakshak-theme";

const applyTheme = (dark: boolean) => {
  document.documentElement.classList.toggle("dark", dark);
};

const readStoredTheme = (): boolean => {
  try {
    return localStorage.getItem(STORAGE_KEY) === "dark";
  } catch {
    return false;
  }
};

const listeners = new Set<(dark: boolean) => void>();

/**
 * Shared theme state.
 *
 * Provides a reactive theme hook synced with localStorage and the DOM
 * (document.documentElement.classList.contains("dark")), notifying all
 * mounted consumers when the theme is toggled from Topbar, Settings, or elsewhere.
 */
export const useTheme = () => {
  const [isDark, setIsDark] = useState<boolean>(() => readStoredTheme());

  useEffect(() => {
    const handler = (dark: boolean) => setIsDark(dark);
    listeners.add(handler);
    return () => {
      listeners.delete(handler);
    };
  }, []);

  // Keep the DOM in sync with state (also covers first mount).
  useEffect(() => {
    applyTheme(isDark);
  }, [isDark]);

  const setTheme = useCallback((dark: boolean) => {
    setIsDark(dark);
    applyTheme(dark);
    try {
      localStorage.setItem(STORAGE_KEY, dark ? "dark" : "light");
    } catch {
      // Storage unavailable (private mode) — theme still applies for this session.
    }
    listeners.forEach((listener) => listener(dark));
  }, []);

  const toggleTheme = useCallback(() => setTheme(!isDark), [isDark, setTheme]);

  return { isDark, setTheme, toggleTheme };
};

export default useTheme;
