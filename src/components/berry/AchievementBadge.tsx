import { cn } from "@/lib/utils";
import BerryLogo from "./BerryLogo";

export interface AchievementBadgeProps {
  emoji: string;
  label: string;
  earned: boolean;
  description?: string;
}

const AchievementBadge = ({ emoji, label, earned, description }: AchievementBadgeProps) => (
  <div
    className={cn(
      "flex flex-col items-center gap-[6px] p-berry-2 rounded-[var(--radius-md)] transition-all duration-300",
      earned ? "bg-primary/8 border border-primary/20 berry-shadow" : "bg-muted/40 border border-border opacity-60"
    )}
    title={description}
  >
    <div
      className={cn(
        "w-12 h-12 rounded-[var(--radius-full)] flex items-center justify-center text-2xl transition-transform",
        earned ? "berry-gradient berry-shadow scale-100" : "bg-muted scale-90 grayscale"
      )}
    >
      {earned ? emoji : <BerryLogo size="md" className="opacity-40" />}
    </div>
    <span className={cn(
      "text-[var(--text-xs)] font-semibold text-center leading-tight",
      earned ? "text-foreground" : "text-muted-foreground"
    )}>
      {label}
    </span>
  </div>
);

export default AchievementBadge;
