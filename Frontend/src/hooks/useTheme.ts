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

/**
 * Shared theme state.
 *
 * The toggle previously lived as local `useState` inside Topbar and called
 * `classList.toggle("dark")` blindly, so the theme reset on every reload and
 * could desync from the DOM. Now that the control is relocated into Settings,
 * the state has to be readable from more than one component anyway — this
 * centralises it and persists the choice.
 */
export const useTheme = () => {
  const [isDark, setIsDark] = useState<boolean>(() => readStoredTheme());

  // Keep the DOM in sync with state (also covers first mount).
  useEffect(() => {
    applyTheme(isDark);
  }, [isDark]);

  const setTheme = useCallback((dark: boolean) => {
    setIsDark(dark);
    try {
      localStorage.setItem(STORAGE_KEY, dark ? "dark" : "light");
    } catch {
      // Storage unavailable (private mode) — theme still applies for this session.
    }
  }, []);

  const toggleTheme = useCallback(() => setTheme(!isDark), [isDark, setTheme]);

  return { isDark, setTheme, toggleTheme };
};

export default useTheme;
