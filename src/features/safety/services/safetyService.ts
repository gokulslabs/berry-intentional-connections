import { supabase } from "@/lib/supabaseClient";

export const REPORT_REASONS = [
  "Inappropriate photos",
  "Harassment or hate",
  "Spam or scam",
  "Underage user",
  "Fake profile / stolen photos",
  "Off-platform behavior",
  "Threats or violence",
  "Sexual content",
  "Other",
] as const;

export type ReportReason = (typeof REPORT_REASONS)[number];

export interface Report {
  id: string;
  reporter_id: string;
  reported_id: string;
  reason: string;
  details: string;
  match_id: string | null;
  status: "pending" | "reviewing" | "resolved" | "dismissed";
  resolved_at: string | null;
  resolved_by: string | null;
  created_at: string;
}

export const safetyService = {
  async unmatch(matchId: string, userId: string): Promise<{ ok: boolean; error: string | null }> {
    const { data, error } = await supabase.rpc("unmatch", {
      _match_id: matchId,
      _user_id: userId,
    });
    if (error) return { ok: false, error: error.message };
    return { ok: !!data, error: null };
  },

  async block(blockerId: string, blockedId: string): Promise<{ ok: boolean; error: string | null }> {
    const { error } = await supabase
      .from("blocks")
      .insert({ blocker_id: blockerId, blocked_id: blockedId });
    if (error && !error.message.includes("duplicate")) {
      return { ok: false, error: error.message };
    }
    return { ok: true, error: null };
  },

  async unblock(blockerId: string, blockedId: string): Promise<{ ok: boolean; error: string | null }> {
    const { error } = await supabase
      .from("blocks")
      .delete()
      .eq("blocker_id", blockerId)
      .eq("blocked_id", blockedId);
    if (error) return { ok: false, error: error.message };
    return { ok: true, error: null };
  },

  async getBlockedIds(userId: string): Promise<Set<string>> {
    const { data } = await supabase
      .from("blocks")
      .select("blocker_id, blocked_id")
      .or(`blocker_id.eq.${userId},blocked_id.eq.${userId}`);
    const ids = new Set<string>();
    (data ?? []).forEach((b: { blocker_id: string; blocked_id: string }) => {
      if (b.blocker_id === userId) ids.add(b.blocked_id);
      else ids.add(b.blocker_id);
    });
    return ids;
  },

  async report(
    reporterId: string,
    reportedId: string,
    reason: ReportReason,
    details: string,
    matchId: string | null
  ): Promise<{ ok: boolean; error: string | null }> {
    const trimmedDetails = (details ?? "").trim().slice(0, 1000);
    const { error } = await supabase.from("reports").insert({
      reporter_id: reporterId,
      reported_id: reportedId,
      reason,
      details: trimmedDetails,
      match_id: matchId,
    });
    if (error) return { ok: false, error: error.message };
    return { ok: true, error: null };
  },

  async listReports(): Promise<{ reports: Report[]; error: string | null }> {
    const { data, error } = await supabase
      .from("reports")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(200);
    if (error) return { reports: [], error: error.message };
    return { reports: (data ?? []) as Report[], error: null };
  },

  async updateReportStatus(
    reportId: string,
    status: Report["status"],
    adminId: string
  ): Promise<{ ok: boolean; error: string | null }> {
    const { error } = await supabase
      .from("reports")
      .update({
        status,
        resolved_at: status === "resolved" || status === "dismissed" ? new Date().toISOString() : null,
        resolved_by: status === "resolved" || status === "dismissed" ? adminId : null,
      })
      .eq("id", reportId);
    if (error) return { ok: false, error: error.message };
    return { ok: true, error: null };
  },

  async isAdmin(userId: string): Promise<boolean> {
    const { data } = await supabase
      .from("user_roles")
      .select("role")
      .eq("user_id", userId)
      .eq("role", "admin")
      .maybeSingle();
    return !!data;
  },
};
