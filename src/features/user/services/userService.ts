import { supabase } from "@/lib/supabaseClient";
import type {
  UserProfile,
  CreateUserProfileData,
  UpdateUserProfileData,
} from "@/types/database";

export const userService = {
  async createUserProfile(
    data: CreateUserProfileData
  ): Promise<{ profile: UserProfile | null; error: string | null }> {
    const { data: profile, error } = await supabase
      .from("users")
      .insert({
        id: data.id,
        name: data.name,
        age: data.age,
        bio: data.bio ?? "",
        interests: data.interests ?? [],
        level: 1,
        response_rate: 0,
      })
      .select()
      .single();

    return { profile, error: error?.message ?? null };
  },

  async getUserProfile(
    userId: string
  ): Promise<{ profile: UserProfile | null; error: string | null }> {
    const { data: profile, error } = await supabase
      .from("users")
      .select("*")
      .eq("id", userId)
      .maybeSingle();

    return { profile, error: error?.message ?? null };
  },

  async updateUserProfile(
    userId: string,
    updates: UpdateUserProfileData
  ): Promise<{ profile: UserProfile | null; error: string | null }> {
    const { data: profile, error } = await supabase
      .from("users")
      .update(updates)
      .eq("id", userId)
      .select()
      .single();

    return { profile, error: error?.message ?? null };
  },
};
