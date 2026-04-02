import { cn } from "@/lib/utils";

interface BerryInputProps {
  placeholder?: string;
  value?: string;
  onChange?: (value: string) => void;
  type?: string;
  className?: string;
  icon?: React.ReactNode;
}

const BerryInput = ({ placeholder, value, onChange, type = "text", className, icon }: BerryInputProps) => {
  return (
    <div className={cn("relative", className)}>
      {icon && <div className="absolute left-berry-2 top-1/2 -translate-y-1/2 text-muted-foreground">{icon}</div>}
      <input
        type={type}
        placeholder={placeholder}
        value={value}
        onChange={(e) => onChange?.(e.target.value)}
        className={cn(
          "w-full rounded-[var(--radius-md)] border border-border bg-card px-berry-2 py-[12px] text-[var(--text-base)] text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary/50 transition-all duration-200 shadow-[var(--shadow-sm)]",
          icon && "pl-[48px]"
        )}
      />
    </div>
  );
};

export default BerryInput;
