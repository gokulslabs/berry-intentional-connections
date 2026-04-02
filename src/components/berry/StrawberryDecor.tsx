import { cn } from "@/lib/utils";

interface StrawberryDecorProps {
  variant?: "scatter" | "corner" | "divider";
  className?: string;
}

/**
 * Decorative floating strawberry elements for backgrounds and section breaks.
 * Kept as simple positioned elements for easy React Native mapping.
 */
const StrawberryDecor = ({ variant = "scatter", className }: StrawberryDecorProps) => {
  if (variant === "divider") {
    return (
      <div className={cn("flex items-center justify-center gap-3 py-4", className)}>
        <div className="h-px flex-1 bg-border" />
        <span className="text-lg">🍓</span>
        <div className="h-px flex-1 bg-border" />
      </div>
    );
  }

  if (variant === "corner") {
    return (
      <div className={cn("absolute pointer-events-none opacity-10", className)}>
        <svg width="120" height="120" viewBox="0 0 120 120" fill="none">
          <circle cx="60" cy="60" r="50" fill="hsl(348, 100%, 71%)" />
          <circle cx="90" cy="30" r="25" fill="hsl(0, 85%, 65%)" />
          <circle cx="30" cy="90" r="20" fill="hsl(348, 80%, 75%)" />
        </svg>
      </div>
    );
  }

  // scatter - floating berries background
  return (
    <div className={cn("absolute inset-0 pointer-events-none overflow-hidden dark:hidden", className)} aria-hidden>
      <div className="absolute -top-4 -left-4 opacity-[0.06] rotate-12">
        <svg width="80" height="80" viewBox="0 0 64 64" fill="none">
          <path d="M16 22C16 22 12 32 14 42C16 52 24 58 32 58C40 58 48 52 50 42C52 32 48 22 48 22C44 18 36 16 32 16C28 16 20 18 16 22Z" fill="hsl(348, 100%, 71%)" />
        </svg>
      </div>
      <div className="absolute top-1/4 -right-6 opacity-[0.05] -rotate-12">
        <svg width="60" height="60" viewBox="0 0 64 64" fill="none">
          <path d="M16 22C16 22 12 32 14 42C16 52 24 58 32 58C40 58 48 52 50 42C52 32 48 22 48 22C44 18 36 16 32 16C28 16 20 18 16 22Z" fill="hsl(0, 85%, 65%)" />
        </svg>
      </div>
      <div className="absolute bottom-1/3 -left-3 opacity-[0.04] rotate-45">
        <svg width="50" height="50" viewBox="0 0 64 64" fill="none">
          <path d="M16 22C16 22 12 32 14 42C16 52 24 58 32 58C40 58 48 52 50 42C52 32 48 22 48 22C44 18 36 16 32 16C28 16 20 18 16 22Z" fill="hsl(348, 100%, 71%)" />
        </svg>
      </div>
      <div className="absolute -bottom-4 right-8 opacity-[0.06] rotate-[30deg]">
        <svg width="70" height="70" viewBox="0 0 64 64" fill="none">
          <path d="M16 22C16 22 12 32 14 42C16 52 24 58 32 58C40 58 48 52 50 42C52 32 48 22 48 22C44 18 36 16 32 16C28 16 20 18 16 22Z" fill="hsl(0, 85%, 65%)" />
        </svg>
      </div>
    </div>
  );
};

export default StrawberryDecor;
