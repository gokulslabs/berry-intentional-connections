import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { userService } from "@/features/user/services/userService";
import type { UpdateUserProfileData } from "@/types/database";

export function useUserProfile(userId: string | undefined) {
  return useQuery({
    queryKey: ["userProfile", userId],
    queryFn: async () => {
      if (!userId) return null;
      const { profile, error } = await userService.getUserProfile(userId);
      if (error) throw new Error(error);
      return profile;
    },
    enabled: !!userId,
  });
}

export function useUpdateProfile() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      userId,
      updates,
    }: {
      userId: string;
      updates: UpdateUserProfileData;
    }) => {
      const { profile, error } = await userService.updateUserProfile(
        userId,
        updates
      );
      if (error) throw new Error(error);
      return profile;
    },
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({
        queryKey: ["userProfile", variables.userId],
      });
    },
  });
}
