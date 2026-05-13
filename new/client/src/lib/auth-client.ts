import { useQuery, useQueryClient } from "@tanstack/react-query";

export type AuthUser = { id: string; email: string; name: string | null };

export async function getSession(): Promise<{ user: AuthUser | null }> {
  const res = await fetch("/api/auth/get-session", { credentials: "include" });
  if (!res.ok) throw new Error("Session request failed");
  return res.json() as Promise<{ user: AuthUser | null }>;
}

export async function login(email: string, password: string): Promise<{ user: AuthUser }> {
  const res = await fetch("/api/auth/login", {
    method: "POST",
    credentials: "include",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, password }),
  });
  const data = (await res.json().catch(() => ({}))) as { error?: string; user?: AuthUser };
  if (!res.ok) throw new Error(data.error ?? "Could not sign in");
  if (!data.user) throw new Error("Could not sign in");
  return { user: data.user };
}

export async function register(
  name: string,
  email: string,
  password: string,
): Promise<{ user: AuthUser }> {
  const res = await fetch("/api/auth/register", {
    method: "POST",
    credentials: "include",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ name, email, password }),
  });
  const data = (await res.json().catch(() => ({}))) as { error?: string; user?: AuthUser };
  if (!res.ok) throw new Error(data.error ?? "Could not register");
  if (!data.user) throw new Error("Could not register");
  return { user: data.user };
}

export async function logout(): Promise<void> {
  await fetch("/api/auth/logout", { method: "POST", credentials: "include" });
}

export function useAuthSession() {
  return useQuery({
    queryKey: ["session"],
    queryFn: getSession,
    staleTime: 30_000,
  });
}

export function useInvalidateSession() {
  const qc = useQueryClient();
  return () => void qc.invalidateQueries({ queryKey: ["session"] });
}
