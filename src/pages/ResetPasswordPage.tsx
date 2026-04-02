import { useState } from "react";
import { useNavigate } from "react-router-dom";
import BerryButton from "@/components/berry/BerryButton";
import BerryCard from "@/components/berry/BerryCard";
import BerryInput from "@/components/berry/BerryInput";
import BerryLogo from "@/components/berry/BerryLogo";
import StrawberryDecor from "@/components/berry/StrawberryDecor";
import { authService } from "@/features/auth/services/authService";

const ResetPasswordPage = () => {
  const navigate = useNavigate();
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const handleReset = async () => {
    if (!password.trim() || password.length < 6) {
      setError("Password must be at least 6 characters.");
      return;
    }
    if (password !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    setLoading(true);
    setError(null);

    const { error: updateError } = await authService.updatePassword(password);

    setLoading(false);

    if (updateError) {
      setError(updateError);
      return;
    }

    setSuccess(true);
    setTimeout(() => navigate("/matches"), 2000);
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
          <p className="text-[var(--text-sm)] text-muted-foreground">Set your new password</p>
        </div>

        <BerryCard className="space-y-berry-3">
          {success ? (
            <div className="text-center space-y-berry-2">
              <div className="w-[64px] h-[64px] rounded-[var(--radius-full)] bg-primary/10 flex items-center justify-center mx-auto">
                <BerryLogo size="md" />
              </div>
              <h2 className="text-[var(--text-lg)] font-bold text-foreground">Password updated! 🍓</h2>
              <p className="text-[var(--text-sm)] text-muted-foreground">Redirecting you now…</p>
            </div>
          ) : (
            <>
              {error && (
                <div className="bg-destructive/10 text-destructive text-[var(--text-sm)] rounded-[var(--radius-md)] px-berry-2 py-berry-1">
                  {error}
                </div>
              )}

              <BerryInput
                placeholder="New password"
                value={password}
                onChange={setPassword}
                type="password"
              />
              <BerryInput
                placeholder="Confirm new password"
                value={confirmPassword}
                onChange={setConfirmPassword}
                type="password"
              />

              <BerryButton
                fullWidth
                onClick={handleReset}
                disabled={loading || !password.trim() || !confirmPassword.trim()}
              >
                {loading ? "Updating…" : "Reset Password"}
              </BerryButton>

              <p className="text-center text-[var(--text-sm)] text-muted-foreground">
                <button onClick={() => navigate("/login")} className="text-primary font-semibold active:scale-95 transition-transform">
                  Back to login
                </button>
              </p>
            </>
          )}
        </BerryCard>
      </div>
    </div>
  );
};

export default ResetPasswordPage;
