/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_API_URL?: string;
  readonly VITE_STRIPE_PUBLISHABLE_KEY?: string;
  /** Optional UI hint text for the admin page (not a secret). */
  readonly VITE_ADMIN_HINT?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
