import { cn } from "@/lib/utils";

interface BerryButtonProps {
  children: React.ReactNode;
  variant?: "primary" | "secondary" | "outline" | "ghost";
  size?: "sm" | "md" | "lg";
  fullWidth?: boolean;
  onClick?: () => void;
  className?: string;
  disabled?: boolean;
}

const BerryButton = ({
  children,
  variant = "primary",
  size = "md",
  fullWidth = false,
  onClick,
  className,
  disabled = false,
}: BerryButtonProps) => {
  const base =
    "inline-flex items-center justify-center font-semibold rounded-[var(--radius-md)] transition-all duration-200 active:scale-[0.97] disabled:opacity-50 disabled:pointer-events-none";

  const variants = {
    primary: "berry-gradient text-primary-foreground berry-shadow hover:berry-shadow-lg",
    secondary: "bg-card text-foreground border border-border shadow-[var(--shadow-sm)] hover:bg-muted",
    outline: "border-2 border-primary text-primary bg-transparent hover:bg-primary/5",
    ghost: "text-foreground hover:bg-muted",
  };

  const sizes = {
    sm: "px-berry-2 py-[8px] text-[var(--text-sm)]",
    md: "px-berry-3 py-[12px] text-[var(--text-base)]",
    lg: "px-berry-4 py-berry-2 text-[var(--text-base)]",
  };

  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={cn(base, variants[variant], sizes[size], fullWidth && "w-full", className)}
    >
      {children}
    </button>
  );
};

export default BerryButton;
