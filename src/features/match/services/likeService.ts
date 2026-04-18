import { supabase } from "@/lib/supabaseClient";

export interface SendLikeResult {
  isMutual: boolean;
  matchId: string | null;
  error: string | null;
}

export const likeService = {
  async sendLike(likerId: string, likedId: string): Promise<SendLikeResult> {
    const { data, error } = await supabase.rpc("send_like", {
      _liker_id: likerId,
      _liked_id: likedId,
    });

    if (error) {
      return { isMutual: false, matchId: null, error: error.message };
    }

    const row = Array.isArray(data) ? data[0] : data;
    return {
      isMutual: !!row?.is_mutual,
      matchId: row?.match_id ?? null,
      error: null,
    };
  },

  async getOutgoingLikedIds(userId: string): Promise<Set<string>> {
    const { data } = await supabase
      .from("likes")
      .select("liked_id")
      .eq("liker_id", userId);
    return new Set((data ?? []).map((r: { liked_id: string }) => r.liked_id));
  },
};
