import { create } from "zustand";
import { MMKVLoader } from "react-native-mmkv-storage";
import { UserProfileSchema } from "../types/userProfile";
import type { UserProfile } from "../types/userProfile";

const storage = new MMKVLoader().withInstanceID("user-profile").initialize();

function loadProfile(): UserProfile {
  const raw = storage.getString("profile");
  if (!raw) return { soundEnabled: true };
  try {
    return UserProfileSchema.parse(JSON.parse(raw));
  } catch {
    return { soundEnabled: true };
  }
}

interface UserProfileState {
  profile: UserProfile;
  updateProfile: (patch: Partial<UserProfile>) => void;
}

export const useUserProfileStore = create<UserProfileState>((set) => ({
  profile: loadProfile(),
  updateProfile: (patch) => {
    set((state) => {
      const next = { ...state.profile, ...patch };
      storage.setString("profile", JSON.stringify(next));
      return { profile: next };
    });
  },
}));
