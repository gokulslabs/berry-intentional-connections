import { useEffect, useState } from "react";
import { authService } from "@/features/auth/services/authService";
import type { User } from "@supabase/supabase-js";

export function useAuth() {
  const [authUser, setAuthUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    authService.getCurrentUser().then((user) => {
      setAuthUser(user);
      setLoading(false);
    });

    const subscription = authService.onAuthStateChange((user) => {
      setAuthUser(user);
    });

    return () => subscription.unsubscribe();
  }, []);

  return { authUser, loading };
}
