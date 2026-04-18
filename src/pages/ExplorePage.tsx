import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import BerryLogo from "@/components/berry/BerryLogo";
import ThemeToggle from "@/components/berry/ThemeToggle";
import BottomNav from "@/components/berry/BottomNav";
import BerryCard from "@/components/berry/BerryCard";
import BerryTag from "@/components/berry/BerryTag";
import BerryAvatar from "@/components/berry/BerryAvatar";
import CompatibilityRing from "@/components/berry/CompatibilityRing";
import MatchCelebration from "@/components/berry/MatchCelebration";
import { Heart, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { useAuthContext } from "@/features/auth/contexts/AuthContext";
import { useDemoContext } from "@/features/auth/contexts/DemoContext";
import { useExploreCandidates } from "@/features/match/hooks/useExploreCandidates";
import { useSendLike } from "@/features/match/hooks/useSendLike";
import { computeCompatibility } from "@/features/match/utils/compatibility";
import { toast } from "@/hooks/use-toast";
import type { UserProfile } from "@/types/database";

const ExploreSkeleton = () => (
  <div className="bg-card rounded-[var(--radius-lg)] border border-border overflow-hidden animate-pulse">
    <div className="aspect-[4/5] bg-muted" />
    <div className="p-berry-3 space-y-berry-2">
      <div className="h-5 bg-muted rounded-[var(--radius-md)] w-1/3" />
      <div className="flex gap-berry-1">
        <div className="h-7 bg-muted rounded-[var(--radius-full)] w-16" />
        <div className="h-7 bg-muted rounded-[var(--radius-full)] w-20" />
      </div>
    </div>
  </div>
);

interface ScoredCandidate {
  user: UserProfile;
  score: number;
  reason: string;
  shared: string[];
}

interface CandidateCardProps {
  data: ScoredCandidate;
  myInterests: string[];
  onLike: () => void;
  onPass: () => void;
  busy: boolean;
}

const CandidateCard = ({ data, myInterests, onLike, onPass, busy }: CandidateCardProps) => {
  const { user, score, reason, shared } = data;
  const sharedSet = new Set(shared);

  return (
    <BerryCard className="overflow-hidden p-0 relative">
      <div className="relative aspect-[4/5] bg-muted overflow-hidden">
        <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-muted to-card">
          <BerryAvatar name={user.name} size="xl" />
        </div>

        {/* Compatibility ring */}
        <div className="absolute top-berry-2 right-berry-2 bg-card/90 backdrop-blur-md rounded-[var(--radius-full)] p-[3px] shadow-[var(--shadow-md)]">
          <CompatibilityRing score={score} size={56} label="Match" />
        </div>

        {/* Level badge */}
        <div className="absolute top-berry-2 left-berry-2 bg-card/90 backdrop-blur-md rounded-[var(--radius-full)] px-berry-1 py-[4px] flex items-center gap-[4px] shadow-[var(--shadow-md)]">
          <BerryLogo size="sm" />
          <span className="text-[var(--text-xs)] font-bold text-foreground">Lv.{user.level}</span>
        </div>

        {/* Bottom info gradient */}
        <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent p-berry-3 pt-berry-6">
          <h3 className="text-2xl font-extrabold text-white drop-shadow-md">
            {user.name}, {user.age}
          </h3>
          {user.bio && (
            <p className="text-[var(--text-xs)] text-white/85 line-clamp-2 mt-[2px] leading-snug">
              {user.bio}
            </p>
          )}
        </div>
      </div>

      <div className="p-berry-3 space-y-berry-2">
        {/* Reason chip */}
        <div className="bg-primary/8 border border-primary/15 rounded-[var(--radius-md)] px-berry-2 py-berry-1 flex items-start gap-berry-1">
          <BerryLogo size="sm" className="flex-shrink-0 mt-[1px]" />
          <p className="text-[var(--text-xs)] font-medium text-foreground leading-snug">{reason}</p>
        </div>

        {/* Interests with shared highlighted */}
        {(user.interests?.length ?? 0) > 0 && (
          <div className="flex flex-wrap gap-berry-1">
            {user.interests.map((tag) => (
              <BerryTag key={tag} label={tag} active={sharedSet.has(tag)} />
            ))}
          </div>
        )}

        {/* Pass / Like buttons */}
        <div className="flex items-center gap-berry-2 pt-berry-1">
          <button
            onClick={onPass}
            disabled={busy}
            aria-label="Pass"
            className={cn(
              "w-14 h-14 rounded-[var(--radius-full)] bg-card border-2 border-border",
              "flex items-center justify-center text-muted-foreground",
              "active:scale-90 transition-all duration-200 shadow-[var(--shadow-sm)]",
              "hover:border-destructive/30 hover:text-destructive",
              "disabled:opacity-50 disabled:pointer-events-none"
            )}
          >
            <X className="w-6 h-6" strokeWidth={2.5} />
          </button>
          <button
            onClick={onLike}
            disabled={busy}
            aria-label="Like"
            className={cn(
              "flex-1 h-14 rounded-[var(--radius-full)] berry-gradient text-primary-foreground",
              "flex items-center justify-center gap-berry-1 font-semibold",
              "active:scale-[0.97] transition-all duration-200 berry-shadow hover:berry-shadow-lg",
              "disabled:opacity-50 disabled:pointer-events-none"
            )}
          >
            <Heart className="w-5 h-5 fill-primary-foreground" />
            <span>Like</span>
          </button>
        </div>
      </div>
    </BerryCard>
  );
};

const ExplorePage = () => {
  const navigate = useNavigate();
  const { authUser, profile } = useAuthContext();
  const demo = useDemoContext();
  const isDemo = demo?.isDemo ?? false;

  const { data: candidates, isLoading } = useExploreCandidates(
    isDemo ? undefined : authUser?.id
  );
  const sendLike = useSendLike();

  const [passedIds, setPassedIds] = useState<Set<string>>(new Set());
  const [celebration, setCelebration] = useState<{
    open: boolean;
    themName: string;
    matchId: string | null;
  }>({ open: false, themName: "", matchId: null });

  const me = isDemo ? demo?.demoProfile : profile;

  // Score, sort, and filter candidates
  const scored: ScoredCandidate[] = useMemo(() => {
    if (!me || !candidates) return [];
    return candidates
      .filter((u) => !passedIds.has(u.id))
      .map((user) => {
        const c = computeCompatibility(
          { interests: me.interests ?? [], age: me.age },
          user
        );
        return { user, score: c.score, reason: c.reason, shared: c.sharedInterests };
      })
      .sort((a, b) => b.score - a.score);
  }, [candidates, me, passedIds]);

  const handlePass = (id: string) => {
    setPassedIds((prev) => new Set(prev).add(id));
  };

  const handleLike = async (candidate: ScoredCandidate) => {
    if (!authUser?.id || isDemo) {
      // Demo fallback: always celebrate on like
      if (isDemo) {
        setCelebration({ open: true, themName: candidate.user.name, matchId: null });
      }
      setPassedIds((prev) => new Set(prev).add(candidate.user.id));
      return;
    }
    try {
      const res = await sendLike.mutateAsync({
        likerId: authUser.id,
        likedId: candidate.user.id,
      });
      setPassedIds((prev) => new Set(prev).add(candidate.user.id));
      if (res.isMutual) {
        setCelebration({ open: true, themName: candidate.user.name, matchId: res.matchId });
      } else {
        toast({
          title: "Like sent 💕",
          description: `If ${candidate.user.name} likes back, you'll match.`,
        });
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : "Could not send like";
      toast({ title: "Oops", description: message, variant: "destructive" });
    }
  };

  return (
    <div className="min-h-screen bg-background dark:berry-night-glow pb-[80px]">
      <div className="sticky top-0 z-40 bg-background/80 backdrop-blur-lg border-b border-border">
        <div className="max-w-md mx-auto px-berry-3 py-berry-2 flex items-center justify-between">
          <button onClick={() => navigate("/")} className="flex items-center gap-berry-1 active:scale-95 transition-transform">
            <BerryLogo size="lg" />
            <span className="text-[var(--text-lg)] font-bold berry-gradient-text">berry</span>
          </button>
          <ThemeToggle />
        </div>
      </div>

      <div className="max-w-md mx-auto px-berry-3 py-berry-3 space-y-berry-2">
        <div>
          <h2 className="text-[var(--text-lg)] font-bold text-foreground">Explore</h2>
          <p className="text-[var(--text-sm)] text-muted-foreground">
            {isLoading
              ? "Finding people for you…"
              : scored.length > 0
                ? `${scored.length} people sorted by compatibility`
                : "All caught up!"}
          </p>
        </div>

        {isLoading && (
          <div className="space-y-berry-2">
            {[0, 1, 2].map((i) => <ExploreSkeleton key={i} />)}
          </div>
        )}

        {!isLoading && scored.length > 0 && (
          <div className="space-y-berry-3">
            {scored.map((data, i) => (
              <div key={data.user.id} className="animate-fade-in" style={{ animationDelay: `${i * 60}ms` }}>
                <CandidateCard
                  data={data}
                  myInterests={me?.interests ?? []}
                  onLike={() => handleLike(data)}
                  onPass={() => handlePass(data.user.id)}
                  busy={sendLike.isPending}
                />
              </div>
            ))}
          </div>
        )}

        {!isLoading && scored.length === 0 && (
          <div className="text-center py-berry-6 space-y-berry-2 animate-fade-in">
            <div className="w-[72px] h-[72px] rounded-[var(--radius-full)] berry-gradient flex items-center justify-center mx-auto berry-shadow">
              <BerryLogo size="lg" />
            </div>
            <p className="text-[var(--text-base)] font-semibold text-foreground">
              You've seen everyone for now 🍓
            </p>
            <p className="text-[var(--text-sm)] text-muted-foreground max-w-[260px] mx-auto">
              Check back later — new berries join every day!
            </p>
          </div>
        )}
      </div>

      <MatchCelebration
        open={celebration.open}
        meName={me?.name ?? "You"}
        themName={celebration.themName}
        onChat={() => {
          if (celebration.matchId) navigate(`/chat/${celebration.matchId}`);
          else navigate("/matches");
          setCelebration({ open: false, themName: "", matchId: null });
        }}
        onClose={() => setCelebration({ open: false, themName: "", matchId: null })}
      />

      <BottomNav />
    </div>
  );
};

export default ExplorePage;
