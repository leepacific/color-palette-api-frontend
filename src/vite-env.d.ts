/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_COLOR_PALETTE_API_BASE_URL?: string;
  readonly VITE_COLOR_PALETTE_API_DEV_KEY?: string;
  readonly VITE_USE_MSW?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
