import BerryCard from "./BerryCard";
import BerryTag from "./BerryTag";
import BerryButton from "./BerryButton";
import BerryAvatar from "./BerryAvatar";
import BerryLogo from "./BerryLogo";
import CompatibilityRing from "./CompatibilityRing";
import { MessageCircle } from "lucide-react";

interface ProfileCardProps {
  name: string;
  age: number;
  image?: string;
  tags: string[];
  matchReason?: string;
  /** Compatibility score 0-100. Hidden when undefined. */
  compatibility?: number;
  /** Interest names that both users share — highlighted in tag list. */
  sharedInterests?: string[];
  onChat?: () => void;
}

const ProfileCard = ({
  name,
  age,
  image,
  tags,
  matchReason,
  compatibility,
  sharedInterests,
  onChat,
}: ProfileCardProps) => {
  const sharedSet = new Set(sharedInterests ?? []);

  return (
    <BerryCard className="overflow-hidden p-0 hover:berry-shadow-lg transition-shadow duration-300">
      <div className="relative aspect-[4/3] bg-muted overflow-hidden">
        {image ? (
          <img src={image} alt={name} className="w-full h-full object-cover" />
        ) : (
          <div className="w-full h-full flex items-center justify-center berry-gradient/5">
            <BerryAvatar name={name} size="xl" />
          </div>
        )}
        {/* Compatibility ring overlay */}
        {typeof compatibility === "number" && (
          <div className="absolute top-berry-1 right-berry-1 bg-card/90 backdrop-blur-md rounded-[var(--radius-full)] p-[3px] shadow-[var(--shadow-md)]">
            <CompatibilityRing score={compatibility} size={52} label="Match" />
          </div>
        )}
        {/* Name overlay */}
        <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent p-berry-2 pt-berry-4">
          <h3 className="text-[var(--text-lg)] font-extrabold text-white drop-shadow-md">
            {name}, {age}
          </h3>
        </div>
      </div>

      <div className="p-berry-3 space-y-berry-2">
        {matchReason && (
          <div className="bg-primary/8 border border-primary/15 rounded-[var(--radius-md)] px-berry-2 py-berry-1 flex items-start gap-berry-1">
            <BerryLogo size="sm" className="flex-shrink-0 mt-[1px]" />
            <p className="text-[var(--text-xs)] font-medium text-foreground leading-snug">
              {matchReason}
            </p>
          </div>
        )}

        {tags.length > 0 && (
          <div className="flex flex-wrap gap-berry-1">
            {tags.map((tag) => (
              <BerryTag key={tag} label={tag} active={sharedSet.has(tag)} />
            ))}
          </div>
        )}

        {onChat && (
          <BerryButton fullWidth onClick={onChat}>
            <MessageCircle className="w-4 h-4 mr-berry-1" /> Start Chat
          </BerryButton>
        )}
      </div>
    </BerryCard>
  );
};

export default ProfileCard;
