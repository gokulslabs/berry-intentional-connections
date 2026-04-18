import { useEffect, useState } from "react";
import { cn } from "@/lib/utils";

interface CompatibilityRingProps {
  score: number; // 0-100
  size?: number;
  strokeWidth?: number;
  className?: string;
  label?: string;
}

const CompatibilityRing = ({
  score,
  size = 56,
  strokeWidth = 5,
  className,
  label,
}: CompatibilityRingProps) => {
  const [animated, setAnimated] = useState(0);
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (animated / 100) * circumference;

  useEffect(() => {
    const t = setTimeout(() => setAnimated(score), 80);
    return () => clearTimeout(t);
  }, [score]);

  const color =
    score >= 80
      ? "hsl(var(--primary))"
      : score >= 60
        ? "hsl(var(--primary))"
        : score >= 40
          ? "hsl(var(--accent))"
          : "hsl(var(--muted-foreground))";

  return (
    <div className={cn("relative inline-flex items-center justify-center", className)} style={{ width: size, height: size }}>
      <svg width={size} height={size} className="-rotate-90">
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke="hsl(var(--muted))"
          strokeWidth={strokeWidth}
          fill="none"
        />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke={color}
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          fill="none"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          style={{ transition: "stroke-dashoffset 0.9s cubic-bezier(0.4, 0, 0.2, 1)" }}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="text-[var(--text-sm)] font-extrabold text-foreground leading-none">
          {Math.round(animated)}
        </span>
        {label && (
          <span className="text-[9px] font-medium text-muted-foreground uppercase tracking-wider mt-[1px]">
            {label}
          </span>
        )}
      </div>
    </div>
  );
};

export default CompatibilityRing;
