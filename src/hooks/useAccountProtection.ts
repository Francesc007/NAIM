import { useCallback, useEffect, useState } from 'react';
import {
  isAccountDataProtected,
  needsSyncRecommendation,
  type AccountProtectionProfile,
} from '../services/accountProtectionService';
import { getProfileFromSupabase } from '../services/profileService';

const EMPTY_PROFILE: AccountProtectionProfile = {
  email: null,
  emailConfirmed: false,
  isAnonymous: true,
};

export function useAccountProtection() {
  const [profile, setProfile] = useState<AccountProtectionProfile>(EMPTY_PROFILE);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    setLoading(true);
    try {
      const remote = await getProfileFromSupabase();
      setProfile({
        email: remote.email,
        emailConfirmed: remote.emailConfirmed,
        isAnonymous: remote.isAnonymous,
      });
    } catch {
      setProfile(EMPTY_PROFILE);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  return {
    loading,
    profile,
    refresh,
    isProtected: isAccountDataProtected(profile),
    needsSync: needsSyncRecommendation(profile),
  };
}
