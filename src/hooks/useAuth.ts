import { useEffect, useState, useCallback } from 'react';
import { login as apiLogin, signup as apiSignup, me as apiMe, logout as apiLogout, type AuthUser } from '../services/authService';

export function useAuth() {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      try {
        const token = sessionStorage.getItem('auth-token');
        if (!token) { setLoading(false); return; }
        const u = await apiMe();
        setUser(u);
      } catch (e: any) {
        sessionStorage.removeItem('auth-token');
        setError(e?.message || 'auth_error');
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const login = useCallback(async (email: string, password: string) => {
    setLoading(true);
    setError(null);
    try {
      const { user } = await apiLogin(email, password);
      setUser(user);
    } catch (e: any) {
      setError(e?.message || 'login_failed');
      throw e;
    } finally {
      setLoading(false);
    }
  }, []);

  const signup = useCallback(async (email: string, displayName: string, password: string) => {
    setLoading(true);
    setError(null);
    try {
      const result: any = await apiSignup(email, displayName, password);
      if (result?.user) {
        setUser(result.user);
      }
      return result;
    } catch (e: any) {
      setError(e?.message || 'signup_failed');
      throw e;
    } finally {
      setLoading(false);
    }
  }, []);

  const logout = useCallback(() => {
    apiLogout();
    setUser(null);
  }, []);

  const refresh = useCallback(async () => {
    const token = sessionStorage.getItem('auth-token');
    if (!token) return null;
    const u = await apiMe();
    setUser(u);
    return u;
  }, []);

  return { user, loading, error, login, signup, logout, refresh };
}
