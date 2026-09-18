// mockEnv carries exactly the keys the platform emits for this component —
// src/env.ts's Env type — and nothing else. No USER_AUTH_JWKS_URL: the
// browser never validates a token, so src/env.ts does not declare it either.
export const mockEnv = {
  USER_AUTH_CLIENT_ID: "mock-client",
  USER_AUTH_ISSUER: "https://mock-idp.test",
  USER_AUTH_SCOPES: "openid profile email group ou todos:read todos:create todos:complete",
  USER_AUTH_RESOURCE: "https://mock-idp.test/resources/mock-project",
};
