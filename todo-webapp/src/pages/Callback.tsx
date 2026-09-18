// The OIDC redirect target — routed OUTSIDE <AuthzProvider> in App.tsx, since
// there is no session to read until this exchange has completed. Processes
// the code exchange exactly once (a ref guards React 18/19 StrictMode's
// double-invoke of effects in development) and lands on the app root, which
// SignedIn() then routes to the caller's first reachable screen.
import { useEffect, useRef, useState } from "react";
import { Box, CircularProgress, Stack, Typography } from "@wso2/oxygen-ui";
import { handleCallback } from "../authz/session";
import { APP_NAME } from "../appName";

export function CallbackPage() {
  const ran = useRef(false);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    if (ran.current) return;
    ran.current = true;
    void handleCallback()
      .then(() => window.location.assign("/"))
      .catch(() => setFailed(true));
  }, []);

  return (
    <Box sx={{ display: "flex", justifyContent: "center", alignItems: "center", height: "100vh" }}>
      <Stack spacing={2} alignItems="center">
        {failed ? (
          <Typography color="error">
            Sign-in did not complete. Reload {APP_NAME} to try again.
          </Typography>
        ) : (
          <>
            <CircularProgress />
            <Typography color="text.secondary">Signing you in…</Typography>
          </>
        )}
      </Stack>
    </Box>
  );
}
