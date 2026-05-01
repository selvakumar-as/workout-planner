import { useUserProfileStore } from "../stores/userProfileStore";
import type { UserProfile } from "../types/userProfile";

export function useUserProfileViewModel() {
  const profile = useUserProfileStore((s) => s.profile);
  const updateProfile = useUserProfileStore((s) => s.updateProfile);
  return {
    profile,
    updateProfile,
    setSoundEnabled: (v: boolean) => updateProfile({ soundEnabled: v }),
  };
}
