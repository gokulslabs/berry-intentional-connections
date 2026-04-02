import { createContext, useContext, useState, useCallback } from "react";
import type { UserProfile, MatchWithProfile, Message } from "@/types/database";
import {
  DEMO_USER_ID,
  demoProfile,
  demoMatches,
  demoMessages,
} from "@/data/demoData";

interface DemoContextType {
  isDemo: boolean;
  enterDemo: () => void;
  exitDemo: () => void;
  demoUserId: string;
  demoProfile: UserProfile;
  getMatches: () => MatchWithProfile[];
  getMessages: (matchId: string) => Message[];
  sendMessage: (matchId: string, content: string) => Message;
}

const DemoContext = createContext<DemoContextType | null>(null);

export const useDemoContext = () => useContext(DemoContext);
export const useDemoMode = () => {
  const ctx = useContext(DemoContext);
  return ctx?.isDemo ?? false;
};

export const DemoProvider = ({ children }: { children: React.ReactNode }) => {
  const [isDemo, setIsDemo] = useState(false);
  const [messages, setMessages] = useState<Record<string, Message[]>>({ ...demoMessages });

  const enterDemo = useCallback(() => setIsDemo(true), []);
  const exitDemo = useCallback(() => {
    setIsDemo(false);
    setMessages({ ...demoMessages });
  }, []);

  const getMatches = useCallback(() => demoMatches, []);

  const getMessages = useCallback(
    (matchId: string) => messages[matchId] ?? [],
    [messages]
  );

  const sendMessage = useCallback(
    (matchId: string, content: string): Message => {
      const msg: Message = {
        id: `demo-msg-${Date.now()}`,
        match_id: matchId,
        sender_id: DEMO_USER_ID,
        content,
        created_at: new Date().toISOString(),
      };
      setMessages((prev) => ({
        ...prev,
        [matchId]: [...(prev[matchId] ?? []), msg],
      }));

      setTimeout(() => {
        const replies = [
          "That's so cool! Tell me more 😊",
          "Haha I love that! 🍓",
          "No way, me too!",
          "Great taste ✨",
          "We should totally do that sometime!",
        ];
        const reply: Message = {
          id: `demo-msg-reply-${Date.now()}`,
          match_id: matchId,
          sender_id: demoMatches.find((m) => m.id === matchId)?.partner.id ?? "demo-partner-001",
          content: replies[Math.floor(Math.random() * replies.length)],
          created_at: new Date().toISOString(),
        };
        setMessages((prev) => ({
          ...prev,
          [matchId]: [...(prev[matchId] ?? []), reply],
        }));
      }, 1500 + Math.random() * 2000);

      return msg;
    },
    []
  );

  return (
    <DemoContext.Provider
      value={{
        isDemo,
        enterDemo,
        exitDemo,
        demoUserId: DEMO_USER_ID,
        demoProfile,
        getMatches,
        getMessages,
        sendMessage,
      }}
    >
      {children}
    </DemoContext.Provider>
  );
};
