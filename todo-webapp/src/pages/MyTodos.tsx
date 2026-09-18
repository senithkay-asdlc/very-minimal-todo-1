// wireframes.dsl `screen MyTodos` — the signed-in user's private list, open and
// done, with an All | Open | Done filter and a New Todo action. Loads
// GET /me/todos; holds no todo state of its own beyond what the last fetch
// returned, so every mount (including a "back to My Todos" navigation) is a
// fresh read of the caller's rows.
import { useCallback, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Alert,
  Box,
  Button,
  Chip,
  CircularProgress,
  List,
  ListItemButton,
  ListItemText,
  MenuItem,
  PageContent,
  PageTitle,
  TextField,
  Typography,
} from "@wso2/oxygen-ui";
import { Plus } from "@wso2/oxygen-ui-icons-react";
import { todoApi } from "../api";
import type { components } from "../generated/todo-api";

type Todo = components["schemas"]["Todo"];
type Filter = "all" | "open" | "done";

export function MyTodosPage() {
  const navigate = useNavigate();
  const [filter, setFilter] = useState<Filter>("all");
  const [todos, setTodos] = useState<Todo[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async (f: Filter) => {
    setError(null);
    setTodos(null);
    try {
      const { data, error: apiError } = await todoApi.GET("/me/todos", {
        params: { query: { limit: 100, ...(f === "all" ? {} : { status: f }) } },
      });
      if (apiError) throw new Error("Could not load your todos.");
      setTodos(data?.data ?? []);
    } catch {
      setError("Could not load your todos. Try again in a moment.");
    }
  }, []);

  useEffect(() => {
    void load(filter);
  }, [filter, load]);

  return (
    <PageContent>
      <PageTitle>
        <PageTitle.Header>My Todos</PageTitle.Header>
        <PageTitle.Actions>
          <Button
            variant="contained"
            startIcon={<Plus size={18} />}
            onClick={() => navigate("/todos/new")}
          >
            New Todo
          </Button>
        </PageTitle.Actions>
      </PageTitle>

      <Box sx={{ display: "flex", justifyContent: "flex-end", mb: 2 }}>
        <TextField
          select
          label="Filter"
          value={filter}
          onChange={(e) => setFilter(e.target.value as Filter)}
          sx={{ minWidth: 160 }}
        >
          <MenuItem value="all">All</MenuItem>
          <MenuItem value="open">Open</MenuItem>
          <MenuItem value="done">Done</MenuItem>
        </TextField>
      </Box>

      {error ? <Alert severity="error">{error}</Alert> : null}

      {!error && todos === null ? (
        <Box sx={{ display: "flex", justifyContent: "center", py: 6 }}>
          <CircularProgress />
        </Box>
      ) : null}

      {!error && todos !== null && todos.length === 0 ? (
        <Box sx={{ py: 6, textAlign: "center" }}>
          <Typography color="text.secondary">
            {filter === "all"
              ? "No todos yet — create your first one."
              : `No ${filter} todos.`}
          </Typography>
        </Box>
      ) : null}

      {!error && todos !== null && todos.length > 0 ? (
        <List sx={{ bgcolor: "background.paper", borderRadius: 1 }}>
          {todos.map((todo) => (
            <ListItemButton
              key={todo.id}
              divider
              onClick={() => navigate(`/todos/${todo.id}`, { state: { todo } })}
              sx={{ display: "flex", justifyContent: "space-between", gap: 2 }}
            >
              <ListItemText primary={todo.description} />
              <Chip
                label={todo.done ? "Done" : "Open"}
                color={todo.done ? "success" : "warning"}
                size="small"
              />
            </ListItemButton>
          ))}
        </List>
      ) : null}
    </PageContent>
  );
}
