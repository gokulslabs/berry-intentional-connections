import { Navigate } from "react-router-dom";
import { useAuthContext } from "@/features/auth/contexts/AuthContext";
import { useDemoContext } from "@/features/auth/contexts/DemoContext";
import BerryLogo from "./BerryLogo";

const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
  const { authUser, loading, profile, profileLoading } = useAuthContext();
  const demo = useDemoContext();

  if (demo?.isDemo) {
    return <>{children}</>;
  }

  if (loading || profileLoading) {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center gap-berry-2">
        <BerryLogo size="lg" className="animate-pulse" />
        <p className="text-[var(--text-sm)] text-muted-foreground">Loading…</p>
      </div>
    );
  }

  if (!authUser) {
    return <Navigate to="/login" replace />;
  }

  if (!profile) {
    return <Navigate to="/onboarding" replace />;
  }

  return <>{children}</>;
};

export default ProtectedRoute;
