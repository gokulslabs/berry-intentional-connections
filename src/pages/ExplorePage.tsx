import { useNavigate } from "react-router-dom";
import BerryLogo from "@/components/berry/BerryLogo";
import ThemeToggle from "@/components/berry/ThemeToggle";
import BottomNav from "@/components/berry/BottomNav";
import BerryCard from "@/components/berry/BerryCard";
import BerryTag from "@/components/berry/BerryTag";
import BerryButton from "@/components/berry/BerryButton";
import BerryAvatar from "@/components/berry/BerryAvatar";
import { useAuthContext } from "@/features/auth/contexts/AuthContext";
import { useDemoContext } from "@/features/auth/contexts/DemoContext";
import { useExploreCandidates } from "@/features/match/hooks/useExploreCandidates";
import { useCreateMatch } from "@/features/match/hooks/useMatches";
import { toast } from "@/hooks/use-toast";
import type { UserProfile } from "@/types/database";

const ExploreSkeleton = () => (
  <div className="bg-card rounded-[var(--radius-lg)] border border-border overflow-hidden animate-pulse">
    <div className="aspect-[4/3] bg-muted" />
    <div className="p-berry-3 space-y-berry-2">
      <div className="h-5 bg-muted rounded-[var(--radius-md)] w-1/3" />
      <div className="flex gap-berry-1">
        <div className="h-7 bg-muted rounded-[var(--radius-full)] w-16" />
        <div className="h-7 bg-muted rounded-[var(--radius-full)] w-20" />
      </div>
      <div className="h-10 bg-muted rounded-[var(--radius-md)]" />
    </div>
  </div>
);

interface UserCardProps {
  user: UserProfile;
  onMatch: () => void;
  isMatching: boolean;
}

const UserCard = ({ user, onMatch, isMatching }: UserCardProps) => (
  <BerryCard className="overflow-hidden p-0">
    <div className="aspect-[4/3] bg-muted overflow-hidden">
      <div className="w-full h-full flex items-center justify-center">
        <BerryAvatar name={user.name} size="xl" />
      </div>
    </div>
    <div className="p-berry-3 space-y-berry-1">
      <h3 className="text-[var(--text-lg)] font-bold text-foreground">
        {user.name}, {user.age}
      </h3>
      {user.bio && (
        <p className="text-[var(--text-sm)] text-muted-foreground line-clamp-2">{user.bio}</p>
      )}
      <div className="flex flex-wrap gap-berry-1">
        {(user.interests ?? []).map((tag) => (
          <BerryTag key={tag} label={tag} />
        ))}
      </div>
      <BerryButton fullWidth onClick={onMatch} disabled={isMatching}>
        {isMatching ? "Matching…" : "Match 🍓"}
      </BerryButton>
    </div>
  </BerryCard>
);

const ExplorePage = () => {
  const navigate = useNavigate();
  const { authUser } = useAuthContext();
  const demo = useDemoContext();
  const isDemo = demo?.isDemo ?? false;

  const { data: candidates, isLoading } = useExploreCandidates(
    isDemo ? undefined : authUser?.id
  );
  const createMatch = useCreateMatch();

  const handleMatch = async (candidateId: string) => {
    if (!authUser?.id) return;
    try {
      await createMatch.mutateAsync({ user1Id: authUser.id, user2Id: candidateId });
      toast({ title: "It's a match! 🍓", description: "Head to your matches to start chatting." });
    } catch (err: any) {
      toast({ title: "Oops", description: err.message || "Could not create match", variant: "destructive" });
    }
  };

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
        <div>
          <h2 className="text-[var(--text-lg)] font-bold text-foreground">Explore</h2>
          <p className="text-[var(--text-sm)] text-muted-foreground">
            {isLoading ? "Loading…" : `${candidates?.length ?? 0} people to discover`}
          </p>
        </div>

        {isLoading && (
          <div className="space-y-berry-2">
            {[0, 1, 2].map((i) => <ExploreSkeleton key={i} />)}
          </div>
        )}

        {!isLoading && candidates && candidates.length > 0 && (
          <div className="space-y-berry-2">
            {candidates.map((user, i) => (
              <div key={user.id} className="animate-fade-in" style={{ animationDelay: `${i * 80}ms` }}>
                <UserCard
                  user={user}
                  onMatch={() => handleMatch(user.id)}
                  isMatching={createMatch.isPending}
                />
              </div>
            ))}
          </div>
        )}

        {!isLoading && (!candidates || candidates.length === 0) && (
          <div className="text-center py-berry-6 space-y-berry-2 animate-fade-in">
            <div className="w-[72px] h-[72px] rounded-[var(--radius-full)] berry-gradient flex items-center justify-center mx-auto berry-shadow">
              <BerryLogo size="lg" />
            </div>
            <p className="text-[var(--text-base)] font-semibold text-foreground">
              No new people right now 🍓
            </p>
            <p className="text-[var(--text-sm)] text-muted-foreground max-w-[260px] mx-auto">
              Check back later — new users join every day!
            </p>
          </div>
        )}
      </div>

      <BottomNav />
    </div>
  );
};

export default ExplorePage;
