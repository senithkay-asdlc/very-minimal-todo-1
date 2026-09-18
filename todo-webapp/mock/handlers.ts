// One handler per operation in specs/design/components/todo-api/openapi.yaml.
// State lives in module scope, so a create shows up in the next list and a
// complete persists — for as long as the page's own JS context lives. Any
// full page load (reload, a typed URL, a link that leaves the SPA) re-runs
// this module and puts the seed data back; only in-app navigation carries a
// change forward.
//
// No scope check here — mock/authz/gateway.ts, read from the contract, is
// what decides whether an operation may be called at all. What a /me/…
// handler owes is its path's reach: the caller's own rows, resolved from
// mockCaller, never a query parameter.
import { http, HttpResponse } from "msw";
import type { components } from "../src/generated/todo-api";

type Todo = components["schemas"]["Todo"];
type NewTodo = components["schemas"]["NewTodo"];

/** The caller this mock speaks for. */
export const mockCaller = { userId: "01a0ab00-0000-7000-8000-000000000001" };

/** Internal row shape — `ownerId` never leaves a handler; Todo has no such field. */
type StoredTodo = Todo & { ownerId: string };

const now = new Date().toISOString();

let todos: StoredTodo[] = [
  {
    id: "1",
    description: "Buy milk",
    done: false,
    createdAt: now,
    completedAt: null,
    ownerId: mockCaller.userId,
  },
  {
    id: "2",
    description: "Write report",
    done: true,
    createdAt: now,
    completedAt: now,
    ownerId: mockCaller.userId,
  },
  {
    id: "3",
    description: "Call dentist",
    done: false,
    createdAt: now,
    completedAt: null,
    ownerId: mockCaller.userId,
  },
  // Proves /me/todos scopes by caller: never returned to the mock caller.
  {
    id: "4",
    description: "Someone else's todo",
    done: false,
    createdAt: now,
    completedAt: null,
    ownerId: "not-the-caller",
  },
];

let nextId = 5;

function toTodo(t: StoredTodo): Todo {
  return {
    id: t.id,
    description: t.description,
    done: t.done,
    createdAt: t.createdAt,
    completedAt: t.completedAt,
  };
}

export const handlers = [
  http.get("/api/me/todos", ({ request }) => {
    const url = new URL(request.url);
    const status = url.searchParams.get("status");
    let mine = todos.filter((t) => t.ownerId === mockCaller.userId);
    if (status === "open") mine = mine.filter((t) => !t.done);
    if (status === "done") mine = mine.filter((t) => t.done);
    return HttpResponse.json({ count: mine.length, next: null, previous: null, data: mine.map(toTodo) });
  }),

  http.post("/api/me/todos", async ({ request }) => {
    const input = (await request.json()) as NewTodo;
    if (!input?.description || input.description.length < 1) {
      return HttpResponse.json(
        { code: 400, message: "Invalid todo", description: "description is required" },
        { status: 400 },
      );
    }
    const created: StoredTodo = {
      id: String(nextId++),
      description: input.description,
      done: false,
      createdAt: new Date().toISOString(),
      completedAt: null,
      ownerId: mockCaller.userId,
    };
    todos = [...todos, created];
    return HttpResponse.json(toTodo(created), { status: 201 });
  }),

  http.post("/api/me/todos/:todoId/complete", ({ params }) => {
    const idx = todos.findIndex((t) => t.id === params.todoId && t.ownerId === mockCaller.userId);
    // A row that exists but is not the caller's, or does not exist at all, is a
    // 404 — the same answer the real service gives for either case.
    if (idx === -1) {
      return HttpResponse.json(
        { code: 404, message: "No such todo for the caller" },
        { status: 404 },
      );
    }
    const completed: StoredTodo = {
      ...todos[idx],
      done: true,
      completedAt: new Date().toISOString(),
    };
    todos = [...todos.slice(0, idx), completed, ...todos.slice(idx + 1)];
    return HttpResponse.json(toTodo(completed));
  }),
];
