import { cn } from "@/lib/utils";

interface BerryTagProps {
  label: string;
  active?: boolean;
  onClick?: () => void;
  className?: string;
}

const BerryTag = ({ label, active = false, onClick, className }: BerryTagProps) => {
  return (
    <button
      onClick={onClick}
      className={cn(
        "rounded-[var(--radius-full)] px-berry-2 py-[8px] text-[var(--text-sm)] font-medium transition-all duration-200 active:scale-[0.95]",
        active
          ? "berry-gradient text-primary-foreground berry-shadow"
          : "bg-muted text-muted-foreground hover:bg-muted/80",
        className
      )}
    >
      {label}
    </button>
  );
};

export default BerryTag;
