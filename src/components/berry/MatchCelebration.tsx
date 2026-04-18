import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import BerryAvatar from "./BerryAvatar";
import BerryButton from "./BerryButton";
import BerryLogo from "./BerryLogo";
import { Heart, X } from "lucide-react";

interface MatchCelebrationProps {
  open: boolean;
  meName: string;
  themName: string;
  onChat: () => void;
  onClose: () => void;
}

interface Confetto {
  id: number;
  left: number;
  delay: number;
  duration: number;
  color: string;
  emoji: string;
}

const COLORS = ["hsl(348,100%,71%)", "hsl(0,85%,65%)", "hsl(45,100%,70%)", "hsl(280,80%,72%)"];
const EMOJIS = ["🍓", "💕", "✨", "🌸", "💫"];

const MatchCelebration = ({ open, meName, themName, onChat, onClose }: MatchCelebrationProps) => {
  const [confetti, setConfetti] = useState<Confetto[]>([]);

  useEffect(() => {
    if (!open) return;
    const items: Confetto[] = Array.from({ length: 24 }, (_, i) => ({
      id: i,
      left: Math.random() * 100,
      delay: Math.random() * 400,
      duration: 1800 + Math.random() * 1200,
      color: COLORS[i % COLORS.length],
      emoji: EMOJIS[i % EMOJIS.length],
    }));
    setConfetti(items);
  }, [open]);

  if (!open) return null;

  return createPortal(
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center p-berry-3 bg-background/85 backdrop-blur-md animate-fade-in"
      role="dialog"
      aria-modal="true"
      onClick={onClose}
    >
      {/* Confetti layer */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        {confetti.map((c) => (
          <span
            key={c.id}
            className="absolute -top-8 text-xl"
            style={{
              left: `${c.left}%`,
              color: c.color,
              animation: `berry-confetti ${c.duration}ms ease-in ${c.delay}ms forwards`,
            }}
          >
            {c.emoji}
          </span>
        ))}
      </div>

      {/* Card */}
      <div
        className="relative w-full max-w-sm rounded-[var(--radius-lg)] bg-card border border-border p-berry-4 shadow-[var(--shadow-lg)] berry-shadow-lg animate-scale-in text-center"
        onClick={(e) => e.stopPropagation()}
        style={{ animation: "berry-pop 0.5s cubic-bezier(0.34, 1.56, 0.64, 1)" }}
      >
        <button
          onClick={onClose}
          aria-label="Close"
          className="absolute top-berry-1 right-berry-1 w-8 h-8 rounded-[var(--radius-full)] bg-muted/60 flex items-center justify-center text-muted-foreground hover:bg-muted active:scale-95 transition-all"
        >
          <X className="w-4 h-4" />
        </button>

        {/* Two avatars + heart */}
        <div className="relative h-[120px] flex items-center justify-center mb-berry-2">
          <div
            className="absolute"
            style={{ animation: "berry-slide-in-left 0.7s cubic-bezier(0.34, 1.56, 0.64, 1)" }}
          >
            <div className="ring-4 ring-primary/20 rounded-[var(--radius-full)]">
              <BerryAvatar name={meName} size="xl" />
            </div>
          </div>
          <div
            className="absolute"
            style={{ animation: "berry-slide-in-right 0.7s cubic-bezier(0.34, 1.56, 0.64, 1)" }}
          >
            <div className="ring-4 ring-primary/20 rounded-[var(--radius-full)]">
              <BerryAvatar name={themName} size="xl" />
            </div>
          </div>
          {/* Heart in the middle */}
          <div
            className="absolute z-10 w-12 h-12 rounded-[var(--radius-full)] berry-gradient berry-shadow-lg flex items-center justify-center"
            style={{ animation: "berry-heart-pop 0.4s ease-out 0.6s both" }}
          >
            <Heart className="w-6 h-6 text-primary-foreground fill-primary-foreground" />
          </div>
        </div>

        <div className="flex items-center justify-center gap-berry-1 mb-berry-1">
          <BerryLogo size="md" />
          <h2 className="text-2xl font-extrabold berry-gradient-text">It's a match!</h2>
        </div>
        <p className="text-[var(--text-sm)] text-muted-foreground mb-berry-3 leading-relaxed">
          You and <span className="font-semibold text-foreground">{themName}</span> liked each other.
          <br />
          Don't keep them waiting 💕
        </p>

        <div className="flex flex-col gap-berry-1">
          <BerryButton fullWidth onClick={onChat}>
            Say hi 🍓
          </BerryButton>
          <BerryButton fullWidth variant="ghost" onClick={onClose}>
            Keep exploring
          </BerryButton>
        </div>
      </div>

      <style>{`
        @keyframes berry-confetti {
          0%   { transform: translateY(-20px) rotate(0deg); opacity: 1; }
          100% { transform: translateY(110vh) rotate(720deg); opacity: 0.2; }
        }
        @keyframes berry-pop {
          0%   { transform: scale(0.6); opacity: 0; }
          60%  { transform: scale(1.05); opacity: 1; }
          100% { transform: scale(1); opacity: 1; }
        }
        @keyframes berry-slide-in-left {
          0%   { transform: translateX(-160px) rotate(-20deg); opacity: 0; }
          70%  { transform: translateX(-32px) rotate(0deg); opacity: 1; }
          100% { transform: translateX(-30px) rotate(0deg); opacity: 1; }
        }
        @keyframes berry-slide-in-right {
          0%   { transform: translateX(160px) rotate(20deg); opacity: 0; }
          70%  { transform: translateX(32px) rotate(0deg); opacity: 1; }
          100% { transform: translateX(30px) rotate(0deg); opacity: 1; }
        }
        @keyframes berry-heart-pop {
          0%   { transform: scale(0); opacity: 0; }
          70%  { transform: scale(1.3); opacity: 1; }
          100% { transform: scale(1); opacity: 1; }
        }
      `}</style>
    </div>,
    document.body
  );
};

export default MatchCelebration;
