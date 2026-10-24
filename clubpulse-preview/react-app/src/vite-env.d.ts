/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_GOOGLE_CLIENT_ID?: string;
  readonly VITE_BOOTSTRAP_ADMIN_ENABLED?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
