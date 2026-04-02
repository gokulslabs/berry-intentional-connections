import { useState } from "react";
import { useNavigate } from "react-router-dom";
import BerryButton from "@/components/berry/BerryButton";
import BerryTag from "@/components/berry/BerryTag";
import BerryAvatar from "@/components/berry/BerryAvatar";
import BerryLogo from "@/components/berry/BerryLogo";
import BottomNav from "@/components/berry/BottomNav";
import { LogOut, Pencil, X } from "lucide-react";
import { useAuthContext } from "@/features/auth/contexts/AuthContext";
import { useDemoContext } from "@/features/auth/contexts/DemoContext";
import { authService } from "@/features/auth/services/authService";
import { userService } from "@/features/user/services/userService";
import { toast } from "@/hooks/use-toast";

const interestOptions = [
  "Hiking", "Coffee", "Photography", "Travel", "Design", "Music",
  "Art", "Cooking", "Yoga", "Books", "Gaming", "Fitness",
  "Anime", "Movies", "Dancing", "Writing",
];

const ProfileSkeleton = () => (
  <div className="space-y-berry-3 animate-pulse">
    <div className="flex flex-col items-center space-y-berry-2">
      <div className="w-[96px] h-[96px] rounded-[var(--radius-full)] bg-muted" />
      <div className="h-6 bg-muted rounded-[var(--radius-md)] w-32" />
      <div className="h-4 bg-muted rounded-[var(--radius-md)] w-24" />
    </div>
    <div className="bg-card rounded-[var(--radius-lg)] p-berry-3 border border-border h-24" />
    <div className="grid grid-cols-3 gap-berry-1">
      {[0, 1, 2].map((i) => (
        <div key={i} className="bg-card rounded-[var(--radius-lg)] p-berry-2 border border-border h-16" />
      ))}
    </div>
  </div>
);

