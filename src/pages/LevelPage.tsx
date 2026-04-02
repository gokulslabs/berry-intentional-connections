import { useNavigate } from "react-router-dom";
import BerryCard from "@/components/berry/BerryCard";
import BerryProgress from "@/components/berry/BerryProgress";
import StrawberryDecor from "@/components/berry/StrawberryDecor";
import BerryLogo from "@/components/berry/BerryLogo";
import BottomNav from "@/components/berry/BottomNav";
import { ArrowLeft, MessageCircle, Zap, Heart, TrendingUp } from "lucide-react";
import { useAuthContext } from "@/features/auth/contexts/AuthContext";

const tips = [
  "Respond to matches within 24 hours",
  "Ask thoughtful follow-up questions",
  "Share genuine stories about yourself",
  "Be respectful of others' boundaries",
];

const LevelSkeleton = () => (
  <div className="space-y-berry-3 animate-pulse">
    <div className="bg-card rounded-[var(--radius-lg)] border border-border p-berry-3 h-48" />
    <div className="flex items-center justify-between px-berry-1">
      {[1, 2, 3, 4, 5].map((i) => (
        <div key={i} className="w-[40px] h-[40px] rounded-[var(--radius-full)] bg-muted" />
      ))}
    </div>
    <div className="space-y-berry-1">
      {[0, 1, 2].map((i) => (
        <div key={i} className="bg-card rounded-[var(--radius-lg)] border border-border p-berry-2 h-16" />
      ))}
    </div>
  </div>
);

const LevelPage = () => {
  const navigate = useNavigate();
  const { profile, profileLoading } = useAuthContext();

  const level = profile?.level ?? 1;
  const responseRate = profile?.response_rate ?? 0;
  const progress = Math.min((responseRate * 0.5 + level * 15), 100);

  const stats = [
    { icon: MessageCircle, label: "Response Rate", value: `${Math.round(responseRate)}%`, desc: "You reply to most matches" },
    { icon: Zap, label: "Conversation Quality", value: "—", desc: "Keep chatting to unlock" },
    { icon: Heart, label: "Match Satisfaction", value: "—", desc: "Keep matching to unlock" },
  ];

  return (
    <div className="min-h-screen bg-background dark:berry-night-glow pb-[80px]">
      <div className="sticky top-0 z-50 bg-background/80 backdrop-blur-lg">
        <div className="max-w-md mx-auto px-berry-3 py-berry-2 flex items-center justify-between">
          <button
            onClick={() => navigate(-1)}
            className="w-[40px] h-[40px] rounded-[var(--radius-md)] bg-muted flex items-center justify-center text-muted-foreground active:scale-95 transition-transform"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <h1 className="text-[var(--text-lg)] font-bold text-foreground">Your Level</h1>
          <div className="w-[40px]" />
        </div>
      </div>

      <div className="max-w-md mx-auto px-berry-3 py-berry-3 space-y-berry-3">
        {profileLoading ? (
          <LevelSkeleton />
        ) : (
          <>
            <BerryCard className="text-center space-y-berry-2 relative overflow-hidden">
              <StrawberryDecor variant="corner" className="-top-6 -right-6" />
              <StrawberryDecor variant="corner" className="-bottom-6 -left-6 rotate-180" />
              <div className="relative">
                <div className="w-[96px] h-[96px] rounded-[var(--radius-full)] bg-primary/10 flex items-center justify-center mx-auto">
                  <BerryLogo size="lg" />
                </div>
                <div>
                  <h2 className="text-3xl font-extrabold text-foreground mt-berry-1">Level {level}</h2>
                  <p className="text-[var(--text-sm)] text-muted-foreground mt-[4px]">
                    {level === 1 ? "Berry Newcomer" : level === 2 ? "Berry Explorer" : "Berry Pro"}
                  </p>
                </div>
                <div className="space-y-berry-1 mt-berry-2">
                  <div className="flex items-center justify-between text-[var(--text-sm)]">
                    <span className="text-muted-foreground">Progress to Level {level + 1}</span>
                    <span className="font-semibold text-primary">{Math.round(progress)}%</span>
                  </div>
                  <BerryProgress value={progress} />
                </div>
              </div>
            </BerryCard>

            <div className="flex items-center justify-between px-berry-1">
              {[1, 2, 3, 4, 5].map((lv) => (
                <div key={lv} className="flex flex-col items-center gap-[4px]">
                  <div className={`w-[40px] h-[40px] rounded-[var(--radius-full)] flex items-center justify-center ${lv <= level ? "bg-primary/15" : "bg-muted"}`}>
                    <BerryLogo size={lv <= level ? "md" : "sm"} className={lv > level ? "opacity-30" : ""} />
                  </div>
                  <span className={`text-[var(--text-xs)] font-medium ${lv <= level ? "text-primary" : "text-muted-foreground"}`}>
                    Lv.{lv}
                  </span>
                </div>
              ))}
            </div>

            <StrawberryDecor variant="divider" />

            <div>
              <h3 className="text-[var(--text-sm)] font-semibold text-muted-foreground mb-berry-1">Your Stats</h3>
              <div className="space-y-berry-1">
                {stats.map((stat, i) => (
                  <BerryCard key={i} className="flex items-center gap-berry-2">
                    <div className="w-[48px] h-[48px] rounded-[var(--radius-md)] bg-primary/10 flex items-center justify-center flex-shrink-0">
                      <stat.icon className="w-6 h-6 text-primary" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <p className="text-[var(--text-sm)] font-semibold text-foreground">{stat.label}</p>
                        <p className="text-[var(--text-sm)] font-bold text-primary">{stat.value}</p>
                      </div>
                      <p className="text-[var(--text-xs)] text-muted-foreground">{stat.desc}</p>
                    </div>
                  </BerryCard>
                ))}
              </div>
            </div>

            <div>
              <div className="flex items-center gap-berry-1 mb-berry-1">
                <TrendingUp className="w-4 h-4 text-primary" />
                <h3 className="text-[var(--text-sm)] font-semibold text-muted-foreground">How to level up</h3>
              </div>
              <BerryCard className="space-y-berry-1">
                {tips.map((tip, i) => (
                  <div key={i} className="flex items-start gap-berry-1">
                    <div className="w-[24px] h-[24px] rounded-[var(--radius-full)] bg-primary/10 flex items-center justify-center flex-shrink-0 mt-[2px]">
                      <BerryLogo size="sm" />
                    </div>
                    <p className="text-[var(--text-sm)] text-foreground">{tip}</p>
                  </div>
                ))}
              </BerryCard>
            </div>
          </>
        )}
      </div>

      <BottomNav />
    </div>
  );
};

export default LevelPage;
