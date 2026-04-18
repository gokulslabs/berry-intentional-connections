import { useNavigate } from "react-router-dom";
import { useEffect } from "react";
import BerryButton from "@/components/berry/BerryButton";
import BerryCard from "@/components/berry/BerryCard";
import PhoneMockup from "@/components/berry/PhoneMockup";
import BerryAvatar from "@/components/berry/BerryAvatar";
import BerryLogo from "@/components/berry/BerryLogo";
import StrawberryDecor from "@/components/berry/StrawberryDecor";
import ThemeToggle from "@/components/berry/ThemeToggle";
import { ArrowRight } from "lucide-react";
import { useAuthContext } from "@/features/auth/contexts/AuthContext";

const features = [
  {
    emoji: "💕",
    title: "Curated Matches",
    desc: "We send you 5–10 high-quality matches daily. No endless scrolling.",
  },
  {
    emoji: "🍓",
    title: "Level System",
    desc: "Earn your level by being a better dater. Higher level = better matches.",
  },
  {
    emoji: "🛡️",
    title: "No Ghosting Culture",
    desc: "Our reputation system rewards effort and accountability.",
  },
];

const MockMatchCard = () => (
  <div className="bg-card rounded-[var(--radius-lg)] p-berry-1 shadow-[var(--shadow-sm)] border border-border mx-berry-1 mb-berry-1">
    <div className="flex items-center gap-berry-1">
      <BerryAvatar name="Sarah M" size="md" />
      <div className="flex-1 min-w-0">
        <p className="font-semibold text-[var(--text-sm)] text-foreground">Sarah, 26</p>
        <p className="text-[var(--text-xs)] text-primary">🍓 Loves hiking too</p>
      </div>
    </div>
    <div className="flex gap-[6px] mt-berry-1">
      <span className="text-[var(--text-xs)] bg-muted px-berry-1 py-[4px] rounded-[var(--radius-full)] text-muted-foreground">Travel</span>
      <span className="text-[var(--text-xs)] bg-muted px-berry-1 py-[4px] rounded-[var(--radius-full)] text-muted-foreground">Coffee</span>
      <span className="text-[var(--text-xs)] bg-muted px-berry-1 py-[4px] rounded-[var(--radius-full)] text-muted-foreground">Art</span>
    </div>
  </div>
);

