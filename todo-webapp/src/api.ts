// Same-origin openapi-fetch client against todo-api, per specs/design/components/
// todo-api/openapi.yaml. nginx strips /api before proxying to the sibling
// (react-webapp's Same-origin API proxy), so paths stay exactly as designed.
//
// This module carries NOTHING of its own about authorization: the bearer and
// the 401 rule both come from src/authz/client.ts (thunder-authentication §4).
import createClient, { type Middleware } from "openapi-fetch";
import type { paths } from "./generated/todo-api";
import { authorizationHeader, classifyResponse, ForbiddenError } from "./authz/client";

const authMiddleware: Middleware = {
  async onRequest({ request }) {
    const header = await authorizationHeader();
    if (header) request.headers.set("Authorization", header);
    return request;
  },
  async onResponse({ response }) {
    if ((await classifyResponse(response.status)) === "forbidden") {
      throw new ForbiddenError(response.status);
    }
    return response;
  },
};

export const todoApi = createClient<paths>({ baseUrl: "/api" });
todoApi.use(authMiddleware);
