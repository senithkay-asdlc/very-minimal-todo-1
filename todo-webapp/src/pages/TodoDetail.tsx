// wireframes.dsl `screen TodoDetail` — a single todo, with a "Mark as Done"
// control when it is open. No edit, delete or un-done control (AC-006).
//
// todo-api's contract has no single-item GET (list, create, complete —
// nothing else), so the screen's one operation is the action it exists to
// offer: POST /me/todos/{todoId}/complete (src/authz/screens.ts). The todo
// itself comes from the row the caller clicked on MyTodos, carried as router
// state — the fastest path, and the only state involved is the click just
// made, not anything the app holds. A direct visit (typed URL, reload) has no
// such state, so it falls back to one GET /me/todos and finds the row by id;
// no todo state is cached between renders either way.
import { useEffect, useState } from "react";
import { useLocation, useNavigate, useParams } from "react-router-dom";
import {
  Alert,
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  CircularProgress,
  PageContent,
  PageTitle,
  Stack,
  Typography,
} from "@wso2/oxygen-ui";
import { todoApi } from "../api";
import type { components } from "../generated/todo-api";

type Todo = components["schemas"]["Todo"];

export function TodoDetailPage() {
  const { todoId } = useParams<{ todoId: string }>();
  const location = useLocation();
  const navigate = useNavigate();
  const stateTodo = (location.state as { todo?: Todo } | null)?.todo;

  const [todo, setTodo] = useState<Todo | null>(stateTodo && stateTodo.id === todoId ? stateTodo : null);
  const [loading, setLoading] = useState(!todo);
  const [error, setError] = useState<string | null>(null);
  const [completing, setCompleting] = useState(false);

  useEffect(() => {
    if (todo || !todoId) return;
    let live = true;
    setLoading(true);
    void (async () => {
      try {
        const { data, error: apiError } = await todoApi.GET("/me/todos", {
          params: { query: { limit: 100 } },
        });
        if (!live) return;
        if (apiError) throw new Error("Could not load that todo.");
        const found = data?.data.find((t) => t.id === todoId) ?? null;
        setTodo(found);
        if (!found) setError("That todo could not be found.");
      } catch {
        if (live) setError("Could not load that todo. Try again.");
      } finally {
        if (live) setLoading(false);
      }
    })();
    return () => {
      live = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [todoId]);

  async function handleMarkDone() {
    if (!todoId) return;
    setCompleting(true);
    setError(null);
    try {
      const { data, error: apiError } = await todoApi.POST(
        "/me/todos/{todoId}/complete",
        { params: { path: { todoId } } },
      );
      if (apiError) throw new Error("Could not mark that todo done.");
      setTodo(data ?? null);
      navigate("/todos");
    } catch {
      setError("Could not mark that todo done. Try again.");
      setCompleting(false);
    }
  }

  return (
    <PageContent>
      <PageTitle>
        <PageTitle.BackButton onClick={() => navigate("/todos")}>Back</PageTitle.BackButton>
        <PageTitle.Header>Todo</PageTitle.Header>
      </PageTitle>

      {loading ? (
        <Box sx={{ display: "flex", justifyContent: "center", py: 6 }}>
          <CircularProgress />
        </Box>
      ) : null}

      {error ? <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert> : null}

      {!loading && todo ? (
        <Card>
          <CardContent>
            <Stack spacing={2}>
              <Typography variant="body1">{todo.description}</Typography>
              <Box>
                <Chip
                  label={todo.done ? "Done" : "Open"}
                  color={todo.done ? "success" : "warning"}
                />
              </Box>
              {!todo.done ? (
                <Stack direction="row" justifyContent="flex-end">
                  <Button
                    variant="contained"
                    disabled={completing}
                    onClick={() => void handleMarkDone()}
                  >
                    Mark as Done
                  </Button>
                </Stack>
              ) : null}
            </Stack>
          </CardContent>
        </Card>
      ) : null}
    </PageContent>
  );
}
