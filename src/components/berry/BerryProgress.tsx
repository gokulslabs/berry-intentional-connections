import { cn } from "@/lib/utils";

interface BerryProgressProps {
  value: number;
  max?: number;
  className?: string;
}

const BerryProgress = ({ value, max = 100, className }: BerryProgressProps) => {
  const pct = Math.min(100, Math.max(0, (value / max) * 100));

  return (
    <div className={cn("w-full h-[8px] bg-muted rounded-[var(--radius-full)] overflow-hidden", className)}>
      <div
        className="h-full berry-gradient rounded-[var(--radius-full)] transition-all duration-500 ease-out"
        style={{ width: `${pct}%` }}
      />
    </div>
  );
};

export default BerryProgress;
