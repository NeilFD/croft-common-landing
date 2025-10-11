/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly BUILD_TIME: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
