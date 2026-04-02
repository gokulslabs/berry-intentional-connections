import { createContext, useContext, useEffect, useState } from "react";
import { userService } from "@/features/user/services/userService";
import { authService } from "@/features/auth/services/authService";
import type { User } from "@supabase/supabase-js";
import type { UserProfile } from "@/types/database";

interface AuthContextType {
  authUser: User | null;
  profile: UserProfile | null;
  loading: boolean;
  profileLoading: boolean;
  refreshProfile: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
  authUser: null,
  profile: null,
  loading: true,
  profileLoading: true,
  refreshProfile: async () => {},
});

export const useAuthContext = () => useContext(AuthContext);

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [authUser, setAuthUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [profileLoading, setProfileLoading] = useState(true);

  const fetchProfile = async (userId: string) => {
    setProfileLoading(true);
    const { profile: p } = await userService.getUserProfile(userId);
    setProfile(p);
    setProfileLoading(false);
    return p;
  };

  const refreshProfile = async () => {
    if (authUser?.id) {
      await fetchProfile(authUser.id);
    }
  };

  useEffect(() => {
    const subscription = authService.onAuthStateChange(
      (user) => {
        setAuthUser(user);

        if (user) {
          fetchProfile(user.id);
        } else {
          setProfile(null);
          setProfileLoading(false);
        }
      }
    );

    authService.getSession().then(({ data: { session } }) => {
      const user = session?.user ?? null;
      setAuthUser(user);
      setLoading(false);
      if (user) {
        fetchProfile(user.id);
      } else {
        setProfileLoading(false);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  return (
    <AuthContext.Provider value={{ authUser, profile, loading, profileLoading, refreshProfile }}>
      {children}
    </AuthContext.Provider>
  );
};
