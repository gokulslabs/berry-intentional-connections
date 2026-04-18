import type { UserProfile } from "@/types/database";

export interface CompatibilityResult {
  score: number; // 0-100
  reason: string;
  sharedInterests: string[];
  ageProximity: number; // 0-5 (5 = within 1 year)
  breakdown: {
    interests: number; // 0-50
    age: number;       // 0-25
    activity: number;  // 0-15 (response_rate)
    level: number;     // 0-10
  };
}

/**
 * Compute compatibility between two profiles. Pure, deterministic, used both
 * client-side (UI display) and as a sort key.
 */
export function computeCompatibility(
  me: Pick<UserProfile, "interests" | "age">,
  them: Pick<UserProfile, "interests" | "age" | "response_rate" | "level">
): CompatibilityResult {
  const myInterests = me.interests ?? [];
  const theirInterests = them.interests ?? [];
  const shared = myInterests.filter((i) => theirInterests.includes(i));

  // Interests: up to 50 pts (10 pts per shared, capped at 5)
  const interestsPts = Math.min(shared.length, 5) * 10;

  // Age proximity: 25 pts max, falls off after 5y gap
  const ageGap = Math.abs((me.age ?? 0) - (them.age ?? 0));
  const ageProximity = Math.max(0, 5 - ageGap);
  const agePts = Math.round(ageProximity * 5);

  // Activity (response_rate 0-100): up to 15 pts
  const activityPts = Math.round(((them.response_rate ?? 0) / 100) * 15);

  // Level: up to 10 pts (level 5 = full)
  const levelPts = Math.min(them.level ?? 1, 5) * 2;

  const score = Math.min(100, interestsPts + agePts + activityPts + levelPts);

  let reason: string;
  if (shared.length >= 3) {
    reason = `You both love ${shared.slice(0, 2).join(" & ")} 🍓`;
  } else if (shared.length >= 1) {
    reason = `You share a passion for ${shared[0]} ✨`;
  } else if (ageProximity >= 4) {
    reason = "Close in age and vibes align 💫";
  } else if ((them.response_rate ?? 0) >= 80) {
    reason = "Active and responsive — great chat energy ⚡";
  } else {
    reason = "We think you'd get along 🌸";
  }

  return {
    score,
    reason,
    sharedInterests: shared,
    ageProximity,
    breakdown: {
      interests: interestsPts,
      age: agePts,
      activity: activityPts,
      level: levelPts,
    },
  };
}

export function compatibilityTier(score: number): {
  label: string;
  className: string;
} {
  if (score >= 80) return { label: "Perfect match", className: "bg-primary text-primary-foreground" };
  if (score >= 60) return { label: "Great match", className: "bg-primary/15 text-primary" };
  if (score >= 40) return { label: "Good match", className: "bg-accent/15 text-accent-foreground" };
  return { label: "Worth a look", className: "bg-muted text-muted-foreground" };
}