const ProfilePage = () => {
  const navigate = useNavigate();
  const { profile: realProfile, profileLoading, refreshProfile } = useAuthContext();
  const demo = useDemoContext();
  const isDemo = demo?.isDemo ?? false;
  const profile = isDemo ? demo?.demoProfile : realProfile;
  const loading = isDemo ? false : profileLoading;

  const [editing, setEditing] = useState(false);
  const [editName, setEditName] = useState("");
  const [editBio, setEditBio] = useState("");
  const [editInterests, setEditInterests] = useState<string[]>([]);
  const [saving, setSaving] = useState(false);

  const startEditing = () => {
    if (!profile) return;
    setEditName(profile.name);
    setEditBio(profile.bio || "");
    setEditInterests([...profile.interests]);
    setEditing(true);
  };

  const toggleInterest = (tag: string) => {
    setEditInterests((prev) =>
      prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag]
    );
  };

  const handleSave = async () => {
    if (!editName.trim()) return;
    setSaving(true);
    if (isDemo) {
      // demo mode: just close
      setEditing(false);
      setSaving(false);
      toast({ title: "Profile updated 🍓", description: "Changes saved (demo mode)" });
      return;
    }
    const userId = realProfile?.id;
    if (!userId) return;
    const { error } = await userService.updateUserProfile(userId, {
      name: editName.trim(),
      bio: editBio.trim(),
      interests: editInterests,
    });
    setSaving(false);
    if (error) {
      toast({ title: "Oops", description: error, variant: "destructive" });
    } else {
      await refreshProfile();
      setEditing(false);
      toast({ title: "Profile updated 🍓", description: "Looking great!" });
    }
  };

  const handleLogout = async () => {
    if (isDemo) {
      demo?.exitDemo();
      navigate("/login");
      return;
    }
    await authService.signOut();
    navigate("/login");
  };

  return (
    <div className="min-h-screen bg-background dark:berry-night-glow pb-[80px]">
      <div className="sticky top-0 z-50 bg-background/80 backdrop-blur-lg">
        <div className="max-w-md mx-auto px-berry-3 py-berry-2 flex items-center justify-between">
          <button onClick={() => navigate("/")} className="flex items-center gap-berry-1 active:scale-95 transition-transform">
            <BerryLogo size="lg" />
            <span className="text-[var(--text-lg)] font-bold berry-gradient-text">berry</span>
          </button>
          <h1 className="text-[var(--text-lg)] font-bold text-foreground">Profile</h1>
          <button
            onClick={handleLogout}
            className="w-[40px] h-[40px] rounded-[var(--radius-md)] bg-muted flex items-center justify-center text-muted-foreground active:scale-95 transition-transform"
            title={isDemo ? "Exit demo" : "Log out"}
          >
            <LogOut className="w-5 h-5" />
          </button>
        </div>
      </div>

      <div className="max-w-md mx-auto px-berry-3 py-berry-3 space-y-berry-3">
        {isDemo && (
          <div className="bg-primary/10 border border-primary/20 rounded-[var(--radius-md)] px-berry-2 py-berry-1 flex items-center gap-berry-1">
            <BerryLogo size="sm" />
            <p className="text-[var(--text-xs)] text-primary font-medium flex-1">Demo mode — this is a sample profile</p>
          </div>
        )}

        {loading && <ProfileSkeleton />}

        {!loading && profile && !editing && (
          <>
            <div className="flex flex-col items-center space-y-berry-2">
              <div className="relative">
                <BerryAvatar name={profile.name} size="xl" />
                <div className="absolute -bottom-1 -right-1 bg-card rounded-[var(--radius-full)] p-[2px] shadow-[var(--shadow-sm)]">
                  <div className="berry-gradient rounded-[var(--radius-full)] px-berry-1 py-[4px] flex items-center gap-[4px] berry-shadow">
                    <BerryLogo size="sm" />
                    <span className="text-[var(--text-xs)] font-bold text-primary-foreground">Lv. {profile.level}</span>
                  </div>
                </div>
              </div>
              <div className="text-center">
                <h2 className="text-2xl font-bold text-foreground">{profile.name}, {profile.age}</h2>
              </div>
            </div>

            <div className="bg-card rounded-[var(--radius-lg)] p-berry-3 border border-border shadow-[var(--shadow-sm)]">
              <h3 className="text-[var(--text-sm)] font-semibold text-muted-foreground mb-berry-1">About</h3>
              <p className="text-foreground leading-relaxed text-[var(--text-base)]">
                {profile.bio || (
                  <span className="text-muted-foreground italic">Your profile is your first impression — add a bio that shows who you really are ✨</span>
                )}
              </p>
            </div>

            {(profile.interests?.length ?? 0) > 0 && (
              <div>
                <h3 className="text-[var(--text-sm)] font-semibold text-muted-foreground mb-berry-1">Interests</h3>
                <div className="flex flex-wrap gap-berry-1">
                  {profile.interests.map((tag) => (
                    <BerryTag key={tag} label={tag} active />
                  ))}
                </div>
              </div>
            )}

            <div className="grid grid-cols-3 gap-berry-1">
              {[
                { label: "Level", value: String(profile.level), icon: true },
                { label: "Response", value: `${Math.round(profile.response_rate)}%` },
                { label: "Joined", value: new Date(profile.created_at).toLocaleDateString([], { month: "short", year: "numeric" }) },
              ].map((stat) => (
                <div key={stat.label} className="bg-card rounded-[var(--radius-lg)] p-berry-2 text-center border border-border shadow-[var(--shadow-sm)]">
                  <div className="flex items-center justify-center gap-[4px]">
                    {'icon' in stat && stat.icon && <BerryLogo size="sm" />}
                    <p className="text-[var(--text-lg)] font-bold text-foreground">{stat.value}</p>
                  </div>
                  <p className="text-[var(--text-xs)] text-muted-foreground">{stat.label}</p>
                </div>
              ))}
            </div>

            <BerryButton fullWidth onClick={startEditing}>
              <Pencil className="w-4 h-4 mr-2" /> Edit Profile
            </BerryButton>
            <BerryButton fullWidth variant="outline" onClick={() => navigate("/level")}>
              View Level Details
            </BerryButton>
          </>
        )}

        {!loading && profile && editing && (
          <div className="space-y-berry-3 animate-fade-in">
            <div className="flex items-center justify-between">
              <h2 className="text-[var(--text-lg)] font-bold text-foreground">Edit Profile</h2>
              <button
                onClick={() => setEditing(false)}
                className="w-[36px] h-[36px] rounded-[var(--radius-md)] bg-muted flex items-center justify-center text-muted-foreground active:scale-95 transition-transform"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-berry-1">
              <label className="text-[var(--text-sm)] font-semibold text-muted-foreground">Name</label>
              <input
                value={editName}
                onChange={(e) => setEditName(e.target.value)}
                maxLength={50}
                className="w-full rounded-[var(--radius-md)] border border-border bg-card px-berry-2 py-[12px] text-[var(--text-base)] text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary/50 transition-all duration-200 shadow-[var(--shadow-sm)]"
              />
            </div>

            <div className="space-y-berry-1">
              <label className="text-[var(--text-sm)] font-semibold text-muted-foreground">Bio</label>
              <textarea
                value={editBio}
                onChange={(e) => setEditBio(e.target.value)}
                maxLength={300}
                rows={4}
                placeholder="Tell people about yourself…"
                className="w-full rounded-[var(--radius-md)] border border-border bg-card px-berry-2 py-[12px] text-[var(--text-base)] text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary/50 transition-all duration-200 shadow-[var(--shadow-sm)] resize-none"
              />
              <p className="text-[var(--text-xs)] text-muted-foreground text-right">{editBio.length}/300</p>
            </div>

            <div className="space-y-berry-1">
              <label className="text-[var(--text-sm)] font-semibold text-muted-foreground">Interests</label>
              <div className="flex flex-wrap gap-berry-1">
                {interestOptions.map((tag) => (
                  <BerryTag
                    key={tag}
                    label={tag}
                    active={editInterests.includes(tag)}
                    onClick={() => toggleInterest(tag)}
                  />
                ))}
              </div>
            </div>

            <div className="flex gap-berry-1">
              <BerryButton fullWidth variant="secondary" onClick={() => setEditing(false)}>
                Cancel
              </BerryButton>
              <BerryButton fullWidth onClick={handleSave} disabled={saving || !editName.trim()}>
                {saving ? "Saving…" : "Save Changes"}
              </BerryButton>
            </div>
          </div>
        )}

        {!loading && !profile && (
          <div className="text-center py-berry-6 space-y-berry-2 animate-fade-in">
            <div className="w-[72px] h-[72px] rounded-[var(--radius-full)] berry-gradient flex items-center justify-center mx-auto berry-shadow">
              <BerryLogo size="lg" />
            </div>
            <div className="space-y-[4px]">
              <p className="text-[var(--text-base)] font-semibold text-foreground">Your profile is your first impression 🍓</p>
              <p className="text-[var(--text-sm)] text-muted-foreground max-w-[260px] mx-auto leading-relaxed">
                Set up your profile so others can get to know the real you.
              </p>
            </div>
            <BerryButton onClick={() => navigate("/onboarding")}>Create Your Profile</BerryButton>
          </div>
        )}
      </div>

      <BottomNav />
    </div>
  );
};

export default ProfilePage;
