// wireframes.dsl `screen NewTodo` — captures a short description and creates a
// todo via todo-api, returning to MyTodos. A write-only screen: its one
// operation is the submit it makes, POST /me/todos (src/authz/screens.ts).
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Alert,
  Button,
  Form,
  PageContent,
  PageTitle,
  Stack,
  TextField,
} from "@wso2/oxygen-ui";
import { todoApi } from "../api";

export function NewTodoPage() {
  const navigate = useNavigate();
  const [description, setDescription] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const canSubmit = description.trim().length > 0 && !submitting;

  async function handleCreate() {
    if (!canSubmit) return;
    setSubmitting(true);
    setError(null);
    try {
      const { error: apiError } = await todoApi.POST("/me/todos", {
        body: { description: description.trim() },
      });
      if (apiError) throw new Error("Could not create that todo.");
      navigate("/todos");
    } catch {
      setError("Could not create that todo. Try again.");
      setSubmitting(false);
    }
  }

  return (
    <PageContent>
      <PageTitle>
        <PageTitle.Header>New Todo</PageTitle.Header>
      </PageTitle>

      {error ? <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert> : null}

      <Form.Section>
        <TextField
          label="What do you need to do?"
          multiline
          minRows={4}
          fullWidth
          value={description}
          onChange={(e) => setDescription(e.target.value)}
        />
      </Form.Section>

      <Stack direction="row" justifyContent="flex-end" spacing={2} sx={{ mt: 3 }}>
        <Button variant="outlined" onClick={() => navigate("/todos")}>
          Cancel
        </Button>
        <Button variant="contained" disabled={!canSubmit} onClick={() => void handleCreate()}>
          Create
        </Button>
      </Stack>
    </PageContent>
  );
}
