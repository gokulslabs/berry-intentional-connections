import { createContext, useContext, useEffect, useState, useCallback } from "react";
import { getStorageAdapter } from "@/lib/platform/storage";

type Theme = "light" | "dark";
export type ThemePreference = "light" | "dark" | "system";

interface ThemeContextType {
  /** Resolved theme actually applied (never "system"). */
  theme: Theme;
  /** Raw user preference, may be "system". */
  preference: ThemePreference;
  /** Set the user preference explicitly. */
  setPreference: (p: ThemePreference) => void;
  /** Cycles light → dark → system → light. */
  toggleTheme: () => void;
}

const STORAGE_KEY = "berry-theme";

const ThemeContext = createContext<ThemeContextType>({
  theme: "light",
  preference: "system",
  setPreference: () => {},
  toggleTheme: () => {},
});

export const useTheme = () => useContext(ThemeContext);

const getSystemTheme = (): Theme =>
  typeof window !== "undefined" &&
  window.matchMedia?.("(prefers-color-scheme: dark)").matches
    ? "dark"
    : "light";

const applyTheme = (theme: Theme) => {
  if (typeof document === "undefined") return;
  const root = document.documentElement;
  root.classList.remove("light", "dark");
  root.classList.add(theme);
  (root.style as CSSStyleDeclaration & { colorScheme: string }).colorScheme = theme;
};

export const ThemeProvider = ({ children }: { children: React.ReactNode }) => {
  // Preference defaults to "system" — reconciled from storage in effect below.
  const [preference, setPreferenceState] = useState<ThemePreference>("system");

  // Resolved theme — initialize from class already applied by the inline anti-FOUC script.
  const [theme, setTheme] = useState<Theme>(() => {
    if (typeof document !== "undefined" && document.documentElement.classList.contains("dark")) {
      return "dark";
    }
    return "light";
  });

  // Load persisted preference (sync localStorage or async RN AsyncStorage).
  useEffect(() => {
    const stored = getStorageAdapter().getItem(STORAGE_KEY);
    const handle = (v: string | null) => {
      if (v === "dark" || v === "light" || v === "system") {
        setPreferenceState(v);
      }
    };
    if (stored instanceof Promise) stored.then(handle);
    else handle(stored);
  }, []);

  // Resolve preference → theme, and listen to OS changes when in "system" mode.
  useEffect(() => {
    const resolve = () => setTheme(preference === "system" ? getSystemTheme() : preference);
    resolve();

    if (preference !== "system" || typeof window === "undefined" || !window.matchMedia) return;
    const mql = window.matchMedia("(prefers-color-scheme: dark)");
    const onChange = () => setTheme(getSystemTheme());
    mql.addEventListener?.("change", onChange);
    return () => mql.removeEventListener?.("change", onChange);
  }, [preference]);

  // Apply resolved theme to <html> on every change.
  useEffect(() => {
    applyTheme(theme);
  }, [theme]);

  const setPreference = useCallback((p: ThemePreference) => {
    setPreferenceState(p);
    getStorageAdapter().setItem(STORAGE_KEY, p);
  }, []);

  const toggleTheme = useCallback(() => {
    setPreferenceState((p) => {
      const next: ThemePreference = p === "light" ? "dark" : p === "dark" ? "system" : "light";
      getStorageAdapter().setItem(STORAGE_KEY, next);
      return next;
    });
  }, []);

  return (
    <ThemeContext.Provider value={{ theme, preference, setPreference, toggleTheme }}>
      {children}
    </ThemeContext.Provider>
  );
};
