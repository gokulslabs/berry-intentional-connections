import { cn } from "@/lib/utils";

interface BerryAvatarProps {
  src?: string;
  name: string;
  size?: "sm" | "md" | "lg" | "xl";
  className?: string;
}

const BerryAvatar = ({ src, name, size = "md", className }: BerryAvatarProps) => {
  const sizes = {
    sm: "w-8 h-8 text-xs",
    md: "w-12 h-12 text-sm",
    lg: "w-16 h-16 text-base",
    xl: "w-24 h-24 text-xl",
  };

  const initials = name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  return (
    <div className={cn("rounded-full overflow-hidden flex-shrink-0", sizes[size], className)}>
      {src ? (
        <img src={src} alt={name} className="w-full h-full object-cover" />
      ) : (
        <div className="w-full h-full berry-gradient flex items-center justify-center text-primary-foreground font-semibold">
          {initials}
        </div>
      )}
    </div>
  );
};

export default BerryAvatar;
