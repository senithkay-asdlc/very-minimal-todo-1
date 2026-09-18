import ballerina/sql;
import ballerinax/postgresql;
import ballerinax/postgresql.driver as _;

// Sensible defaults so the service starts with no required environment
// variables; the platform overrides every one of these at deploy.
final string resolvedDbHost = todosDbHost == "" ? "localhost" : todosDbHost;
final string resolvedDbName = todosDbName == "" ? "todos" : todosDbName;
final string resolvedDbUser = todosDbUser == "" ? "postgres" : todosDbUser;
final int resolvedDbPort = resolveDbPort(todosDbPort);

// Constructed lazily on first real use, wrapped in `getTodosDb` — never a
// bare module-level connector call — so a test can mock the whole store
// layer without ever opening a socket to a database.
postgresql:Client? todosDbClient = ();

# Parses the injected port, falling back to Postgres' own default when unset
# or unreadable.
#
# + rawPort - the raw `TODOS_DB_PORT` value
# + return - the port to connect on
function resolveDbPort(string rawPort) returns int {
    if rawPort == "" {
        return 5432;
    }
    int|error parsed = int:fromString(rawPort);
    return parsed is int ? parsed : 5432;
}

# The todos-db client, created on first call and reused after.
#
# + return - the connected client, or an error when the connection fails
function getTodosDb() returns postgresql:Client|error {
    postgresql:Client? existing = todosDbClient;
    if existing is postgresql:Client {
        return existing;
    }
    postgresql:Client created = check new (
        host = resolvedDbHost,
        username = resolvedDbUser,
        password = todosDbPassword,
        database = resolvedDbName,
        port = resolvedDbPort
    );
    todosDbClient = created;
    return created;
}

// Set once the `todos` table is confirmed present. Table creation happens on
// first real use rather than at module load, so the service still starts
// when todos-db is not yet reachable (no required env var at startup).
boolean todosTableReady = false;

# Creates the `todos` table if it does not already exist. Idempotent and
# called by every store function before it touches the table.
#
# + return - an error if the connection or the statement fails
function ensureTodosTable() returns error? {
    if todosTableReady {
        return;
    }
    postgresql:Client db = check getTodosDb();
    sql:ExecutionResult _ = check db->execute(`
        CREATE TABLE IF NOT EXISTS todos (
            id VARCHAR(64) PRIMARY KEY,
            user_id VARCHAR(128) NOT NULL,
            description VARCHAR(500) NOT NULL,
            done BOOLEAN NOT NULL DEFAULT FALSE,
            created_at TIMESTAMPTZ NOT NULL,
            completed_at TIMESTAMPTZ
        )
    `);
    todosTableReady = true;
}
