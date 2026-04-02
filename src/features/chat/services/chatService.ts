import { supabase } from "@/lib/supabaseClient";
import type { Message } from "@/types/database";
import type { RealtimeChannel } from "@supabase/supabase-js";

export const chatService = {
  async sendMessage(
    matchId: string,
    senderId: string,
    content: string,
    mediaUrl?: string,
    mediaType?: "image" | "video"
  ): Promise<{ message: Message | null; error: string | null }> {
    const row: Record<string, unknown> = {
      match_id: matchId,
      sender_id: senderId,
      content,
    };
    if (mediaUrl) row.media_url = mediaUrl;
    if (mediaType) row.media_type = mediaType;

    const { data: message, error } = await supabase
      .from("messages")
      .insert(row)
      .select()
      .single();

    return { message, error: error?.message ?? null };
  },

  async uploadMedia(
    matchId: string,
    file: File
  ): Promise<{ url: string | null; error: string | null }> {
    const ext = file.name.split(".").pop() ?? "bin";
    const path = `${matchId}/${Date.now()}_${Math.random().toString(36).slice(2)}.${ext}`;

    const { error } = await supabase.storage
      .from("chat-media")
      .upload(path, file, { contentType: file.type, upsert: false });

    if (error) return { url: null, error: error.message };

    const { data } = supabase.storage.from("chat-media").getPublicUrl(path);
    return { url: data.publicUrl, error: null };
  },

  async getMessages(
    matchId: string
  ): Promise<{ messages: Message[]; error: string | null }> {
    const { data: messages, error } = await supabase
      .from("messages")
      .select("*")
      .eq("match_id", matchId)
      .order("created_at", { ascending: true });

    return { messages: messages ?? [], error: error?.message ?? null };
  },

  subscribeToMessages(
    matchId: string,
    onInsert: (message: Message) => void,
    onUpdate?: (message: Message) => void
  ): RealtimeChannel {
    const channel = supabase
      .channel(`messages:${matchId}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "messages",
          filter: `match_id=eq.${matchId}`,
        },
        (payload) => {
          onInsert(payload.new as Message);
        }
      )
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "messages",
          filter: `match_id=eq.${matchId}`,
        },
        (payload) => {
          onUpdate?.(payload.new as Message);
        }
      )
      .subscribe();

    return channel;
  },

  unsubscribe(channel: RealtimeChannel) {
    supabase.removeChannel(channel);
  },

  async deleteMessage(
    messageId: string,
    userId: string
  ): Promise<{ success: boolean; error: string | null }> {
    const { data, error } = await supabase.rpc("soft_delete_message", {
      _message_id: messageId,
      _user_id: userId,
    });

    if (error) return { success: false, error: error.message };
    return { success: !!data, error: null };
  },

  /**
   * Fetch the latest message for each match in a single query.
   * Returns a map of matchId → last Message.
   */
  async getLastMessages(
    matchIds: string[]
  ): Promise<{ lastMessages: Record<string, Message>; error: string | null }> {
    if (matchIds.length === 0) return { lastMessages: {}, error: null };

    // Fetch last message per match using distinct on
    const { data, error } = await supabase
      .from("messages")
      .select("*")
      .in("match_id", matchIds)
      .order("match_id", { ascending: true })
      .order("created_at", { ascending: false });

    if (error) return { lastMessages: {}, error: error.message };

    // Keep only the first (most recent) message per match_id
    const lastMessages: Record<string, Message> = {};
    for (const msg of data ?? []) {
      if (!lastMessages[msg.match_id]) {
        lastMessages[msg.match_id] = msg;
      }
    }

    return { lastMessages, error: null };
  },

  /**
   * Subscribe to new messages across all provided match IDs.
   */
  subscribeToAllMessages(
    matchIds: string[],
    callback: (message: Message) => void
  ): RealtimeChannel {
    const channel = supabase
      .channel("messages:all-matches")
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "messages",
        },
        (payload) => {
          const msg = payload.new as Message;
          if (matchIds.includes(msg.match_id)) {
            callback(msg);
          }
        }
      )
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "messages",
        },
        (payload) => {
          const msg = payload.new as Message;
          if (matchIds.includes(msg.match_id)) {
            callback(msg);
          }
        }
      )
      .subscribe();

    return channel;
  },
};
