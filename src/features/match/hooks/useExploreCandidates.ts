import { useQuery } from "@tanstack/react-query";
import { matchService } from "@/features/match/services/matchService";

export function useExploreCandidates(userId: string | undefined) {
  return useQuery({
    queryKey: ["explore", userId],
    queryFn: async () => {
      if (!userId) return [];
      return matchService.getExploreCandidates(userId);
    },
    enabled: !!userId,
  });
}
