import { cn } from "@/lib/utils";

interface BerryCardProps extends React.HTMLAttributes<HTMLDivElement> {
  children?: React.ReactNode;
  className?: string;
  onClick?: () => void;
}

const BerryCard = ({ children, className, onClick, ...props }: BerryCardProps) => {
  return (
    <div
      onClick={onClick}
      className={cn(
        "bg-card rounded-[var(--radius-lg)] p-berry-3 shadow-[var(--shadow-md)] border border-border transition-all duration-200",
        onClick && "cursor-pointer active:scale-[0.98]",
        className
      )}
      {...props}
    >
      {children}
    </div>
  );
};

export default BerryCard;
