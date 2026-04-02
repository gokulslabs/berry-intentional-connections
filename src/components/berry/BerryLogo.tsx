import { cn } from "@/lib/utils";
import berryLogo from "@/assets/berry-logo.png";

const sizes = {
  sm: 16,
  md: 24,
  lg: 32,
} as const;

type LogoSize = keyof typeof sizes;

interface BerryLogoProps {
  size?: LogoSize;
  className?: string;
}

const BerryLogo = ({ size = "md", className }: BerryLogoProps) => (
  <img
    src={berryLogo}
    alt="Berry"
    height={sizes[size]}
    style={{ height: sizes[size], width: "auto" }}
    className={cn("inline-block flex-shrink-0", className)}
  />
);

export default BerryLogo;
