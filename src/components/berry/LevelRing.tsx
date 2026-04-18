import { useEffect, useState } from "react";
import { cn } from "@/lib/utils";

interface LevelRingProps {
  level: number;          // current level (1-5)
  maxLevel?: number;      // default 5
  progress: number;       // 0-100 progress to next level
  size?: number;
  strokeWidth?: number;
  className?: string;
}

const LevelRing = ({
  level,
  maxLevel = 5,
  progress,
  size = 160,
  strokeWidth = 10,
  className,
}: LevelRingProps) => {
  const [animated, setAnimated] = useState(0);
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (animated / 100) * circumference;

  useEffect(() => {
    const t = setTimeout(() => setAnimated(progress), 100);
    return () => clearTimeout(t);
  }, [progress]);

  const tier =
    level >= 5 ? "Berry Legend" :
    level >= 4 ? "Berry Pro" :
    level >= 3 ? "Berry Explorer" :
    level >= 2 ? "Berry Sprout" :
    "Berry Newcomer";

  return (
    <div className={cn("relative inline-flex items-center justify-center", className)} style={{ width: size, height: size }}>
      <svg width={size} height={size} className="-rotate-90 absolute inset-0">
        <defs>
          <linearGradient id="berry-ring-grad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="hsl(348, 100%, 71%)" />
            <stop offset="100%" stopColor="hsl(0, 85%, 65%)" />
          </linearGradient>
        </defs>
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
          stroke="url(#berry-ring-grad)"
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          fill="none"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          style={{ transition: "stroke-dashoffset 1.2s cubic-bezier(0.4, 0, 0.2, 1)" }}
        />
      </svg>
      <div className="relative flex flex-col items-center justify-center">
        <span className="text-[var(--text-xs)] font-semibold text-muted-foreground uppercase tracking-wider">Level</span>
        <span className="text-5xl font-extrabold berry-gradient-text leading-none mt-[2px]">
          {level}
        </span>
        <span className="text-[var(--text-xs)] font-medium text-muted-foreground mt-[4px]">
          of {maxLevel}
        </span>
        <span className="text-[10px] font-semibold text-primary mt-[2px] uppercase tracking-wide">
          {tier}
        </span>
      </div>
    </div>
  );
};

export default LevelRing;
