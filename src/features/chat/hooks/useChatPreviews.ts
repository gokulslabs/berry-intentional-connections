import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect } from "react";
import { chatService } from "@/features/chat/services/chatService";
import type { Message } from "@/types/database";

/**
 * Fetches and subscribes to last-message previews for a list of match IDs.
 * Platform-agnostic — no browser APIs.
 */
export function useChatPreviews(matchIds: string[]) {
  const queryClient = useQueryClient();
  const key = ["chat-previews", ...matchIds];

  const query = useQuery({
    queryKey: key,
    queryFn: async () => {
      const { lastMessages, error } = await chatService.getLastMessages(matchIds);
      if (error) throw new Error(error);
      return lastMessages;
    },
    enabled: matchIds.length > 0,
  });

  // Realtime: update preview when new message arrives
  useEffect(() => {
    if (matchIds.length === 0) return;

    const channel = chatService.subscribeToAllMessages(matchIds, (newMsg: Message) => {
      queryClient.setQueryData(key, (old: Record<string, Message> | undefined) => ({
        ...(old ?? {}),
        [newMsg.match_id]: newMsg,
      }));
    });

    return () => {
      chatService.unsubscribe(channel);
    };
  }, [matchIds.join(","), queryClient]);

  return {
    previews: query.data ?? {},
    isLoading: query.isLoading,
  };
}
