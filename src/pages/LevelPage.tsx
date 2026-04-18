import { useNavigate } from "react-router-dom";
import BerryCard from "@/components/berry/BerryCard";
import StrawberryDecor from "@/components/berry/StrawberryDecor";
import BerryLogo from "@/components/berry/BerryLogo";
import BottomNav from "@/components/berry/BottomNav";
import LevelRing from "@/components/berry/LevelRing";
import AchievementBadge from "@/components/berry/AchievementBadge";
import { ArrowLeft, MessageCircle, Zap, Heart, TrendingUp } from "lucide-react";
import { useAuthContext } from "@/features/auth/contexts/AuthContext";
import { useMatches } from "@/features/match/hooks/useMatches";

const tips = [
  "Respond to matches within 24 hours",
  "Ask thoughtful follow-up questions",
  "Share genuine stories about yourself",
  "Be respectful of others' boundaries",
];

const LevelSkeleton = () => (
  <div className="space-y-berry-3 animate-pulse">
    <div className="bg-card rounded-[var(--radius-lg)] border border-border p-berry-3 h-64" />
    <div className="grid grid-cols-4 gap-berry-1">
      {[1, 2, 3, 4].map((i) => (
        <div key={i} className="bg-card rounded-[var(--radius-md)] border border-border h-24" />
      ))}
    </div>
  </div>
);

const LevelPage = () => {
  const navigate = useNavigate();
  const { authUser, profile, profileLoading } = useAuthContext();
  const { data: matches } = useMatches(authUser?.id);

  const level = profile?.level ?? 1;
  const responseRate = profile?.response_rate ?? 0;
  const matchCount = matches?.length ?? 0;
  const progress = Math.min((responseRate * 0.5 + level * 15), 100);

  const stats = [
    { icon: MessageCircle, label: "Response Rate", value: `${Math.round(responseRate)}%`, desc: "How often you reply" },
    { icon: Heart, label: "Matches", value: String(matchCount), desc: "People you've connected with" },
    { icon: Zap, label: "Conversation Quality", value: level >= 3 ? "Great" : "—", desc: "Keep chatting to unlock" },
  ];

  const achievements = [
    { emoji: "🍓", label: "First Match", earned: matchCount >= 1, description: "Made your first connection" },
    { emoji: "💬", label: "Conversationalist", earned: matchCount >= 3, description: "3+ matches" },
    { emoji: "⚡", label: "Quick Replier", earned: responseRate >= 80, description: "80%+ response rate" },
    { emoji: "🌟", label: "Berry Pro", earned: level >= 3, description: "Reached level 3" },
    { emoji: "🔥", label: "On Fire", earned: matchCount >= 5, description: "5+ matches" },
    { emoji: "💎", label: "Legend", earned: level >= 5, description: "Reached max level" },
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
            <BerryCard className="text-center space-y-berry-2 relative overflow-hidden animate-scale-in">
              <StrawberryDecor variant="corner" className="-top-6 -right-6" />
              <StrawberryDecor variant="corner" className="-bottom-6 -left-6 rotate-180" />
              <div className="relative flex flex-col items-center gap-berry-2">
                <LevelRing level={level} progress={progress} />
                <div className="space-y-berry-1 w-full">
                  <div className="flex items-center justify-between text-[var(--text-sm)]">
                    <span className="text-muted-foreground">Progress to Level {level + 1}</span>
                    <span className="font-semibold text-primary">{Math.round(progress)}%</span>
                  </div>
                  <div className="h-2 bg-muted rounded-[var(--radius-full)] overflow-hidden">
                    <div
                      className="h-full berry-gradient rounded-[var(--radius-full)] transition-all duration-1000 ease-out"
                      style={{ width: `${progress}%` }}
                    />
                  </div>
                </div>
              </div>
            </BerryCard>

            {/* Achievements */}
            <div>
              <div className="flex items-center gap-berry-1 mb-berry-1">
                <span className="text-lg">🏆</span>
                <h3 className="text-[var(--text-sm)] font-semibold text-muted-foreground">Achievements</h3>
                <span className="ml-auto text-[var(--text-xs)] text-primary font-semibold">
                  {achievements.filter((a) => a.earned).length}/{achievements.length}
                </span>
              </div>
              <div className="grid grid-cols-3 gap-berry-1">
                {achievements.map((a, i) => (
                  <div key={a.label} className="animate-fade-in" style={{ animationDelay: `${i * 60}ms` }}>
                    <AchievementBadge {...a} />
                  </div>
                ))}
              </div>
            </div>

            <StrawberryDecor variant="divider" />

            {/* Stats */}
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

            {/* Tips */}
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
