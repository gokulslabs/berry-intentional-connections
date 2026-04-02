import { useState } from "react";
import { useNavigate, Navigate } from "react-router-dom";
import BerryButton from "@/components/berry/BerryButton";
import BerryCard from "@/components/berry/BerryCard";
import BerryTag from "@/components/berry/BerryTag";
import BerryProgress from "@/components/berry/BerryProgress";
import BerryInput from "@/components/berry/BerryInput";
import StrawberryDecor from "@/components/berry/StrawberryDecor";
import BerryLogo from "@/components/berry/BerryLogo";
import { useAuthContext } from "@/features/auth/contexts/AuthContext";
import { userService } from "@/features/user/services/userService";

const preferenceSteps = [
  { question: "What are you looking for?", options: ["Serious", "Casual", "Exploring"] },
  { question: "What matters most to you?", options: ["Deep talks", "Adventure", "Humor", "Ambition"] },
  { question: "How do you feel about texting?", options: ["Love it", "Prefer calls", "In-person only"] },
  { question: "What's your idea of a great first date?", options: ["Coffee walk", "Dinner", "Activity", "Surprise me"] },
];

const interestOptions = [
  "Hiking", "Coffee", "Photography", "Travel", "Design", "Music",
  "Art", "Cooking", "Yoga", "Books", "Gaming", "Fitness",
];

