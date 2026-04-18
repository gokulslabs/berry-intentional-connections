import { supabase } from "@/lib/supabaseClient";
import type { Match, MatchWithProfile, UserProfile } from "@/types/database";

export const matchService = {
  async getMatches(userId: string): Promise<{ matches: MatchWithProfile[]; error: string | null }> {
    const { data: matchRows, error } = await supabase
      .from("matches")
      .select("*")
      .or(`user1_id.eq.${userId},user2_id.eq.${userId}`)
      .order("created_at", { ascending: false });

    if (error) return { matches: [], error: error.message };
    if (!matchRows?.length) return { matches: [], error: null };

    const partnerIds = matchRows.map((m: Match) =>
      m.user1_id === userId ? m.user2_id : m.user1_id
    );

    const { data: profiles } = await supabase
      .from("users")
      .select("*")
      .in("id", partnerIds);

    const profileMap = new Map(
      (profiles ?? []).map((p: UserProfile) => [p.id, p])
    );

    const matches: MatchWithProfile[] = matchRows
      .map((m: Match) => {
        const partnerId = m.user1_id === userId ? m.user2_id : m.user1_id;
        const partner = profileMap.get(partnerId);
        if (!partner) return null;
        return { ...m, partner };
      })
      .filter(Boolean) as MatchWithProfile[];

    return { matches, error: null };
  },

  async getExploreCandidates(userId: string): Promise<UserProfile[]> {
    const { data: existingMatches } = await supabase
      .from("matches")
      .select("user1_id, user2_id")
      .or(`user1_id.eq.${userId},user2_id.eq.${userId}`);

    const excludedIds = new Set<string>();
    excludedIds.add(userId);
    (existingMatches ?? []).forEach((m: { user1_id: string; user2_id: string }) => {
      excludedIds.add(m.user1_id);
      excludedIds.add(m.user2_id);
    });

    // Exclude blocked users (in either direction)
    const { data: blocks } = await supabase
      .from("blocks")
      .select("blocker_id, blocked_id")
      .or(`blocker_id.eq.${userId},blocked_id.eq.${userId}`);

    (blocks ?? []).forEach((b: { blocker_id: string; blocked_id: string }) => {
      excludedIds.add(b.blocker_id === userId ? b.blocked_id : b.blocker_id);
    });

    const { data: users } = await supabase
      .from("users")
      .select("*")
      .limit(50);

    return (users ?? []).filter((u: UserProfile) => !excludedIds.has(u.id));
  },

  async createMatch(
    user1Id: string,
    user2Id: string
  ): Promise<{ match: Match | null; error: string | null }> {
    const { data: existing } = await supabase
      .from("matches")
      .select("id")
      .or(
        `and(user1_id.eq.${user1Id},user2_id.eq.${user2Id}),and(user1_id.eq.${user2Id},user2_id.eq.${user1Id})`
      )
      .limit(1);

    if (existing && existing.length > 0) {
      return { match: null, error: "You're already matched!" };
    }

    const { data: match, error } = await supabase
      .from("matches")
      .insert({ user1_id: user1Id, user2_id: user2Id })
      .select()
      .single();

    return { match, error: error?.message ?? null };
  },
};
