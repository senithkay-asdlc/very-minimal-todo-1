import ballerina/os;

// todos-db (platform-resource, postgres-cnpg) — envBindings from design.json,
// verbatim names the platform injects.
configurable string todosDbHost = os:getEnv("TODOS_DB_HOST");
configurable string todosDbPort = os:getEnv("TODOS_DB_PORT");
configurable string todosDbName = os:getEnv("TODOS_DB_DBNAME");
configurable string todosDbUser = os:getEnv("TODOS_DB_USER");
configurable string todosDbPassword = os:getEnv("TODOS_DB_PASSWORD");
