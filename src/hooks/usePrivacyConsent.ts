import { useCallback, useEffect, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

const CONSENT_KEY = '@naim_ai_consent_v1';

export function usePrivacyConsent() {
  const [hasConsent, setHasConsent] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    AsyncStorage.getItem(CONSENT_KEY)
      .then((value) => {
        setHasConsent(value === 'true');
      })
      .finally(() => setLoading(false));
  }, []);

  const acceptConsent = useCallback(async () => {
    await AsyncStorage.setItem(CONSENT_KEY, 'true');
    setHasConsent(true);
  }, []);

  const revokeConsent = useCallback(async () => {
    await AsyncStorage.removeItem(CONSENT_KEY);
    setHasConsent(false);
  }, []);

  return { hasConsent, loading, acceptConsent, revokeConsent };
}
