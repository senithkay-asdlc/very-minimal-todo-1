// Exercises the gateway-assertion verification wired into openapi_service.bal,
// against a throwaway RSA keypair — nothing here talks to a real gateway or a
// real todos-db. GATEWAY_ASSERTION_CERTIFICATE/_ISSUER/_HEADER are exported by
// the shell before `bal test` runs (see the ballerina skill's test section).
//
// The store functions are mocked so the suite never needs a live Postgres:
// an assertion the interceptor refuses never reaches them, and the one
// "accepted" case stubs the store directly rather than hitting a real table.

import ballerina/http;
import ballerina/jwt;
import ballerina/test;

http:Client testClient = check new ("http://localhost:9090");

@test:Mock {
    functionName: "listTodos"
}
test:MockFunction listTodosMock = new ();

function issueAssertion(string keyFile, string subject, string scope) returns string|error {
    return jwt:issue({
        issuer: "aep-gateway-test",
        username: subject,
        customClaims: {"scope": scope},
        expTime: 300,
        signatureConfig: {
            algorithm: jwt:RS256,
            config: {keyFile: keyFile, keyPassword: ""}
        }
    });
}

@test:Config {}
function testValidAssertionIsAccepted() returns error? {
    [int, TodoRow[]] emptyPage = [0, []];
    test:when(listTodosMock).thenReturn(emptyPage);
    string token = check issueAssertion("tests/resources/key1_pkcs8.pem", "user-1", "todos:read");
    http:Response resp = check testClient->get("/me/todos", {"x-jwt-assertion": token});
    test:assertEquals(resp.statusCode, 200);
}

@test:Config {}
function testAssertionSignedByAnotherKeyIsUnauthorized() returns error? {
    string token = check issueAssertion("tests/resources/key2_pkcs8.pem", "user-1", "todos:read");
    http:Response resp = check testClient->get("/me/todos", {"x-jwt-assertion": token});
    test:assertEquals(resp.statusCode, 401);
}

@test:Config {}
function testTamperedAssertionIsUnauthorized() returns error? {
    string token = check issueAssertion("tests/resources/key1_pkcs8.pem", "user-1", "todos:read");
    string[] parts = re `\.`.split(token);
    string tamperedPayload = re `A`.replace(parts[1], "B");
    string tampered = parts[0] + "." + tamperedPayload + "." + parts[2];
    http:Response resp = check testClient->get("/me/todos", {"x-jwt-assertion": tampered});
    test:assertEquals(resp.statusCode, 401);
}

@test:Config {}
function testNoAssertionIsUnauthorized() returns error? {
    http:Response resp = check testClient->get("/me/todos", {});
    test:assertEquals(resp.statusCode, 401);
}
