import { createContext, useContext, useMemo, useState, type PropsWithChildren } from 'react';

import {
  createDemoSession, isAuthConfigured, signInWithPassword, signOutSession, signUpWithPassword,
  type AuthSession,
} from '@/lib/auth-api';

type AuthContextValue = {
  session: AuthSession | null;
  configured: boolean;
  busy: boolean;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (email: string, password: string) => Promise<'signed-in' | 'verify-email'>;
  useDemo: () => void;
  signOut: () => Promise<void>;
};

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: PropsWithChildren) {
  const [session, setSession] = useState<AuthSession | null>(null);
  const [busy, setBusy] = useState(false);

  const value = useMemo<AuthContextValue>(() => ({
    session, configured: isAuthConfigured, busy,
    async signIn(email, password) {
      setBusy(true);
      try { setSession(await signInWithPassword(email.trim(), password)); }
      finally { setBusy(false); }
    },
    async signUp(email, password) {
      setBusy(true);
      try {
        const result = await signUpWithPassword(email.trim(), password);
        if (result.session) { setSession(result.session); return 'signed-in'; }
        return 'verify-email';
      } finally { setBusy(false); }
    },
    useDemo() { setSession(createDemoSession()); },
    async signOut() {
      const current = session;
      setSession(null);
      if (current && !current.demo) await signOutSession(current.accessToken).catch(() => undefined);
    },
  }), [busy, session]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const value = useContext(AuthContext);
  if (!value) throw new Error('useAuth must be used inside AuthProvider.');
  return value;
}
