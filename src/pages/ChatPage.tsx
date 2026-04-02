import { useState, useRef, useEffect, useCallback, useMemo, memo } from "react";
import { useNavigate, useParams } from "react-router-dom";
import BerryAvatar from "@/components/berry/BerryAvatar";
import BerryLogo from "@/components/berry/BerryLogo";
import BerryButton from "@/components/berry/BerryButton";
import BottomNav from "@/components/berry/BottomNav";
import { ArrowLeft, Send, Check, CheckCheck, RotateCcw, ImagePlus, Trash2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { useAuthContext } from "@/features/auth/contexts/AuthContext";
import { useDemoContext } from "@/features/auth/contexts/DemoContext";
import { useChat, type ChatMessage, type MessageStatus } from "@/features/chat/hooks/useChat";
import { useChatPreviews } from "@/features/chat/hooks/useChatPreviews";
import { useMatches } from "@/features/match/hooks/useMatches";
import { DEMO_USER_ID } from "@/data/demoData";
import type { MatchWithProfile, Message } from "@/types/database";

/* ─── Icebreakers ─── */
const icebreakers = [
  "What's your favorite hobby? 🎨",
  "Best travel story? ✈️",
  "Favorite anime? 🍥",
  "What are you passionate about? 🔥",
];

/* ─── Typing dots ─── */
const TypingIndicator = () => (
  <div className="flex justify-start animate-fade-in">
    <div className="bg-muted rounded-[18px] rounded-bl-[var(--radius-sm)] px-berry-2 py-berry-1 flex items-center gap-[6px]">
      {[0, 1, 2].map((i) => (
        <span
          key={i}
          className="w-[5px] h-[5px] rounded-[var(--radius-full)] bg-muted-foreground/50"
          style={{ animation: `berry-typing 1.2s ease-in-out ${i * 200}ms infinite` }}
        />
      ))}
    </div>
  </div>
);

/* ─── Status ─── */
const StatusIndicator = memo(({ status, isLast }: { status?: MessageStatus; isLast: boolean }) => {
  if (!isLast) return null;
  return (
    <div className="flex justify-end mt-[2px] pr-[2px]">
      {status === "sending" && (
        <span className="text-[10px] text-muted-foreground/50 font-medium animate-pulse">Sending…</span>
      )}
      {status === "sent" && <Check className="w-3 h-3 text-muted-foreground/40" />}
      {!status && <CheckCheck className="w-3 h-3 text-primary/60" />}
    </div>
  );
});
StatusIndicator.displayName = "StatusIndicator";

/* ─── Media ─── */
const MediaContent = memo(({ mediaUrl, mediaType }: { mediaUrl: string; mediaType: "image" | "video" }) => {
  if (mediaType === "video") {
    return (
      <video
        src={mediaUrl}
        controls
        className="rounded-[var(--radius-md)] max-w-full max-h-[240px] mt-[4px]"
        preload="metadata"
      />
    );
  }
  return (
    <img
      src={mediaUrl}
      alt="Shared photo"
      className="rounded-[var(--radius-md)] max-w-full max-h-[240px] object-cover mt-[4px] cursor-pointer"
      loading="lazy"
      onClick={() => window.open(mediaUrl, "_blank")}
    />
  );
});
MediaContent.displayName = "MediaContent";

/* ─── Bubble ─── */
interface ChatBubbleProps {
  message: ChatMessage;
  isSent: boolean;
  isLast: boolean;
  onRetry?: () => void;
  onDelete?: () => void;
}

const ChatBubble = memo(({ message, isSent, isLast, onRetry, onDelete }: ChatBubbleProps) => {
  const time = new Date(message.created_at).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  const isFailed = message._status === "failed";
  const isDeleted = !!message.is_deleted;
  const hasMedia = !isDeleted && !!message.media_url && !!message.media_type;
  const hasText = !isDeleted && !!message.content && message.content !== message.media_url;

  return (
    <div className={cn("transition-all duration-300 group", isSent ? "flex flex-col items-end" : "flex flex-col items-start")}>
      <div
        className={cn(
          "max-w-[75%] rounded-[18px] px-berry-2 py-[10px] transition-all duration-200 relative",
          isDeleted
            ? "bg-muted/50 border border-border/50"
            : isSent
              ? "berry-gradient text-primary-foreground rounded-br-[var(--radius-sm)] berry-shadow"
              : "bg-muted text-foreground rounded-bl-[var(--radius-sm)]",
          isFailed && "opacity-60",
          message._status === "sending" && "opacity-80"
        )}
      >
        {isDeleted ? (
          <p className="text-[var(--text-sm)] leading-relaxed italic text-muted-foreground">This message was deleted</p>
        ) : (
          <>
            {hasMedia && <MediaContent mediaUrl={message.media_url!} mediaType={message.media_type!} />}
            {hasText && <p className="text-[var(--text-sm)] leading-relaxed">{message.content}</p>}
            {!hasText && !hasMedia && <p className="text-[var(--text-sm)] leading-relaxed">{message.content}</p>}
          </>
        )}
        <p className="text-[var(--text-xs)] mt-[2px] text-right opacity-40">{time}</p>
        {/* Delete button for sent messages */}
        {isSent && !isDeleted && !isFailed && onDelete && (
          <button
            onClick={onDelete}
            className="absolute -left-8 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-opacity w-6 h-6 rounded-[var(--radius-full)] bg-destructive/10 flex items-center justify-center text-destructive hover:bg-destructive/20"
          >
            <Trash2 className="w-3 h-3" />
          </button>
        )}
      </div>
      {isFailed && onRetry && (
        <button onClick={onRetry} className="flex items-center gap-[4px] mt-[4px] text-[10px] text-destructive font-medium active:scale-95 transition-transform">
          <RotateCcw className="w-3 h-3" /> Failed · Tap to retry
        </button>
      )}
      {isSent && !isFailed && !isDeleted && <StatusIndicator status={message._status} isLast={isLast} />}
    </div>
  );
});
ChatBubble.displayName = "ChatBubble";

/* ─── Time formatting ─── */
function formatPreviewTime(dateStr: string): string {
  const date = new Date(dateStr);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

  if (diffDays === 0) {
    return date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  }
  if (diffDays === 1) return "Yesterday";
  if (diffDays < 7) {
    return date.toLocaleDateString([], { weekday: "short" });
  }
  return date.toLocaleDateString([], { month: "short", day: "numeric" });
}

/* ─── Conversation list item ─── */
interface ConvoItemProps {
  match: MatchWithProfile;
  active: boolean;
  onClick: () => void;
  lastMessage?: Message;
}

const ConvoItem = ({ match, active, onClick, lastMessage }: ConvoItemProps) => {
  const previewText = lastMessage
    ? lastMessage.is_deleted
      ? "This message was deleted"
      : lastMessage.media_url
        ? "📷 Photo"
        : lastMessage.content
    : "Start chatting 🍓";

  const timeLabel = lastMessage
    ? formatPreviewTime(lastMessage.created_at)
    : formatPreviewTime(match.created_at);

  return (
    <button
      onClick={onClick}
      className={cn(
        "w-full flex items-center gap-berry-2 px-berry-2 py-berry-2 rounded-[var(--radius-md)] transition-all active:scale-[0.98]",
        active ? "bg-primary/10 border border-primary/20" : "hover:bg-muted/60"
      )}
    >
      <div className="relative flex-shrink-0">
        <BerryAvatar name={match.partner.name} size="md" />
        <div className="absolute -bottom-[1px] -right-[1px] w-[10px] h-[10px] rounded-[var(--radius-full)] bg-primary border-2 border-card" />
      </div>
      <div className="flex-1 min-w-0 text-left">
        <div className="flex items-center justify-between">
          <p className="text-[var(--text-sm)] font-semibold text-foreground truncate">
            {match.partner.name}
          </p>
          <span className="text-[10px] text-muted-foreground flex-shrink-0 ml-berry-1">{timeLabel}</span>
        </div>
        <p className={cn(
          "text-[var(--text-xs)] truncate",
          lastMessage ? "text-muted-foreground" : "text-muted-foreground/60 italic"
        )}>
          {previewText}
        </p>
      </div>
    </button>
  );
};

/* ─── Chat empty state ─── */
const ChatEmptyState = () => (
  <div className="flex flex-col items-center justify-center py-berry-6 space-y-berry-2 animate-fade-in">
    <div className="w-[64px] h-[64px] rounded-[var(--radius-full)] berry-gradient flex items-center justify-center berry-shadow">
      <BerryLogo size="md" />
    </div>
    <div className="text-center space-y-[4px]">
      <p className="text-[var(--text-base)] font-semibold text-foreground">Start something meaningful 🍓</p>
      <p className="text-[var(--text-sm)] text-muted-foreground max-w-[240px] leading-relaxed">
        Ask something they'll remember — the best conversations start with curiosity.
      </p>
    </div>
  </div>
);

/* ─── No matches empty state ─── */
const NoMatchesState = ({ onExplore }: { onExplore: () => void }) => (
  <div className="flex-1 flex items-center justify-center">
    <div className="text-center space-y-berry-2 animate-fade-in px-berry-3">
      <div className="w-[72px] h-[72px] rounded-[var(--radius-full)] berry-gradient flex items-center justify-center mx-auto berry-shadow">
        <BerryLogo size="lg" />
      </div>
      <p className="text-[var(--text-base)] font-semibold text-foreground">No conversations yet 🍓</p>
      <p className="text-[var(--text-sm)] text-muted-foreground max-w-[240px] mx-auto leading-relaxed">
        Start matching with people to begin chatting. Your conversations will show up here.
      </p>
      <BerryButton onClick={onExplore}>Explore People 🍓</BerryButton>
    </div>
  </div>
);

/* ─── Select prompt ─── */
const SelectPrompt = () => (
  <div className="flex-1 flex items-center justify-center">
    <div className="text-center space-y-berry-2 animate-fade-in">
      <BerryLogo size="lg" className="mx-auto opacity-40" />
      <p className="text-[var(--text-sm)] text-muted-foreground">Select a conversation to start chatting</p>
    </div>
  </div>
);

/* ═══════════════════════════════════════════════════ */
/*  MAIN PAGE                                         */
/* ═══════════════════════════════════════════════════ */

const ChatPage = () => {
  const navigate = useNavigate();
  const { matchId } = useParams<{ matchId: string }>();
  const { authUser } = useAuthContext();
  const demo = useDemoContext();
  const isDemo = demo?.isDemo ?? false;
  const userId = isDemo ? DEMO_USER_ID : authUser?.id;

  /* ─── Matches (conversation list) ─── */
  const { data: realMatches, isLoading: matchesLoading } = useMatches(isDemo ? undefined : authUser?.id);
  const rawMatches = isDemo ? demo?.getMatches() ?? [] : realMatches ?? [];

  /* ─── Chat previews ─── */
  const matchIds = useMemo(() => rawMatches.map((m) => m.id), [rawMatches]);
  const { previews } = useChatPreviews(isDemo ? [] : matchIds);

  /* ─── Sort matches by last message time (most recent first) ─── */
  const matches = useMemo(() => {
    return [...rawMatches].sort((a, b) => {
      const timeA = previews[a.id]?.created_at ?? a.created_at;
      const timeB = previews[b.id]?.created_at ?? b.created_at;
      return new Date(timeB).getTime() - new Date(timeA).getTime();
    });
  }, [rawMatches, previews]);

  /* ─── Chat ─── */
  const realChat = useChat(isDemo ? undefined : matchId);

  const [demoMsgs, setDemoMsgs] = useState<ChatMessage[]>([]);
  const [demoSending, setDemoSending] = useState(false);

  useEffect(() => {
    if (isDemo && matchId && demo) {
      setDemoMsgs(demo.getMessages(matchId).map((m) => ({ ...m, _status: "sent" as MessageStatus })));
    }
  }, [isDemo, matchId, demo]);

  useEffect(() => {
    if (!isDemo || !matchId || !demo) return;
    const interval = setInterval(() => {
      const latest = demo.getMessages(matchId);
      if (latest.length !== demoMsgs.length) {
        setDemoMsgs(latest.map((m) => ({ ...m, _status: "sent" as MessageStatus })));
        setDemoSending(false);
      }
    }, 500);
    return () => clearInterval(interval);
  }, [isDemo, matchId, demo, demoMsgs.length]);

  const messages = isDemo ? demoMsgs : realChat.messages;
  const isLoading = isDemo ? false : realChat.isLoading;
  const error = isDemo ? null : realChat.error;

  const [input, setInput] = useState("");
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const activeMatch = matches.find((m) => m.id === matchId);
  const partnerName = activeMatch?.partner?.name ?? "Chat";

  useEffect(() => {
    if (matchId) setTimeout(() => inputRef.current?.focus(), 300);
  }, [matchId]);

  const scrollToBottom = useCallback((smooth = true) => {
    messagesEndRef.current?.scrollIntoView({ behavior: smooth ? "smooth" : "instant" });
  }, []);

  useEffect(() => {
    scrollToBottom(messages.length > 1);
  }, [messages.length, scrollToBottom]);

  const handleSend = useCallback(
    (text?: string) => {
      const msgText = (text ?? input).trim();
      if (!msgText || !userId) return;

      if (isDemo && matchId && demo) {
        setDemoSending(true);
        const msg = demo.sendMessage(matchId, msgText);
        setDemoMsgs((prev) => [...prev, { ...msg, _status: "sent" as MessageStatus }]);
      } else {
        realChat.send(userId, msgText);
      }

      setInput("");
      inputRef.current?.focus();
    },
    [input, userId, isDemo, matchId, demo, realChat]
  );

  const handleFileSelect = useCallback(
    async (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (!file || !userId || isDemo) return;
      const isValid = file.type.startsWith("image/") || file.type.startsWith("video/");
      if (!isValid || file.size > 20 * 1024 * 1024) return;
      await realChat.sendMedia(userId, file);
      if (fileInputRef.current) fileInputRef.current.value = "";
    },
    [userId, isDemo, realChat]
  );

  /* ─── No matches at all ─── */
  if (!matchesLoading && matches.length === 0) {
    return (
      <div className="h-screen bg-background flex flex-col pb-[80px]">
        <div className="bg-card/90 backdrop-blur-xl border-b border-border px-berry-2 py-berry-2 z-10">
          <div className="max-w-md mx-auto flex items-center gap-berry-1">
            <BerryLogo size="lg" />
            <span className="text-[var(--text-lg)] font-bold berry-gradient-text">Chats</span>
          </div>
        </div>
        <NoMatchesState onExplore={() => navigate("/explore")} />
        <BottomNav />
      </div>
    );
  }

  /* ─── Conversation list (no chat selected) ─── */
  if (!matchId) {
    return (
      <div className="h-screen bg-background flex flex-col pb-[80px]">
        <div className="bg-card/90 backdrop-blur-xl border-b border-border px-berry-2 py-berry-2 z-10">
          <div className="max-w-md mx-auto flex items-center gap-berry-1">
            <BerryLogo size="lg" />
            <span className="text-[var(--text-lg)] font-bold berry-gradient-text">Chats</span>
            <span className="ml-auto text-[var(--text-xs)] text-muted-foreground">{matches.length} conversations</span>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto">
          <div className="max-w-md mx-auto py-berry-2 px-berry-1 space-y-[2px]">
            {matchesLoading
              ? [0, 1, 2].map((i) => (
                  <div key={i} className="flex items-center gap-berry-2 px-berry-2 py-berry-2 animate-pulse">
                    <div className="w-[44px] h-[44px] rounded-[var(--radius-full)] bg-muted" />
                    <div className="flex-1 space-y-[6px]">
                      <div className="h-4 bg-muted rounded-[var(--radius-md)] w-1/3" />
                      <div className="h-3 bg-muted rounded-[var(--radius-md)] w-2/3" />
                    </div>
                  </div>
                ))
              : matches.map((match) => (
                  <ConvoItem
                    key={match.id}
                    match={match}
                    active={false}
                    onClick={() => navigate(`/chat/${match.id}`)}
                    lastMessage={previews[match.id]}
                  />
                ))}
          </div>
        </div>

        <BottomNav />
      </div>
    );
  }

  /* ─── Active chat ─── */
  return (
    <div className="h-screen bg-background flex flex-col">
      {/* Header */}
      <div className="bg-card/90 backdrop-blur-xl border-b border-border px-berry-2 py-berry-1 z-10">
        <div className="max-w-md mx-auto flex items-center gap-berry-1">
          <button
            onClick={() => navigate("/chat")}
            className="w-[36px] h-[36px] rounded-[var(--radius-full)] bg-muted flex items-center justify-center text-muted-foreground active:scale-95 transition-all"
          >
            <ArrowLeft className="w-4 h-4" />
          </button>
          <div className="relative">
            <BerryAvatar name={partnerName} size="sm" />
            <div className="absolute -bottom-[2px] -right-[2px] w-[12px] h-[12px] rounded-[var(--radius-full)] bg-primary border-2 border-card" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="font-semibold text-[var(--text-sm)] text-foreground leading-tight truncate">{partnerName}</p>
            <p className="text-[var(--text-xs)] text-primary font-medium">Active now</p>
          </div>
          <BerryLogo size="sm" className="opacity-40" />
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-berry-2 py-berry-2 scroll-smooth">
        <div className="max-w-md mx-auto space-y-[6px]">
          {isLoading && (
            <div className="flex items-center justify-center py-berry-6">
              <BerryLogo size="lg" className="animate-pulse" />
            </div>
          )}
          {error && (
            <div className="bg-destructive/10 text-destructive text-[var(--text-sm)] rounded-[var(--radius-md)] px-berry-2 py-berry-2 text-center">
              Failed to load messages. Pull down to retry.
            </div>
          )}
          {!isLoading && !error && messages.length === 0 && <ChatEmptyState />}
          {messages.map((msg, idx) => {
            const isSent = msg.sender_id === userId;
            const isLastSent = isSent && messages.slice(idx + 1).every((m) => m.sender_id !== userId);
            return (
              <ChatBubble
                key={msg._tempId ?? msg.id}
                message={msg}
                isSent={isSent}
                isLast={isLastSent}
                onRetry={msg._status === "failed" && msg._tempId ? () => realChat.retry(msg._tempId!) : undefined}
                onDelete={isSent && !msg.is_deleted && !msg._tempId && userId ? () => realChat.deleteMessage(msg.id, userId) : undefined}
              />
            );
          })}
          {(demoSending || (!isDemo && realChat.isSending)) && <TypingIndicator />}
          <div ref={messagesEndRef} />
        </div>
      </div>

      {/* Icebreakers */}
      {messages.length === 0 && !isLoading && (
        <div className="px-berry-2 pb-berry-1 animate-fade-in">
          <div className="max-w-md mx-auto flex gap-berry-1 overflow-x-auto scrollbar-hide pb-[2px]">
            {icebreakers.map((text) => (
              <button
                key={text}
                onClick={() => handleSend(text)}
                className="flex-shrink-0 px-berry-2 py-berry-1 rounded-[var(--radius-full)] text-[var(--text-xs)] font-medium bg-primary/10 text-primary border border-primary/15 active:scale-95 transition-all whitespace-nowrap"
              >
                {text}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Input */}
      <div className="bg-card/90 backdrop-blur-xl border-t border-border px-berry-2 py-berry-1">
        <div className="max-w-md mx-auto flex items-center gap-berry-1">
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*,video/*"
            className="hidden"
            onChange={handleFileSelect}
          />
          <button
            onClick={() => fileInputRef.current?.click()}
            className="w-[44px] h-[44px] rounded-[var(--radius-full)] bg-muted flex items-center justify-center text-muted-foreground active:scale-95 transition-all hover:bg-primary/10 hover:text-primary"
          >
            <ImagePlus className="w-5 h-5" />
          </button>
          <input
            ref={inputRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && !e.shiftKey && handleSend()}
            placeholder="Say something interesting…"
            className="flex-1 rounded-[var(--radius-full)] border border-border bg-background px-berry-3 py-berry-1 text-[var(--text-sm)] text-foreground placeholder:text-muted-foreground/60 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary/40 transition-all duration-200"
          />
          <button
            onClick={() => handleSend()}
            disabled={!input.trim()}
            className={cn(
              "w-[44px] h-[44px] rounded-[var(--radius-full)] flex items-center justify-center transition-all duration-200 active:scale-90",
              input.trim() ? "berry-gradient berry-shadow" : "bg-muted text-muted-foreground"
            )}
          >
            <Send className={cn("w-[18px] h-[18px] transition-transform duration-200", input.trim() ? "text-primary-foreground translate-x-[1px] -translate-y-[1px]" : "")} />
          </button>
        </div>
      </div>

      <style>{`
        @keyframes berry-typing {
          0%, 60%, 100% { transform: translateY(0); opacity: 0.4; }
          30% { transform: translateY(-6px); opacity: 1; }
        }
      `}</style>
    </div>
  );
};

export default ChatPage;
