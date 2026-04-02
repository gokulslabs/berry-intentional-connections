import { cn } from "@/lib/utils";

interface PhoneMockupProps {
  children: React.ReactNode;
  className?: string;
}

const PhoneMockup = ({ children, className }: PhoneMockupProps) => {
  return (
    <div className={cn("relative mx-auto", className)} style={{ width: 280, height: 560 }}>
      <div className="absolute inset-0 rounded-[40px] border-[6px] border-border bg-card shadow-[var(--shadow-lg)] overflow-hidden">
        {/* Notch */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-28 h-6 bg-muted rounded-b-[var(--radius-md)] z-10" />
        <div className="w-full h-full pt-berry-4 overflow-hidden">{children}</div>
      </div>
    </div>
  );
};

export default PhoneMockup;
