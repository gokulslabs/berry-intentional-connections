import { useTheme } from "./ThemeProvider";
import { cn } from "@/lib/utils";

const ThemeToggle = ({ className }: { className?: string }) => {
  const { theme, toggleTheme } = useTheme();
  const isDark = theme === "dark";

  return (
    <button
      onClick={toggleTheme}
      className={cn(
        "relative flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-semibold transition-all duration-300",
        isDark
          ? "bg-accent/10 text-accent-foreground border border-accent/20"
          : "bg-primary/10 text-primary border border-primary/20",
        className
      )}
      aria-label="Toggle theme"
    >
      <span className={cn("transition-opacity duration-300", isDark ? "opacity-50" : "opacity-100")}>
        ☀️
      </span>
      <div
        className={cn(
          "w-5 h-5 rounded-full berry-gradient transition-transform duration-300 shadow-sm",
          isDark ? "translate-x-0.5" : "-translate-x-0.5"
        )}
      />
      <span className={cn("transition-opacity duration-300", isDark ? "opacity-100" : "opacity-50")}>
        🌙
      </span>
    </button>
  );
};

export default ThemeToggle;
