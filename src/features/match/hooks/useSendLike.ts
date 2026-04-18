import { useMutation, useQueryClient } from "@tanstack/react-query";
import { likeService } from "@/features/match/services/likeService";

export function useSendLike() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ likerId, likedId }: { likerId: string; likedId: string }) => {
      const result = await likeService.sendLike(likerId, likedId);
      if (result.error) throw new Error(result.error);
      return result;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["explore"] });
      queryClient.invalidateQueries({ queryKey: ["matches"] });
    },
  });
}
