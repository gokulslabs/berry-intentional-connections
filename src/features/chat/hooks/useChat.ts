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
  const failedMessagesRef = useRef<Map<string, { senderId: string; content: string; mediaUrl?: string; mediaType?: "image" | "video" | "audio" }>>(new Map());

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
      audioPath,
      audioDuration,
    }: {
      senderId: string;
      content: string;
      _tempId: string;
      mediaUrl?: string;
      mediaType?: "image" | "video" | "audio";
      audioPath?: string;
      audioDuration?: number;
    }) => {
      if (!matchId) throw new Error("No match selected");
      const { message, error } = await chatService.sendMessage(
        matchId,
        senderId,
        content,
        mediaUrl,
        mediaType,
        { audio_path: audioPath, audio_duration: audioDuration }
      );
      if (error) throw new Error(error);
      return { message, _tempId };
    },
    onMutate: async ({ senderId, content, _tempId, mediaUrl, mediaType, audioPath, audioDuration }) => {
      await queryClient.cancelQueries({ queryKey: ["messages", matchId] });

      const optimisticMessage: ChatMessage = {
        id: _tempId,
        match_id: matchId!,
        sender_id: senderId,
        content,
        media_url: mediaUrl,
        media_type: mediaType,
        audio_path: audioPath,
        audio_duration: audioDuration,
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
          (old ?? []).map((m) => {
            if (m._tempId !== _tempId) return m;
            // Preserve any optimistic media_url (signed/blob) we already have so playback keeps working
            return {
              ...message!,
              media_url: m.media_url ?? message!.media_url,
              _status: "sent" as MessageStatus,
            };
          })
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
    (
      senderId: string,
      content: string,
      mediaUrl?: string,
      mediaType?: "image" | "video" | "audio",
      extra?: { audioPath?: string; audioDuration?: number }
    ) => {
      const _tempId = createTempId();
      sendMessage.mutate({
        senderId,
        content,
        _tempId,
        mediaUrl,
        mediaType,
        audioPath: extra?.audioPath,
        audioDuration: extra?.audioDuration,
      });
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

  const sendVoiceNote = useCallback(
    async (senderId: string, blob: Blob, durationSec: number) => {
      if (!matchId) return;
      // Optimistic: play from local object URL while uploading
      const localUrl = URL.createObjectURL(blob);
      const _tempId = createTempId();
      sendMessage.mutate({
        senderId,
        content: "",
        _tempId,
        mediaUrl: localUrl,
        mediaType: "audio",
        audioDuration: Math.round(durationSec * 10) / 10,
      });

      const { path, error } = await chatService.uploadVoiceNote(matchId, blob);
      if (error || !path) {
        console.error("[Berry] Voice upload failed:", error);
        queryClient.setQueryData(
          ["messages", matchId],
          (old: ChatMessage[] | undefined) =>
            (old ?? []).map((m) =>
              m._tempId === _tempId ? { ...m, _status: "failed" as MessageStatus } : m
            )
        );
        return;
      }

      // Sign and persist to DB
      const { url: signedUrl } = await chatService.getVoiceNoteUrl(path);
      const { message, error: insertErr } = await chatService.sendMessage(
        matchId,
        senderId,
        "",
        signedUrl ?? undefined,
        "audio",
        { audio_path: path, audio_duration: Math.round(durationSec * 10) / 10 }
      );

      if (insertErr || !message) {
        queryClient.setQueryData(
          ["messages", matchId],
          (old: ChatMessage[] | undefined) =>
            (old ?? []).map((m) =>
              m._tempId === _tempId ? { ...m, _status: "failed" as MessageStatus } : m
            )
        );
        return;
      }

      queryClient.setQueryData(
        ["messages", matchId],
        (old: ChatMessage[] | undefined) =>
          (old ?? []).map((m) =>
            m._tempId === _tempId
              ? { ...message, media_url: localUrl, _status: "sent" as MessageStatus }
              : m
          )
      );
    },
    [matchId, queryClient, sendMessage]
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