const LandingPage = () => {
  const navigate = useNavigate();
  const { authUser, profile, loading, profileLoading } = useAuthContext();

  // Auto-redirect authenticated users (handles email verification redirect to "/")
  useEffect(() => {
    if (!loading && !profileLoading && authUser) {
      navigate(profile ? "/matches" : "/onboarding", { replace: true });
    }
  }, [loading, profileLoading, authUser, profile, navigate]);

  // Show loading while checking auth after email verification redirect
  if (loading || profileLoading) {
    const hash = window.location.hash;
    if (hash.includes("access_token") || hash.includes("type=signup")) {
      return (
        <div className="min-h-screen bg-background flex flex-col items-center justify-center gap-berry-2">
          <BerryLogo size="lg" className="animate-pulse" />
          <p className="text-[var(--text-base)] font-semibold text-foreground">Verifying your account 🍓</p>
          <p className="text-[var(--text-sm)] text-muted-foreground">Logging you in…</p>
        </div>
      );
    }
  }

  return (
    <div className="min-h-screen bg-background dark:berry-night-glow">
      {/* Nav */}
      <nav className="sticky top-0 z-50 bg-background/80 backdrop-blur-lg border-b border-border">
        <div className="max-w-6xl mx-auto px-berry-3 py-berry-2 flex items-center justify-between">
          <button onClick={() => navigate("/")} className="flex items-center gap-berry-1 active:scale-95 transition-transform">
            <BerryLogo size="lg" />
            <span className="text-[var(--text-lg)] font-bold berry-gradient-text">berry</span>
          </button>
          <div className="flex items-center gap-berry-1">
            <ThemeToggle />
            <BerryButton size="sm" onClick={() => navigate("/onboarding")} className="whitespace-nowrap">
              <span className="hidden sm:inline">Apply to Join</span>
              <span className="sm:hidden">Join 🍓</span>
            </BerryButton>
          </div>
        </div>
      </nav>

      {/* Hero */}
      <section className="relative max-w-6xl mx-auto px-berry-3 py-berry-6 md:py-[96px]">
        <StrawberryDecor variant="scatter" />
        <div className="relative flex flex-col md:flex-row items-center gap-berry-6 md:gap-[64px]">
          <div className="flex-1 text-center md:text-left space-y-berry-3 animate-fade-in">
            <div className="flex items-center gap-berry-1 justify-center md:justify-start">
              <BerryLogo size="lg" />
              <span className="text-[var(--text-sm)] font-semibold text-primary bg-primary/10 px-berry-1 py-[4px] rounded-[var(--radius-full)]">
                Now in beta
              </span>
            </div>
            <h2 className="text-4xl md:text-5xl lg:text-6xl font-extrabold text-foreground leading-tight">
              Meet people who{" "}
              <span className="berry-gradient-text">actually try.</span>
            </h2>
            <p className="text-[var(--text-base)] text-muted-foreground max-w-md mx-auto md:mx-0 leading-relaxed">
              No endless swipes. Just meaningful matches with people who put in effort.
            </p>
            <div className="flex flex-col sm:flex-row gap-berry-1 justify-center md:justify-start">
              <BerryButton size="lg" onClick={() => navigate("/onboarding")}>
                Apply to Join Berry <ArrowRight className="w-5 h-5 ml-berry-1" />
              </BerryButton>
              <BerryButton variant="secondary" size="lg" onClick={() => navigate("/matches")}>
                See How It Works
              </BerryButton>
            </div>
          </div>

          <div className="flex-shrink-0 animate-slide-up">
            <PhoneMockup>
              <div className="p-berry-1">
                <div className="flex items-center justify-between mb-berry-2 px-berry-1">
                  <div className="flex items-center gap-[6px]">
                    <BerryLogo size="sm" />
                    <p className="font-bold text-[var(--text-sm)] text-foreground">Your Matches</p>
                  </div>
                  <span className="text-[var(--text-xs)] text-primary font-medium">3 new</span>
                </div>
                <MockMatchCard />
                <MockMatchCard />
                <MockMatchCard />
              </div>
            </PhoneMockup>
          </div>
        </div>
      </section>

      {/* Divider */}
      <StrawberryDecor variant="divider" className="max-w-6xl mx-auto px-berry-3" />

      {/* Features */}
      <section className="max-w-6xl mx-auto px-berry-3 py-berry-6">
        <h3 className="text-2xl md:text-3xl font-bold text-center text-foreground mb-berry-6">
          Why Berry is different
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-berry-3">
          {features.map((f, i) => (
            <BerryCard key={i} className="text-center space-y-berry-2 animate-fade-in" style={{ animationDelay: `${i * 100}ms` } as React.CSSProperties}>
              <div className="w-[56px] h-[56px] rounded-[var(--radius-lg)] bg-primary/10 flex items-center justify-center mx-auto">
                <span className="text-2xl">{f.emoji}</span>
              </div>
              <h4 className="text-[var(--text-lg)] font-bold text-foreground">{f.title}</h4>
              <p className="text-[var(--text-sm)] text-muted-foreground leading-relaxed">{f.desc}</p>
            </BerryCard>
          ))}
        </div>
      </section>

      {/* CTA */}
      <section className="max-w-6xl mx-auto px-berry-3 py-berry-6 text-center">
        <BerryCard className="berry-gradient p-berry-4 md:p-berry-6 border-0 relative overflow-hidden">
          <StrawberryDecor variant="corner" className="-top-8 -right-8" />
          <StrawberryDecor variant="corner" className="-bottom-8 -left-8 rotate-180" />
          <div className="relative">
            <div className="flex justify-center mb-berry-2">
              <BerryLogo size="lg" className="drop-shadow-lg" />
            </div>
            <h3 className="text-2xl md:text-3xl font-bold text-primary-foreground mb-berry-1">
              Ready to date differently?
            </h3>
            <p className="text-primary-foreground/80 mb-berry-3 max-w-md mx-auto text-[var(--text-base)]">
              Join the waitlist and be among the first to experience Berry.
            </p>
            <BerryButton variant="secondary" size="lg" onClick={() => navigate("/onboarding")}>
              Join the Waitlist 🍓
            </BerryButton>
          </div>
        </BerryCard>
      </section>

      {/* Footer */}
      <footer className="max-w-6xl mx-auto px-berry-3 py-berry-4 text-center border-t border-border">
        <div className="flex items-center justify-center gap-berry-1">
          <BerryLogo size="sm" />
          <p className="text-[var(--text-sm)] text-muted-foreground">
            © 2026 Berry. Made with love for people who actually try.
          </p>
        </div>
      </footer>
    </div>
  );
};

export default LandingPage;
