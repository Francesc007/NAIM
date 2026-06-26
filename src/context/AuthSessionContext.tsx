import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import type { Session } from '@supabase/supabase-js';
import { supabase } from '../lib/supabase';
import { navigateToHome } from '../navigation/navigationRef';
import {
  clearWantsLoginScreen,
  consumeWantsLoginScreen,
  markWantsLoginScreen,
  subscribeToAuthUrls,
  type AuthLinkNotice,
} from '../services/authService';
import { handleUserIdChanged } from '../services/identityTransitionService';

type AuthSessionContextValue = {
  session: Session | null;
  booting: boolean;
  prefersLogin: boolean;
  authLinkNotice: AuthLinkNotice | null;
  refreshSession: () => Promise<void>;
  applySession: (nextSession: Session | null) => void;
  requestLoginScreen: () => Promise<void>;
  clearAuthLinkNotice: () => void;
};

const AuthSessionContext = createContext<AuthSessionContextValue | null>(null);

export function AuthSessionProvider({ children }: { children: React.ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [booting, setBooting] = useState(true);
  const [prefersLogin, setPrefersLogin] = useState(false);
  const [authLinkNotice, setAuthLinkNotice] = useState<AuthLinkNotice | null>(null);
  const previousUserIdRef = useRef<string | null>(null);

  const clearAuthLinkNotice = useCallback(() => setAuthLinkNotice(null), []);

  const refreshSession = useCallback(async () => {
    if (!supabase) {
      setSession(null);
      return;
    }
    const { data } = await supabase.auth.getSession();
    setSession(data.session);
  }, []);

  const applySession = useCallback((nextSession: Session | null) => {
    setSession(nextSession);
  }, []);

  const requestLoginScreen = useCallback(async () => {
    await markWantsLoginScreen();
    setPrefersLogin(true);
    setSession(null);
  }, []);

  useEffect(() => {
    if (!supabase) {
      setBooting(false);
      return;
    }

    let mounted = true;

    const bootstrap = async () => {
      try {
        const { data } = await supabase.auth.getSession();
        if (data.session) {
          if (mounted) {
            previousUserIdRef.current = data.session.user.id;
            setSession(data.session);
          }
          return;
        }

        const wantsLogin = await consumeWantsLoginScreen();
        if (mounted) setPrefersLogin(wantsLogin);
        if (wantsLogin) {
          if (mounted) setSession(null);
          return;
        }
        if (mounted) setSession(null);
      } catch (err) {
        console.warn('[NAIM] Auth bootstrap:', err);
      } finally {
        if (mounted) setBooting(false);
      }
    };

    void bootstrap();

    const { data: authListener } = supabase.auth.onAuthStateChange((_event, nextSession) => {
      const previousUserId = previousUserIdRef.current;
      const nextUserId = nextSession?.user.id ?? null;

      if (nextUserId && previousUserId !== nextUserId) {
        void handleUserIdChanged(previousUserId, nextUserId);
      }

      previousUserIdRef.current = nextUserId;
      setSession(nextSession);

      if (nextSession) {
        setPrefersLogin(false);
        void clearWantsLoginScreen();
      }
    });

    const unsubscribeLinks = subscribeToAuthUrls(
      (notice) => {
        void refreshSession();
        if (notice.kind === 'login' || notice.kind === undefined) {
          navigateToHome();
          setAuthLinkNotice(notice);
          return;
        }
        setAuthLinkNotice(notice);
      },
      (message) => setAuthLinkNotice({ type: 'error', message, kind: 'email_confirm' })
    );

    return () => {
      mounted = false;
      authListener.subscription.unsubscribe();
      unsubscribeLinks();
    };
  }, [refreshSession]);

  const value = useMemo(
    () => ({
      session,
      booting,
      prefersLogin,
      authLinkNotice,
      refreshSession,
      applySession,
      requestLoginScreen,
      clearAuthLinkNotice,
    }),
    [
      session,
      booting,
      prefersLogin,
      authLinkNotice,
      refreshSession,
      applySession,
      requestLoginScreen,
      clearAuthLinkNotice,
    ]
  );

  return <AuthSessionContext.Provider value={value}>{children}</AuthSessionContext.Provider>;
}

export function useAuthSession() {
  const ctx = useContext(AuthSessionContext);
  if (!ctx) throw new Error('useAuthSession must be used within AuthSessionProvider');
  return ctx;
}
