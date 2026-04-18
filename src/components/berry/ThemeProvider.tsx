import { createContext, useContext, useEffect, useState } from "react";
import { getStorageAdapter } from "@/lib/platform/storage";

type Theme = "light" | "dark";

interface ThemeContextType {
  theme: Theme;
  toggleTheme: () => void;
}

const ThemeContext = createContext<ThemeContextType>({ theme: "light", toggleTheme: () => {} });

export const useTheme = () => useContext(ThemeContext);

export const ThemeProvider = ({ children }: { children: React.ReactNode }) => {
  // Initialize from the class already applied by the inline anti-FOUC script in index.html.
  // This avoids any light→dark flash on first paint.
  const [theme, setTheme] = useState<Theme>(() => {
    if (typeof document !== "undefined" && document.documentElement.classList.contains("dark")) {
      return "dark";
    }
    return "light";
  });

  // Reconcile with persisted value from the storage adapter (handles async RN AsyncStorage).
  useEffect(() => {
    const stored = getStorageAdapter().getItem("berry-theme");
    if (stored instanceof Promise) {
      stored.then((v) => {
        if (v === "dark" || v === "light") setTheme(v);
      });
    } else if (stored === "dark" || stored === "light") {
      setTheme(stored);
    }
  }, []);

  // Apply theme on changes (initial paint already handled inline in index.html).
  useEffect(() => {
    if (typeof document !== "undefined") {
      const root = document.documentElement;
      root.classList.remove("light", "dark");
      root.classList.add(theme);
      (root.style as CSSStyleDeclaration & { colorScheme: string }).colorScheme = theme;
    }
    getStorageAdapter().setItem("berry-theme", theme);
  }, [theme]);

  const toggleTheme = () => setTheme((t) => (t === "light" ? "dark" : "light"));

  return (
    <ThemeContext.Provider value={{ theme, toggleTheme }}>
      {children}
    </ThemeContext.Provider>
  );
};
