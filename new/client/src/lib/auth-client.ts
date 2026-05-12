import { createAuthClient } from "better-auth/react";

const baseURL = import.meta.env.VITE_API_URL ?? "";

export const authClient = createAuthClient({
  baseURL,
});

export const useAuthSession = authClient.useSession;
