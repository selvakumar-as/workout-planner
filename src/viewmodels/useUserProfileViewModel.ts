import { useUserProfileStore } from "../stores/userProfileStore";
import type { UserProfile } from "../types/userProfile";

export function useUserProfileViewModel() {
  const profile = useUserProfileStore((s) => s.profile);
  const updateProfile = useUserProfileStore((s) => s.updateProfile);
  const isProfileComplete = (profile.weightKg !== undefined && profile.weightKg > 0);
  return {
    profile,
    updateProfile,
    isProfileComplete,
    setSoundEnabled: (v: boolean) => updateProfile({ soundEnabled: v }),
  };
}
