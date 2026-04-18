import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { safetyService, type ReportReason } from "@/features/safety/services/safetyService";

export function useUnmatch() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ matchId, userId }: { matchId: string; userId: string }) => {
      const { ok, error } = await safetyService.unmatch(matchId, userId);
      if (!ok) throw new Error(error ?? "Unmatch failed");
      return ok;
    },
    onSuccess: () => {
      toast.success("Unmatched 🍓", { description: "You won't see them in your chats anymore." });
      qc.invalidateQueries({ queryKey: ["matches"] });
      qc.invalidateQueries({ queryKey: ["chat-previews"] });
    },
    onError: (e: Error) => toast.error("Couldn't unmatch", { description: e.message }),
  });
}

export function useBlockUser() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ blockerId, blockedId }: { blockerId: string; blockedId: string }) => {
      const { ok, error } = await safetyService.block(blockerId, blockedId);
      if (!ok) throw new Error(error ?? "Block failed");
      return ok;
    },
    onSuccess: () => {
      toast.success("Blocked 🚫", { description: "You won't see each other again." });
      qc.invalidateQueries({ queryKey: ["explore"] });
      qc.invalidateQueries({ queryKey: ["blocked-ids"] });
    },
    onError: (e: Error) => toast.error("Couldn't block", { description: e.message }),
  });
}

export function useReportUser() {
  return useMutation({
    mutationFn: async (args: {
      reporterId: string;
      reportedId: string;
      reason: ReportReason;
      details: string;
      matchId: string | null;
    }) => {
      const { ok, error } = await safetyService.report(
        args.reporterId,
        args.reportedId,
        args.reason,
        args.details,
        args.matchId
      );
      if (!ok) throw new Error(error ?? "Report failed");
      return ok;
    },
    onSuccess: () => {
      toast.success("Report sent 💛", { description: "Thanks for keeping Berry safe. Our team will review it." });
    },
    onError: (e: Error) => toast.error("Couldn't send report", { description: e.message }),
  });
}

export function useBlockedIds(userId: string | undefined) {
  return useQuery({
    queryKey: ["blocked-ids", userId],
    queryFn: async () => (userId ? await safetyService.getBlockedIds(userId) : new Set<string>()),
    enabled: !!userId,
  });
}

export function useIsAdmin(userId: string | undefined) {
  return useQuery({
    queryKey: ["is-admin", userId],
    queryFn: async () => (userId ? await safetyService.isAdmin(userId) : false),
    enabled: !!userId,
  });
}
