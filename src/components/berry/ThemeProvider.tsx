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
  const [theme, setTheme] = useState<Theme>("light");
  const [ready, setReady] = useState(false);

  // Load persisted theme via platform adapter
  useEffect(() => {
    const stored = getStorageAdapter().getItem("berry-theme");
    if (stored instanceof Promise) {
      stored.then((v) => {
        if (v === "dark" || v === "light") setTheme(v);
        setReady(true);
      });
    } else {
      if (stored === "dark" || stored === "light") setTheme(stored);
      setReady(true);
    }
  }, []);

  // Apply theme — web-specific DOM manipulation (safe no-op outside browser)
  useEffect(() => {
    if (!ready) return;
    if (typeof document !== "undefined") {
      const root = document.documentElement;
      root.classList.remove("light", "dark");
      root.classList.add(theme);
    }
    getStorageAdapter().setItem("berry-theme", theme);
  }, [theme, ready]);

  const toggleTheme = () => setTheme((t) => (t === "light" ? "dark" : "light"));

  return (
    <ThemeContext.Provider value={{ theme, toggleTheme }}>
      {children}
    </ThemeContext.Provider>
  );
};
