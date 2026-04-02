import type { UserProfile, MatchWithProfile, Message } from "@/types/database";

export const DEMO_USER_ID = "demo-user-000-000-000";

export const demoProfile: UserProfile = {
  id: DEMO_USER_ID,
  name: "Alex",
  age: 25,
  bio: "Design nerd who loves hiking, anime, and late-night coding sessions. Looking for someone who actually tries. 🍓",
  interests: ["Hiking", "Design", "Anime", "Coffee", "Travel"],
  level: 3,
  response_rate: 87,
  created_at: new Date(Date.now() - 30 * 86400000).toISOString(),
};

const demoPartners: UserProfile[] = [
  {
    id: "demo-partner-001",
    name: "Mia",
    age: 24,
    bio: "Illustrator by day, anime binger by night. Let's talk about your favorite Studio Ghibli film ✨",
    interests: ["Anime", "Art", "Coffee", "Cooking", "Travel"],
    level: 4,
    response_rate: 92,
    created_at: new Date(Date.now() - 20 * 86400000).toISOString(),
  },
  {
    id: "demo-partner-002",
    name: "Jordan",
    age: 26,
    bio: "Trail runner & product designer. I make apps and sourdough bread with equal passion 🍞",
    interests: ["Hiking", "Design", "Running", "Photography"],
    level: 2,
    response_rate: 78,
    created_at: new Date(Date.now() - 15 * 86400000).toISOString(),
  },
  {
    id: "demo-partner-003",
    name: "Sakura",
    age: 23,
    bio: "Exchange student from Tokyo. Love discovering new coffee spots and watching sunsets 🌅",
    interests: ["Coffee", "Travel", "Anime", "Music", "Reading"],
    level: 5,
    response_rate: 95,
    created_at: new Date(Date.now() - 10 * 86400000).toISOString(),
  },
];

export const demoMatches: MatchWithProfile[] = [
  {
    id: "demo-match-001",
    user1_id: DEMO_USER_ID,
    user2_id: "demo-partner-001",
    match_reason: "You both love Anime and Coffee 🍓",
    created_at: new Date(Date.now() - 3600000).toISOString(),
    partner: demoPartners[0],
  },
  {
    id: "demo-match-002",
    user1_id: DEMO_USER_ID,
    user2_id: "demo-partner-002",
    match_reason: "You share a passion for Hiking ✨",
    created_at: new Date(Date.now() - 7200000).toISOString(),
    partner: demoPartners[1],
  },
  {
    id: "demo-match-003",
    user1_id: DEMO_USER_ID,
    user2_id: "demo-partner-003",
    match_reason: "Close in age and vibes align 💫",
    created_at: new Date(Date.now() - 10800000).toISOString(),
    partner: demoPartners[2],
  },
];

export const demoMessages: Record<string, Message[]> = {
  "demo-match-001": [
    {
      id: "msg-001",
      match_id: "demo-match-001",
      sender_id: "demo-partner-001",
      content: "Hey! I saw you love anime too — what's your all-time favorite? 🍥",
      created_at: new Date(Date.now() - 3000000).toISOString(),
    },
    {
      id: "msg-002",
      match_id: "demo-match-001",
      sender_id: DEMO_USER_ID,
      content: "Spirited Away, no contest! Hbu?",
      created_at: new Date(Date.now() - 2700000).toISOString(),
    },
    {
      id: "msg-003",
      match_id: "demo-match-001",
      sender_id: "demo-partner-001",
      content: "Taste! Mine's Howl's Moving Castle 🏰 We should do a Ghibli marathon sometime",
      created_at: new Date(Date.now() - 2400000).toISOString(),
    },
  ],
  "demo-match-002": [],
  "demo-match-003": [],
};
