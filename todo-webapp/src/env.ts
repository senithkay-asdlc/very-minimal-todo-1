// Typed read of window._env_, the platform's runtime config. The platform
// mounts /env-config.js into the served root at request time; this module
// throws if it never loaded, so a missing key fails loudly rather than
// silently defaulting.
//
// Keys declared here are exactly the ones the platform actually emits for
// this component (react-webapp's key table): the four USER_AUTH_* OIDC
// values the SPA itself reads. USER_AUTH_JWKS_URL is emitted too but is not
// declared here — the browser never validates a token, the API gateway does.
type Env = {
  USER_AUTH_CLIENT_ID: string;
  USER_AUTH_ISSUER: string;
  USER_AUTH_SCOPES: string;
  USER_AUTH_RESOURCE: string;
};

declare global {
  interface Window {
    _env_: Env;
  }
}

if (!window._env_) {
  throw new Error(
    "window._env_ not set — /env-config.js failed to load. " +
      "The platform mounts this file; if you see this locally, host " +
      "/env-config.js from your dev server.",
  );
}

export const env: Env = window._env_;
