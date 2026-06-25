import React, { createContext, useCallback, useContext, useEffect, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { supabase } from '../lib/supabase';
import { getProfileFromSupabase, resolveProfileImageUrl } from '../services/profileService';

const USER_NAME_KEY = '@guardarropa_user_name';
const USER_AVATAR_KEY = '@guardarropa_user_avatar';

/** Placeholder de perfil cuando el usuario aún no personalizó su nombre. */
export const GUEST_DISPLAY_NAME = 'NAIM';

export function getUserDisplayName(userName: string | null | undefined): string {
  const trimmed = userName?.trim();
  return trimmed || GUEST_DISPLAY_NAME;
}

export function getUserInitial(userName: string | null | undefined): string {
  return getUserDisplayName(userName).slice(0, 1).toUpperCase();
}

interface UserContextType {
  userName: string | null;
  avatarUrl: string | null;
  avatarDisplayUrl: string | null;
  setUserName: (name: string | null) => Promise<void>;
  setAvatarUrl: (url: string | null) => Promise<void>;
  resetLocalProfile: () => Promise<void>;
  isLoading: boolean;
}

const UserContext = createContext<UserContextType | undefined>(undefined);

export function UserProvider({ children }: { children: React.ReactNode }) {
  const [userName, setUserNameState] = useState<string | null>(null);
  const [avatarUrl, setAvatarUrlState] = useState<string | null>(null);
  const [avatarDisplayUrl, setAvatarDisplayUrl] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const applyRemoteProfile = useCallback(async () => {
    try {
      const profile = await getProfileFromSupabase();
      if (profile.avatarUrl) {
        setAvatarUrlState(profile.avatarUrl);
        await AsyncStorage.setItem(USER_AVATAR_KEY, profile.avatarUrl);
      }
      if (profile.displayName) {
        setUserNameState((prev) => prev ?? profile.displayName);
        const storedName = await AsyncStorage.getItem(USER_NAME_KEY);
        if (!storedName) {
          await AsyncStorage.setItem(USER_NAME_KEY, profile.displayName);
        }
      }
    } catch {
      // Sin sesión remota todavía: mantenemos cache local.
    }
  }, []);

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const [storedName, storedAvatar] = await Promise.all([
          AsyncStorage.getItem(USER_NAME_KEY),
          AsyncStorage.getItem(USER_AVATAR_KEY),
        ]);
        if (!mounted) return;
        setUserNameState(storedName || null);
        setAvatarUrlState(storedAvatar || null);
        await applyRemoteProfile();
      } finally {
        if (mounted) setIsLoading(false);
      }
    })();
    return () => {
      mounted = false;
    };
  }, [applyRemoteProfile]);

  useEffect(() => {
    if (!supabase) return;
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session) void applyRemoteProfile();
    });
    return () => subscription.unsubscribe();
  }, [applyRemoteProfile]);

  useEffect(() => {
    let mounted = true;
    void (async () => {
      const resolved = await resolveProfileImageUrl(avatarUrl);
      if (mounted) setAvatarDisplayUrl(resolved);
    })();
    return () => {
      mounted = false;
    };
  }, [avatarUrl]);

  const setUserName = async (name: string | null) => {
    if (name?.trim()) {
      await AsyncStorage.setItem(USER_NAME_KEY, name.trim());
      setUserNameState(name.trim());
    } else {
      await AsyncStorage.removeItem(USER_NAME_KEY);
      setUserNameState(null);
    }
  };

  const setAvatarUrl = async (url: string | null) => {
    if (url?.trim()) {
      await AsyncStorage.setItem(USER_AVATAR_KEY, url.trim());
      setAvatarUrlState(url.trim());
    } else {
      await AsyncStorage.removeItem(USER_AVATAR_KEY);
      setAvatarUrlState(null);
    }
  };

  const resetLocalProfile = async () => {
    await AsyncStorage.multiRemove([USER_NAME_KEY, USER_AVATAR_KEY]);
    setUserNameState(null);
    setAvatarUrlState(null);
    setAvatarDisplayUrl(null);
  };

  return (
    <UserContext.Provider
      value={{
        userName,
        avatarUrl,
        avatarDisplayUrl,
        setUserName,
        setAvatarUrl,
        resetLocalProfile,
        isLoading,
      }}
    >
      {children}
    </UserContext.Provider>
  );
}

export function useUser() {
  const ctx = useContext(UserContext);
  if (!ctx) throw new Error('useUser must be used within UserProvider');
  return ctx;
}
