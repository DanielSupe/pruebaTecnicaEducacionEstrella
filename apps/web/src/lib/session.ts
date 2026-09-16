import { fetchAuthSession, signOut as amplifySignOut } from "aws-amplify/auth";
import type { QueryClient } from "@tanstack/react-query";

export type Session = {
  userId: string;
} | null;

// fetchAuthSession refreshes the token on its own when needed, so calling it is
// also how we learn whether the session is still valid.
async function fetchSession(): Promise<Session> {
  try {
    const sesion = await fetchAuthSession();
    const sub = sesion.tokens?.accessToken.payload.sub;
    return typeof sub === "string" ? { userId: sub } : null;
  } catch {
    // No session is not an error: it is the normal state of a signed-out visitor.
    return null;
  }
}

export const sessionQuery = {
  queryKey: ["session"] as const,
  queryFn: fetchSession,
  staleTime: 30_000,
};

export async function getAccessToken(): Promise<string | null> {
  try {
    const sesion = await fetchAuthSession();
    return sesion.tokens?.accessToken.toString() ?? null;
  } catch {
    return null;
  }
}

// The value is SET rather than invalidated: invalidating only marks it stale, and
// ensureQueryData may return the previous one while refreshing. The guard would
// then decide with a session that no longer exists, and the private screen would
// stay up after signing out.
export async function signOut(queryClient: QueryClient): Promise<void> {
  await amplifySignOut();
  queryClient.setQueryData(sessionQuery.queryKey, null);
}

// staleTime is overridden on purpose: we know for certain the session just
// changed. Respecting it would return the previous value — typically null, cached
// on the login screen — and the guard would bounce the freshly authenticated user
// back to login.
export async function refreshSession(queryClient: QueryClient): Promise<void> {
  await queryClient.fetchQuery({ ...sessionQuery, staleTime: 0 });
}
