export interface UserProfile {
  id: string;
  name: string;
  age: number;
  bio: string;
  interests: string[];
  level: number;
  response_rate: number;
  created_at: string;
}

export interface Match {
  id: string;
  user1_id: string;
  user2_id: string;
  match_reason?: string;
  created_at: string;
}

export interface MatchWithProfile extends Match {
  partner: UserProfile;
}

export interface Message {
  id: string;
  match_id: string;
  sender_id: string;
  content: string;
  media_url?: string;
  media_type?: "image" | "video" | "audio";
  audio_path?: string;
  audio_duration?: number;
  is_deleted?: boolean;
  deleted_at?: string;
  created_at: string;
}

export interface CreateUserProfileData {
  id: string;
  name: string;
  age: number;
  bio?: string;
  interests?: string[];
}

export interface UpdateUserProfileData {
  name?: string;
  age?: number;
  bio?: string;
  interests?: string[];
  level?: number;
  response_rate?: number;
}