const OnboardingPage = () => {
  const navigate = useNavigate();
  const { authUser, profile, loading, profileLoading, refreshProfile } = useAuthContext();
  const [step, setStep] = useState(0);
  const [answers, setAnswers] = useState<Record<number, string>>({});
  const [name, setName] = useState("");
  const [age, setAge] = useState("");
  const [bio, setBio] = useState("");
  const [selectedInterests, setSelectedInterests] = useState<string[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const totalSteps = preferenceSteps.length + 2;
  const isProfileStep = step === preferenceSteps.length;
  const isInterestsStep = step === preferenceSteps.length + 1;
  const progress = ((step + 1) / totalSteps) * 100;

  // Show loading while auth is resolving
  if (loading || profileLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <BerryLogo size="lg" className="animate-pulse" />
      </div>
    );
  }

  // Not logged in → go to login
  if (!authUser) {
    return <Navigate to="/login" replace />;
  }

  // Already has a profile → go to matches
  if (profile) {
    return <Navigate to="/matches" replace />;
  }

  const handleSelect = (option: string) => {
    setAnswers({ ...answers, [step]: option });
  };

  const toggleInterest = (interest: string) => {
    setSelectedInterests((prev) =>
      prev.includes(interest)
        ? prev.filter((i) => i !== interest)
        : prev.length < 6 ? [...prev, interest] : prev
    );
  };

  const canContinue = () => {
    if (isInterestsStep) return selectedInterests.length >= 2;
    if (isProfileStep) return name.trim().length > 0 && Number(age) >= 18;
    return !!answers[step];
  };

  const handleSubmit = async () => {
    const ageNum = Number(age);
    if (!name.trim() || ageNum < 18) {
      setError("Please provide a valid name and age (18+).");
      return;
    }

    setSubmitting(true);
    setError(null);

    const { error: createError } = await userService.createUserProfile({
      id: authUser.id,
      name: name.trim(),
      age: ageNum,
      bio: bio.trim(),
      interests: selectedInterests,
    });

    if (createError) {
      setSubmitting(false);
      // Duplicate profile
      if (createError.includes("duplicate") || createError.includes("unique")) {
        await refreshProfile();
        navigate("/matches");
        return;
      }
      setError(createError);
      return;
    }

    await refreshProfile();
    navigate("/matches");
  };

  const handleContinue = () => {
    if (isInterestsStep) {
      handleSubmit();
      return;
    }
    setStep(step + 1);
  };

  return (
    <div className="min-h-screen bg-background flex flex-col relative">
      <StrawberryDecor variant="scatter" />

      <div className="sticky top-0 z-50 bg-background/80 backdrop-blur-lg px-berry-3 py-berry-2">
        <div className="max-w-md mx-auto space-y-berry-1">
          <div className="flex items-center justify-between">
            <button onClick={() => navigate("/")} className="flex items-center gap-berry-1 active:scale-95 transition-transform">
              <BerryLogo size="md" />
              <span className="text-[var(--text-lg)] font-bold berry-gradient-text">berry</span>
            </button>
            <span className="text-[var(--text-sm)] text-muted-foreground">
              {step + 1} of {totalSteps}
            </span>
          </div>
          <BerryProgress value={progress} />
        </div>
      </div>

      <div className="flex-1 flex items-center justify-center px-berry-3 py-berry-4 relative">
        <div className="w-full max-w-md animate-fade-in" key={step}>
          {!isProfileStep && !isInterestsStep && (
            <BerryCard className="space-y-berry-3">
              <div className="text-center space-y-berry-1">
                <BerryLogo size="lg" className="mx-auto" />
                <h2 className="text-2xl font-bold text-foreground">{preferenceSteps[step].question}</h2>
                <p className="text-[var(--text-sm)] text-muted-foreground">Pick the one that fits you best</p>
              </div>
              <div className="flex flex-wrap justify-center gap-berry-1">
                {preferenceSteps[step].options.map((opt) => (
                  <BerryTag key={opt} label={opt} active={answers[step] === opt} onClick={() => handleSelect(opt)} />
                ))}
              </div>
              <BerryButton fullWidth onClick={handleContinue} disabled={!canContinue()}>
                Continue
              </BerryButton>
            </BerryCard>
          )}

          {isProfileStep && (
            <BerryCard className="space-y-berry-3">
              <div className="text-center space-y-berry-1">
                <div className="flex justify-center gap-[4px]">
                  <BerryLogo size="lg" />
                  <BerryLogo size="md" className="mt-berry-1 opacity-60" />
                  <BerryLogo size="sm" className="mt-berry-2 opacity-40" />
                </div>
                <h2 className="text-2xl font-bold text-foreground">Tell us about you</h2>
                <p className="text-[var(--text-sm)] text-muted-foreground">This info will show on your profile</p>
              </div>
              {error && (
                <div className="bg-destructive/10 text-destructive text-[var(--text-sm)] rounded-[var(--radius-md)] px-berry-2 py-berry-1">
                  {error}
                </div>
              )}
              <BerryInput placeholder="Your first name" value={name} onChange={setName} />
              <BerryInput placeholder="Your age" value={age} onChange={setAge} type="number" />
              <BerryInput placeholder="Short bio (optional)" value={bio} onChange={setBio} />
              <BerryButton fullWidth onClick={handleContinue} disabled={!canContinue()}>
                Continue
              </BerryButton>
            </BerryCard>
          )}

          {isInterestsStep && (
            <BerryCard className="space-y-berry-3">
              <div className="text-center space-y-berry-1">
                <BerryLogo size="lg" className="mx-auto" />
                <h2 className="text-2xl font-bold text-foreground">Pick your interests</h2>
                <p className="text-[var(--text-sm)] text-muted-foreground">Choose 2–6 that describe you</p>
              </div>
              {error && (
                <div className="bg-destructive/10 text-destructive text-[var(--text-sm)] rounded-[var(--radius-md)] px-berry-2 py-berry-1">
                  {error}
                </div>
              )}
              <div className="flex flex-wrap justify-center gap-berry-1">
                {interestOptions.map((interest) => (
                  <BerryTag key={interest} label={interest} active={selectedInterests.includes(interest)} onClick={() => toggleInterest(interest)} />
                ))}
              </div>
              <BerryButton fullWidth onClick={handleContinue} disabled={!canContinue() || submitting}>
                {submitting ? "Creating profile…" : "Enter Berry 🍓"}
              </BerryButton>
            </BerryCard>
          )}
        </div>
      </div>
    </div>
  );
};

export default OnboardingPage;
