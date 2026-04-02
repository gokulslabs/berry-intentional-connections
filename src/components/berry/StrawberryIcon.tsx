import { cn } from "@/lib/utils";

interface StrawberryIconProps {
  size?: number;
  className?: string;
}

const StrawberryIcon = ({ size = 24, className }: StrawberryIconProps) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 64 64"
    fill="none"
    className={cn("inline-block flex-shrink-0", className)}
  >
    {/* Leaf */}
    <path
      d="M32 8C28 4 22 6 20 10C18 6 12 4 8 8C4 12 8 18 12 20C16 22 20 18 22 14C24 18 28 22 32 20C36 22 40 18 42 14C44 18 48 22 52 20C56 18 60 12 56 8C52 4 46 6 44 10C42 6 36 4 32 8Z"
      fill="hsl(140, 60%, 45%)"
    />
    {/* Stem */}
    <path
      d="M30 12C30 12 31 6 32 4C33 6 34 12 34 12"
      stroke="hsl(140, 50%, 35%)"
      strokeWidth="2"
      strokeLinecap="round"
    />
    {/* Berry body */}
    <path
      d="M16 22C16 22 12 32 14 42C16 52 24 58 32 58C40 58 48 52 50 42C52 32 48 22 48 22C44 18 36 16 32 16C28 16 20 18 16 22Z"
      fill="url(#berryGrad)"
    />
    {/* Seeds */}
    <ellipse cx="24" cy="32" rx="1.5" ry="2" fill="hsl(45, 90%, 70%)" transform="rotate(-15 24 32)" />
    <ellipse cx="32" cy="28" rx="1.5" ry="2" fill="hsl(45, 90%, 70%)" />
    <ellipse cx="40" cy="32" rx="1.5" ry="2" fill="hsl(45, 90%, 70%)" transform="rotate(15 40 32)" />
    <ellipse cx="22" cy="40" rx="1.5" ry="2" fill="hsl(45, 90%, 70%)" transform="rotate(-10 22 40)" />
    <ellipse cx="32" cy="38" rx="1.5" ry="2" fill="hsl(45, 90%, 70%)" />
    <ellipse cx="42" cy="40" rx="1.5" ry="2" fill="hsl(45, 90%, 70%)" transform="rotate(10 42 40)" />
    <ellipse cx="27" cy="48" rx="1.5" ry="2" fill="hsl(45, 90%, 70%)" transform="rotate(-5 27 48)" />
    <ellipse cx="37" cy="48" rx="1.5" ry="2" fill="hsl(45, 90%, 70%)" transform="rotate(5 37 48)" />
    {/* Shine */}
    <path
      d="M22 26C22 26 20 30 21 34"
      stroke="hsla(0, 0%, 100%, 0.4)"
      strokeWidth="2"
      strokeLinecap="round"
    />
    <defs>
      <linearGradient id="berryGrad" x1="16" y1="16" x2="50" y2="58" gradientUnits="userSpaceOnUse">
        <stop stopColor="hsl(348, 100%, 71%)" />
        <stop offset="1" stopColor="hsl(0, 85%, 55%)" />
      </linearGradient>
    </defs>
  </svg>
);

export default StrawberryIcon;
