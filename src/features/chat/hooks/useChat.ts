import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { chatService } from "@/features/chat/services/chatService";
import { useEffect, useCallback, useRef } from "react";
import type { Message } from "@/types/database";

export type MessageStatus = "sending" | "sent" | "failed";

export interface ChatMessage extends Message {
  _status?: MessageStatus;
  _tempId?: string;
}

let tempIdCounter = 0;
function createTempId() {
  return `temp_${Date.now()}_${++tempIdCounter}`;
}

export function useChat(matchId: string | undefined) {
  const queryClient = useQueryClient();
  const failedMessagesRef = useRef<Map<string, { senderId: string; content: string; mediaUrl?: string; mediaType?: "image" | "video" }>>(new Map());

  const messagesQuery = useQuery({
    queryKey: ["messages", matchId],
    queryFn: async () => {
      if (!matchId) return [] as ChatMessage[];
      const { messages, error } = await chatService.getMessages(matchId);
      if (error) throw new Error(error);
      return messages as ChatMessage[];
    },
    enabled: !!matchId,
  });

  useEffect(() => {
    if (!matchId) return;

    const channel = chatService.subscribeToMessages(
      matchId,
      (newMessage) => {
        queryClient.setQueryData(
          ["messages", matchId],
          (old: ChatMessage[] | undefined) => {
            const existing = old ?? [];
            const deduped = existing.filter(
              (m) =>
                !(m._tempId && m.sender_id === newMessage.sender_id && m.content === newMessage.content)
            );
            if (deduped.some((m) => m.id === newMessage.id)) return deduped;
            return [...deduped, { ...newMessage, _status: "sent" as MessageStatus }];
          }
        );
      },
      (updatedMessage) => {
        queryClient.setQueryData(
          ["messages", matchId],
          (old: ChatMessage[] | undefined) =>
            (old ?? []).map((m) =>
              m.id === updatedMessage.id ? { ...m, ...updatedMessage } : m
            )
        );
      }
    );

    return () => {
      chatService.unsubscribe(channel);
    };
  }, [matchId, queryClient]);

  const sendMessage = useMutation({
    mutationFn: async ({
      senderId,
      content,
      _tempId,
      mediaUrl,
      mediaType,
    }: {
      senderId: string;
      content: string;
      _tempId: string;
      mediaUrl?: string;
      mediaType?: "image" | "video";
    }) => {
      if (!matchId) throw new Error("No match selected");
      const { message, error } = await chatService.sendMessage(matchId, senderId, content, mediaUrl, mediaType);
      if (error) throw new Error(error);
      return { message, _tempId };
    },
    onMutate: async ({ senderId, content, _tempId, mediaUrl, mediaType }) => {
      await queryClient.cancelQueries({ queryKey: ["messages", matchId] });

      const optimisticMessage: ChatMessage = {
        id: _tempId,
        match_id: matchId!,
        sender_id: senderId,
        content,
        media_url: mediaUrl,
        media_type: mediaType,
        created_at: new Date().toISOString(),
        _status: "sending",
        _tempId,
      };

      queryClient.setQueryData(
        ["messages", matchId],
        (old: ChatMessage[] | undefined) => [...(old ?? []), optimisticMessage]
      );

      return { _tempId };
    },
    onSuccess: ({ message, _tempId }) => {
      failedMessagesRef.current.delete(_tempId);
      queryClient.setQueryData(
        ["messages", matchId],
        (old: ChatMessage[] | undefined) =>
          (old ?? []).map((m) =>
            m._tempId === _tempId
              ? { ...message!, _status: "sent" as MessageStatus }
              : m
          )
      );
    },
    onError: (_error, variables) => {
      failedMessagesRef.current.set(variables._tempId, {
        senderId: variables.senderId,
        content: variables.content,
        mediaUrl: variables.mediaUrl,
        mediaType: variables.mediaType,
      });
      queryClient.setQueryData(
        ["messages", matchId],
        (old: ChatMessage[] | undefined) =>
          (old ?? []).map((m) =>
            m._tempId === variables._tempId ? { ...m, _status: "failed" as MessageStatus } : m
          )
      );
    },
  });

  const send = useCallback(
    (senderId: string, content: string, mediaUrl?: string, mediaType?: "image" | "video") => {
      const _tempId = createTempId();
      sendMessage.mutate({ senderId, content, _tempId, mediaUrl, mediaType });
    },
    [sendMessage]
  );

  const sendMedia = useCallback(
    async (senderId: string, file: File) => {
      if (!matchId) return;
      const isVideo = file.type.startsWith("video/");
      const isImage = file.type.startsWith("image/");
      if (!isVideo && !isImage) return;

      const { url, error } = await chatService.uploadMedia(matchId, file);
      if (error || !url) {
        console.error("[Berry] Media upload failed:", error);
        return;
      }

      const mediaType = isVideo ? "video" as const : "image" as const;
      send(senderId, "", url, mediaType);
    },
    [matchId, send]
  );

  const retry = useCallback(
    (tempId: string) => {
      const failed = failedMessagesRef.current.get(tempId);
      if (!failed) return;
      queryClient.setQueryData(
        ["messages", matchId],
        (old: ChatMessage[] | undefined) => (old ?? []).filter((m) => m._tempId !== tempId)
      );
      failedMessagesRef.current.delete(tempId);
      send(failed.senderId, failed.content, failed.mediaUrl, failed.mediaType);
    },
    [matchId, queryClient, send]
  );

  const deleteMessage = useCallback(
    async (messageId: string, userId: string) => {
      if (!matchId) return;
      // Optimistic update
      queryClient.setQueryData(
        ["messages", matchId],
        (old: ChatMessage[] | undefined) =>
          (old ?? []).map((m) =>
            m.id === messageId ? { ...m, is_deleted: true, deleted_at: new Date().toISOString(), content: "" } : m
          )
      );
      const { error } = await chatService.deleteMessage(messageId, userId);
      if (error) {
        // Revert on failure
        queryClient.invalidateQueries({ queryKey: ["messages", matchId] });
      }
    },
    [matchId, queryClient]
  );

  return {
    messages: (messagesQuery.data ?? []) as ChatMessage[],
    isLoading: messagesQuery.isLoading,
    error: messagesQuery.error,
    send,
    sendMedia,
    retry,
    deleteMessage,
    isSending: sendMessage.isPending,
  };
}
