import ballerina/sql;
import ballerina/time;
import ballerina/uuid;
import ballerinax/postgresql;

# One row of the `todos` table, shaped for query mapping — column aliases in
# every SELECT below line these fields up with `created_at`/`completed_at`.
type TodoRow record {|
    string id;
    string description;
    boolean done;
    time:Utc createdAt;
    time:Utc? completedAt;
|};

# The caller's own todos, paginated and optionally filtered by status.
#
# + userId - the caller's id, from the verified gateway assertion
# + status - "open" or "done", or `()` for no filter
# + pageLimit - max rows to return
# + offset - rows to skip
# + return - the total matching row count and the requested page
function listTodos(string userId, string? status, int pageLimit, int offset) returns [int, TodoRow[]]|error {
    check ensureTodosTable();
    postgresql:Client db = check getTodosDb();
    sql:ParameterizedQuery statusClause = ``;
    if status is string {
        boolean isDone = status == "done";
        statusClause = `AND done = ${isDone}`;
    }

    sql:ParameterizedQuery countQuery = sql:queryConcat(
        `SELECT COUNT(*) FROM todos WHERE user_id = ${userId} `, statusClause);
    int total = check db->queryRow(countQuery);

    sql:ParameterizedQuery dataQuery = sql:queryConcat(
        `SELECT id, description, done, created_at AS "createdAt", completed_at AS "completedAt"
         FROM todos WHERE user_id = ${userId} `, statusClause,
        ` ORDER BY created_at DESC LIMIT ${pageLimit} OFFSET ${offset}`);
    stream<TodoRow, sql:Error?> rowStream = db->query(dataQuery);
    TodoRow[] rows = [];
    check from TodoRow row in rowStream
        do {
            rows.push(row);
        };
    return [total, rows];
}

# Creates a new open todo for the caller.
#
# + userId - the caller's id, from the verified gateway assertion
# + description - the todo's text
# + return - the created row
function createTodo(string userId, string description) returns TodoRow|error {
    check ensureTodosTable();
    postgresql:Client db = check getTodosDb();
    string id = uuid:createRandomUuid();
    time:Utc now = time:utcNow();
    sql:ExecutionResult _ = check db->execute(`
        INSERT INTO todos (id, user_id, description, done, created_at)
        VALUES (${id}, ${userId}, ${description}, FALSE, ${now})
    `);
    return {id, description, done: false, createdAt: now, completedAt: ()};
}

# Marks one of the caller's own todos as done, idempotently.
#
# + userId - the caller's id, from the verified gateway assertion
# + todoId - the todo to complete
# + return - the updated row, or `()` when no such todo exists for this caller
function completeTodo(string userId, string todoId) returns TodoRow?|error {
    check ensureTodosTable();
    postgresql:Client db = check getTodosDb();
    TodoRow|sql:Error current = db->queryRow(`
        SELECT id, description, done, created_at AS "createdAt", completed_at AS "completedAt"
        FROM todos WHERE id = ${todoId} AND user_id = ${userId}
    `);
    if current is sql:NoRowsError {
        return ();
    }
    if current is sql:Error {
        return current;
    }
    if current.done {
        return current;
    }
    time:Utc now = time:utcNow();
    sql:ExecutionResult _ = check db->execute(`
        UPDATE todos SET done = TRUE, completed_at = ${now}
        WHERE id = ${todoId} AND user_id = ${userId}
    `);
    current.done = true;
    current.completedAt = now;
    return current;
}

# Converts a stored row into the contract's wire shape.
#
# + row - the stored row
# + return - the `Todo` response payload
function toTodo(TodoRow row) returns Todo {
    string? completedAtText = ();
    time:Utc? completedAt = row.completedAt;
    if completedAt is time:Utc {
        completedAtText = time:utcToString(completedAt);
    }
    return {
        id: row.id,
        description: row.description,
        done: row.done,
        createdAt: time:utcToString(row.createdAt),
        completedAt: completedAtText
    };
}
