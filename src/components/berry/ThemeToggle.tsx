import { useTheme, type ThemePreference } from "./ThemeProvider";
import { cn } from "@/lib/utils";

const OPTIONS: { value: ThemePreference; label: string; icon: string }[] = [
  { value: "light", label: "Light", icon: "☀️" },
  { value: "system", label: "System", icon: "💻" },
  { value: "dark", label: "Dark", icon: "🌙" },
];

const ThemeToggle = ({ className }: { className?: string }) => {
  const { preference, setPreference } = useTheme();

  return (
    <div
      role="radiogroup"
      aria-label="Theme"
      className={cn(
        "inline-flex items-center gap-1 rounded-full border border-border bg-muted/40 p-1 text-xs font-semibold",
        className
      )}
    >
      {OPTIONS.map((opt) => {
        const active = preference === opt.value;
        return (
          <button
            key={opt.value}
            role="radio"
            aria-checked={active}
            onClick={() => setPreference(opt.value)}
            className={cn(
              "flex items-center gap-1 rounded-full px-2.5 py-1 transition-all duration-200",
              active
                ? "bg-background text-foreground shadow-sm"
                : "text-muted-foreground hover:text-foreground"
            )}
          >
            <span aria-hidden>{opt.icon}</span>
            <span>{opt.label}</span>
          </button>
        );
      })}
    </div>
  );
};

export default ThemeToggle;
