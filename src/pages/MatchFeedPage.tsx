import { useNavigate } from "react-router-dom";
import { useMemo } from "react";
import ProfileCard from "@/components/berry/ProfileCard";
import BerryLogo from "@/components/berry/BerryLogo";
import ThemeToggle from "@/components/berry/ThemeToggle";
import BottomNav from "@/components/berry/BottomNav";
import BerryButton from "@/components/berry/BerryButton";
import { useAuthContext } from "@/features/auth/contexts/AuthContext";
import { useDemoContext } from "@/features/auth/contexts/DemoContext";
import { useMatches } from "@/features/match/hooks/useMatches";
import { computeCompatibility } from "@/features/match/utils/compatibility";

const MatchSkeleton = () => (
  <div className="bg-card rounded-[var(--radius-lg)] border border-border overflow-hidden animate-pulse">
    <div className="aspect-[4/3] bg-muted" />
    <div className="p-berry-3 space-y-berry-2">
      <div className="h-5 bg-muted rounded-[var(--radius-md)] w-1/3" />
      <div className="h-4 bg-muted rounded-[var(--radius-md)] w-2/3" />
      <div className="flex gap-berry-1">
        <div className="h-7 bg-muted rounded-[var(--radius-full)] w-16" />
        <div className="h-7 bg-muted rounded-[var(--radius-full)] w-20" />
      </div>
      <div className="h-10 bg-muted rounded-[var(--radius-md)]" />
    </div>
  </div>
);

const MatchFeedPage = () => {
  const navigate = useNavigate();
  const { authUser, profile } = useAuthContext();
  const demo = useDemoContext();
  const isDemo = demo?.isDemo ?? false;

  const { data: realMatches, isLoading, error } = useMatches(isDemo ? undefined : authUser?.id);
  const matches = isDemo ? demo?.getMatches() ?? [] : realMatches;
  const loading = isDemo ? false : isLoading;

  const me = isDemo ? demo?.demoProfile : profile;

  // Enrich matches with compatibility info, sorted by score (most compatible first)
  const enriched = useMemo(() => {
    if (!matches || !me) return [];
    return matches
      .map((match) => {
        const c = computeCompatibility(
          { interests: me.interests ?? [], age: me.age },
          match.partner
        );
        return { match, score: c.score, reason: match.match_reason || c.reason, shared: c.sharedInterests };
      })
      .sort((a, b) => b.score - a.score);
  }, [matches, me]);

  return (
    <div className="min-h-screen bg-background dark:berry-night-glow pb-[80px]">
      <div className="sticky top-0 z-50 bg-background/80 backdrop-blur-lg border-b border-border">
        <div className="max-w-md mx-auto px-berry-3 py-berry-2 flex items-center justify-between">
          <button onClick={() => navigate("/")} className="flex items-center gap-berry-1 active:scale-95 transition-transform">
            <BerryLogo size="lg" />
            <span className="text-[var(--text-lg)] font-bold berry-gradient-text">berry</span>
          </button>
          <ThemeToggle />
        </div>
      </div>

      <div className="max-w-md mx-auto px-berry-3 py-berry-3 space-y-berry-2">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-[var(--text-lg)] font-bold text-foreground">Your Matches 🍓</h2>
            <p className="text-[var(--text-sm)] text-muted-foreground">
              {loading ? "Loading…" : `${matches?.length ?? 0} mutual connection${matches?.length === 1 ? "" : "s"}`}
            </p>
          </div>
        </div>

        {!isDemo && error && (
          <div className="bg-destructive/10 text-destructive text-[var(--text-sm)] rounded-[var(--radius-md)] px-berry-2 py-berry-2 text-center">
            Something went wrong loading matches. Please try again.
          </div>
        )}

        {loading && (
          <div className="space-y-berry-2">
            {[0, 1, 2].map((i) => <MatchSkeleton key={i} />)}
          </div>
        )}

        {!loading && enriched.length > 0 && (
          <div className="space-y-berry-2">
            {enriched.map(({ match, score, reason, shared }, i) => (
              <div key={match.id} className="animate-fade-in" style={{ animationDelay: `${i * 100}ms` }}>
                <ProfileCard
                  name={match.partner.name}
                  age={match.partner.age}
                  tags={match.partner.interests ?? []}
                  matchReason={reason}
                  compatibility={score}
                  sharedInterests={shared}
                  onChat={() => navigate(`/chat/${match.id}`)}
                />
              </div>
            ))}
          </div>
        )}

        {!loading && (!matches || matches.length === 0) && (
          <div className="text-center py-berry-6 space-y-berry-2 animate-fade-in">
            <div className="w-[72px] h-[72px] rounded-[var(--radius-full)] berry-gradient flex items-center justify-center mx-auto berry-shadow">
              <BerryLogo size="lg" />
            </div>
            <p className="text-[var(--text-base)] font-semibold text-foreground">
              No matches yet 🍓
            </p>
            <p className="text-[var(--text-sm)] text-muted-foreground max-w-[260px] mx-auto">
              Like people you'd love to chat with — when they like you back, you'll match.
            </p>
            <BerryButton onClick={() => navigate("/explore")}>
              Explore People 🍓
            </BerryButton>
          </div>
        )}
      </div>

      <BottomNav />
    </div>
  );
};

export default MatchFeedPage;
