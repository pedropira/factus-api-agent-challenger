# Backend Testing Specification

## Purpose

Define the test infrastructure and coverage requirements for the Factus Agent backend. Tests MUST verify core business logic, MCP communication, and data transformations without external dependencies where possible.

## Requirements

### Requirement: Vitest test runner

The system MUST use Vitest as the test runner with a `vitest.config.ts` that integrates with Next.js via `@vitejs/plugin-react`.

#### Scenario: Test runner executes

- GIVEN a configured Vitest project
- WHEN `npx vitest run` is executed
- THEN all test files under `tests/` MUST be discovered and executed
- AND exit code MUST be 0 on success

### Requirement: Unit tests for model factory

The system MUST have a unit test for `src/lib/ai/model.ts` that verifies the model factory returns the expected provider instance.

#### Scenario: Model factory returns expected model

- GIVEN the model factory
- WHEN `createModel()` is called
- THEN it MUST return a non-null, non-undefined object
- AND it MUST NOT throw

### Requirement: Unit tests for MCP tool schemas

The system MUST have unit tests for `src/lib/mcp-tools.ts` that verify every tool has a valid Zod schema with correct parameter structure.

#### Scenario: All tools have valid schemas

- GIVEN the mcpToolRegistry
- WHEN inspecting each tool
- THEN every tool MUST have a non-null `inputSchema` (Zod object)
- AND every tool MUST have a `name` and `description` string

### Requirement: Unit tests for chat pipeline

The system MUST have a unit test for `src/lib/ai/chat-pipeline.ts` that validates message conversion.

#### Scenario: Empty messages array returns 400

- GIVEN the chat pipeline
- WHEN called with an empty messages array
- THEN it MUST throw or return an error
- (This verifies the validation logic in route.ts)

### Requirement: Unit tests for local storage

The system MUST have a unit test for `src/lib/chat/storage-local.ts` that verifies save/load/clear lifecycle.

#### Scenario: Save then load returns same messages

- GIVEN a LocalStorageChatStorage instance
- WHEN messages are saved and then loaded
- THEN the loaded messages MUST match the saved messages exactly
- AND the storage key MUST be prefixed with `factus-chat-`

#### Scenario: Clear removes all messages

- GIVEN a storage with saved messages
- WHEN `clear()` is called
- THEN `load()` MUST return an empty array

### Requirement: Unit tests for MCP client

The system MUST have a unit test for `src/lib/mcp-client.ts` that verifies transport initialization.

#### Scenario: Client initializes transport

- GIVEN the MCP client singleton
- WHEN it initializes
- THEN the transport MUST be a `StreamableHTTPClientTransport`
- AND the URL MUST point to the Render-hosted MCP server
