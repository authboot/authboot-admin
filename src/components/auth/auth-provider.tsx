// ============================================================
// AuthProvider — client-side auth context (replaces ClerkProvider)
// ============================================================
// Loads the signed-in admin profile + organization list through the
// /api/auth/* BFF routes and exposes them to the tree. If the access
// token expired, a refresh is attempted once before signing out.

'use client';

import * as React from 'react';
import { useRouter } from 'next/navigation';
import type { AuthUser, Organization } from '@/lib/auth-types';
import { ACTIVE_ORG_COOKIE } from '@/lib/auth-shared';
import {
  fetchCurrentUser,
  fetchOrganizations,
  logout,
  refreshSession,
  switchOrganization
} from '@/lib/auth-client';

interface AuthContextValue {
  user: AuthUser | null;
  organizations: Organization[];
  activeOrganizationId: number | null;
  isLoaded: boolean;
  isAuthenticated: boolean;
  signOut: () => Promise<void>;
  switchOrg: (organizationId: number) => Promise<{ success: boolean; message: string }>;
  refresh: () => Promise<void>;
}

const AuthContext = React.createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const [user, setUser] = React.useState<AuthUser | null>(null);
  const [organizations, setOrganizations] = React.useState<Organization[]>([]);
  const [activeOrganizationId, setActiveOrganizationId] = React.useState<number | null>(null);
  const [isLoaded, setIsLoaded] = React.useState(false);

  const loadSession = React.useCallback(async () => {
    let current = await fetchCurrentUser();
    let refreshed = false;
    if (!current) {
      // Access token may have expired — try a refresh before giving up.
      refreshed = await refreshSession();
      if (refreshed) current = await fetchCurrentUser();
    }
    if (!current) {
      setUser(null);
      setOrganizations([]);
      setIsLoaded(true);
      return;
    }
    setUser(current);
    setIsLoaded(true);
    // Org list is best-effort; a failure shouldn't break the session.
    const orgs = await fetchOrganizations();
    setOrganizations(orgs);

    // Only the switch endpoint can pair an active workspace with a scoped token.
    const cookieOrg = document.cookie
      .split('; ')
      .find((entry) => entry.startsWith(`${ACTIVE_ORG_COOKIE}=`));
    const cookieOrgId = cookieOrg ? Number(cookieOrg.split('=')[1]) : 0;
    const selectedOrg = orgs.find((org) => org.id === cookieOrgId);
    if (selectedOrg && !refreshed) {
      setActiveOrganizationId(cookieOrgId);
    } else if (orgs.length > 0) {
      // Refresh can issue a platform token; bind it to the selected org again.
      const targetOrgId = (selectedOrg ?? orgs[0]).id;
      const result = await switchOrganization(targetOrgId);
      if (result.success) {
        setActiveOrganizationId(targetOrgId);
        router.refresh();
      }
    }
  }, [router]);

  React.useEffect(() => {
    // Session load is async — the setState calls happen after the fetch
    // settles, so this is not a synchronous setState-in-effect.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    void loadSession();
  }, [loadSession]);

  const signOut = React.useCallback(async () => {
    await logout();
    setUser(null);
    setOrganizations([]);
    setActiveOrganizationId(null);
    router.replace('/auth/sign-in');
  }, [router]);

  const switchOrg = React.useCallback(
    async (organizationId: number) => {
      const result = await switchOrganization(organizationId);
      if (result.success) {
        setActiveOrganizationId(organizationId);
        // Server components read the active org from the cookie (overview,
        // workspace settings, ...). Re-fetch the current route so their content
        // switches to the new org without a full page reload.
        router.refresh();
      }
      return result;
    },
    [router]
  );

  const refresh = React.useCallback(async () => {
    await loadSession();
  }, [loadSession]);

  const value = React.useMemo(
    () => ({
      user,
      organizations,
      activeOrganizationId,
      isLoaded,
      isAuthenticated: !!user,
      signOut,
      switchOrg,
      refresh
    }),
    [user, organizations, activeOrganizationId, isLoaded, signOut, switchOrg, refresh]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const ctx = React.useContext(AuthContext);
  if (!ctx) {
    throw new Error('useAuth must be used within an <AuthProvider>');
  }
  return ctx;
}
