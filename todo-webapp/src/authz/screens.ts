/**
 * YOUR screens, in RAIL ORDER — from specs/design/components/todo-webapp/wireframes.dsl.
 *
 * MyTodos is a "mine" list, so it loads GET /me/todos. NewTodo is a form that
 * only writes: it has no load call, so it names the operation its submit
 * makes, POST /me/todos — the pattern thunder-authentication documents for a
 * write-only screen. TodoDetail has no single-item GET in todo-api's contract
 * at all (list, create, complete — nothing else), so its one operation is the
 * action it exists to offer: POST /me/todos/{todoId}/complete. The todo it
 * displays comes from the row the caller clicked on MyTodos (or, failing
 * that, a fresh GET /me/todos — see src/pages/TodoDetail.tsx), never from
 * client-held state.
 */
import { canCall } from "./core";
import { OPERATIONS, isOperationKey, type OperationKey } from "./operations.gen";

export interface ScreenRoute {
  readonly key: string;
  readonly label: string;
  readonly path: string;
  readonly loads: OperationKey | null;
  readonly public?: boolean;
}

export const SCREEN_ROUTES: readonly ScreenRoute[] = [
  { key: "mytodos", label: "My Todos", path: "/todos", loads: "GET /me/todos" },
  { key: "newtodo", label: "New Todo", path: "/todos/new", loads: "POST /me/todos" },
  {
    key: "tododetail",
    label: "Todo",
    path: "/todos/:todoId",
    loads: "POST /me/todos/{todoId}/complete",
  },
];

// FAIL LOUDLY, at module load, if a `loads` no contract declares survives
// (a stale generated table, or a typo). Never soften to a console.warn.
for (const screen of SCREEN_ROUTES) {
  if (screen.loads !== null && !isOperationKey(screen.loads)) {
    throw new Error(
      `src/authz/screens.ts: screen "${screen.label}" loads "${screen.loads}", which ` +
        `no contract declares. Re-run \`npm run gen\`, or name the operation the ` +
        `way openapi.yaml spells it.`,
    );
  }
}

/** The screens this caller can actually open, in rail order. */
export function reachableScreens(
  scopes: ReadonlySet<string>,
  signedIn: boolean,
): readonly ScreenRoute[] {
  return SCREEN_ROUTES.filter((screen) => {
    if (screen.public) return true;
    if (screen.loads === null) return signedIn;
    return canCall(OPERATIONS[screen.loads], scopes, signedIn);
  });
}

/** The NoAccess question — see thunder-authentication's screens.example.ts. */
export function hasScopedReach(scopes: ReadonlySet<string>, signedIn: boolean): boolean {
  return reachableScreens(scopes, signedIn).some(
    (screen) => !screen.public && screen.loads !== null,
  );
}
