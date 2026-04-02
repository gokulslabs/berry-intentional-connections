import BerryCard from "./BerryCard";
import BerryTag from "./BerryTag";
import BerryButton from "./BerryButton";
import BerryAvatar from "./BerryAvatar";
import BerryLogo from "./BerryLogo";

interface ProfileCardProps {
  name: string;
  age: number;
  image?: string;
  tags: string[];
  matchReason?: string;
  onChat?: () => void;
}

const ProfileCard = ({ name, age, image, tags, matchReason, onChat }: ProfileCardProps) => {
  return (
    <BerryCard className="overflow-hidden p-0">
      <div className="aspect-[4/3] bg-muted overflow-hidden">
        {image ? (
          <img src={image} alt={name} className="w-full h-full object-cover" />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <BerryAvatar name={name} size="xl" />
          </div>
        )}
      </div>
      <div className="p-berry-3 space-y-berry-1">
        <div className="flex items-center justify-between">
          <h3 className="text-[var(--text-lg)] font-bold text-foreground">
            {name}, {age}
          </h3>
        </div>

        {matchReason && (
          <div className="bg-primary/5 rounded-[var(--radius-md)] px-berry-1 py-berry-1">
            <p className="text-[var(--text-xs)] font-medium text-primary flex items-center gap-[4px]"><BerryLogo size="sm" /> Why you matched</p>
            <p className="text-[var(--text-sm)] text-foreground mt-[4px]">{matchReason}</p>
          </div>
        )}

        <div className="flex flex-wrap gap-berry-1">
          {tags.map((tag) => (
            <BerryTag key={tag} label={tag} />
          ))}
        </div>

        <BerryButton fullWidth onClick={onChat}>
          Start Chat
        </BerryButton>
      </div>
    </BerryCard>
  );
};

export default ProfileCard;
