import { useState } from "react";
import { useNavigate } from "react-router-dom";
import BerryButton from "@/components/berry/BerryButton";
import BerryCard from "@/components/berry/BerryCard";
import BerryInput from "@/components/berry/BerryInput";
import BerryLogo from "@/components/berry/BerryLogo";
import StrawberryDecor from "@/components/berry/StrawberryDecor";
import { authService } from "@/features/auth/services/authService";
import { useDemoContext } from "@/features/auth/contexts/DemoContext";

const LoginPage = () => {
  const navigate = useNavigate();
  const demo = useDemoContext();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isSignUp, setIsSignUp] = useState(false);
  const [isForgot, setIsForgot] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [resetSent, setResetSent] = useState(false);

  const handleSubmit = async () => {
    if (!email.trim()) return;
    setLoading(true);
    setError(null);

    if (isForgot) {
      const redirectTo = `${globalThis.location?.origin ?? "https://berry-intentional-connections.vercel.app"}/reset-password`;
      const { error: resetError } = await authService.resetPasswordForEmail(email, redirectTo);
      setLoading(false);
      if (resetError) {
        setError(resetError);
        return;
      }
      setResetSent(true);
      return;
    }

    if (!password.trim()) {
      setLoading(false);
      return;
    }

    const result = isSignUp
      ? await authService.signUp(email, password)
      : await authService.signIn(email, password);

    setLoading(false);

    if (result.error) {
      setError(result.error);
      return;
    }

    if (isSignUp && !result.session) {
      setError(null);
      setResetSent(true);
      return;
    }

    navigate(isSignUp ? "/onboarding" : "/matches");
  };

  return (
    <div className="min-h-screen bg-background dark:berry-night-glow flex flex-col items-center justify-center px-berry-3 relative">
      <StrawberryDecor variant="scatter" />

      <div className="w-full max-w-md animate-fade-in">
        <div className="flex flex-col items-center gap-berry-2 mb-berry-4">
          <button onClick={() => navigate("/")} className="flex items-center gap-berry-1 active:scale-95 transition-transform">
            <BerryLogo size="lg" />
            <span className="text-[var(--text-lg)] font-bold berry-gradient-text">berry</span>
          </button>
          <p className="text-[var(--text-sm)] text-muted-foreground">
            {isForgot ? "Reset your password" : isSignUp ? "Create your account" : "Welcome back"}
          </p>
        </div>

        <BerryCard className="space-y-berry-3">
          {resetSent ? (
            <div className="text-center space-y-berry-2">
              <div className="w-[64px] h-[64px] rounded-[var(--radius-full)] bg-primary/10 flex items-center justify-center mx-auto">
                <BerryLogo size="md" />
              </div>
              <h2 className="text-[var(--text-lg)] font-bold text-foreground">
                {isForgot ? "Check your email 🍓" : "Verify your email 🍓"}
              </h2>
              <p className="text-[var(--text-sm)] text-muted-foreground">
                {isForgot
                  ? <>We sent a password reset link to <strong className="text-foreground">{email}</strong></>
                  : <>We sent a confirmation link to <strong className="text-foreground">{email}</strong>. Please verify to continue.</>
                }
              </p>
              <button
                onClick={() => { setIsForgot(false); setIsSignUp(false); setResetSent(false); setError(null); }}
                className="text-primary text-[var(--text-sm)] font-semibold active:scale-95 transition-transform"
              >
                Back to login
              </button>
            </div>
          ) : (
            <>
              {error && (
                <div className="bg-destructive/10 text-destructive text-[var(--text-sm)] rounded-[var(--radius-md)] px-berry-2 py-berry-1">
                  {error}
                </div>
              )}

              <BerryInput placeholder="Email" value={email} onChange={setEmail} />

              {!isForgot && (
                <BerryInput placeholder="Password" value={password} onChange={setPassword} type="password" />
              )}

              <BerryButton
                fullWidth
                onClick={handleSubmit}
                disabled={loading || !email.trim() || (!isForgot && !password.trim())}
              >
                {loading ? "Please wait…" : isForgot ? "Send Reset Link" : isSignUp ? "Sign Up" : "Log In"}
              </BerryButton>

              {!isForgot && !isSignUp && (
                <p className="text-center">
                  <button
                    onClick={() => { setIsForgot(true); setError(null); }}
                    className="text-primary/70 text-[var(--text-xs)] font-medium active:scale-95 transition-transform"
                  >
                    Forgot password?
                  </button>
                </p>
              )}

              <p className="text-center text-[var(--text-sm)] text-muted-foreground">
                {isForgot ? (
                  <button
                    onClick={() => { setIsForgot(false); setError(null); }}
                    className="text-primary font-semibold active:scale-95 transition-transform"
                  >
                    Back to login
                  </button>
                ) : (
                  <>
                    {isSignUp ? "Already have an account?" : "Don't have an account?"}{" "}
                    <button
                      onClick={() => { setIsSignUp(!isSignUp); setError(null); }}
                      className="text-primary font-semibold active:scale-95 transition-transform"
                    >
                      {isSignUp ? "Log in" : "Sign up"}
                    </button>
                  </>
                )}
              </p>

              <div className="relative">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-border" />
                </div>
                <div className="relative flex justify-center">
                  <span className="bg-card px-berry-2 text-[var(--text-xs)] text-muted-foreground">or</span>
                </div>
              </div>

              <button
                onClick={() => {
                  demo?.enterDemo();
                  navigate("/matches");
                }}
                className="w-full py-berry-1 rounded-[var(--radius-md)] border border-primary/20 bg-primary/5 text-primary text-[var(--text-sm)] font-semibold active:scale-[0.98] transition-all flex items-center justify-center gap-berry-1"
              >
                <BerryLogo size="sm" />
                Try Demo Mode
              </button>
            </>
          )}
        </BerryCard>
      </div>
    </div>
  );
};

export default LoginPage;
