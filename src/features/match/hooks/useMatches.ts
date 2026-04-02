import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { matchService } from "@/features/match/services/matchService";

export function useMatches(userId: string | undefined) {
  return useQuery({
    queryKey: ["matches", userId],
    queryFn: async () => {
      if (!userId) return [];
      const { matches, error } = await matchService.getMatches(userId);
      if (error) throw new Error(error);
      return matches;
    },
    enabled: !!userId,
  });
}

export function useCreateMatch() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ user1Id, user2Id }: { user1Id: string; user2Id: string }) => {
      const { match, error } = await matchService.createMatch(user1Id, user2Id);
      if (error) throw new Error(error);
      return match;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["matches"] });
      queryClient.invalidateQueries({ queryKey: ["explore"] });
    },
  });
}
