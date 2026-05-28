# Chat Agent Specification

## Purpose

Defines how the chat agent processes natural language requests from users,
infers intent, and executes Factus electronic invoicing operations via MCP
tools. The agent MUST use the tools rather than generating fictional responses.

## Requirements

### Requirement: Streaming chat endpoint

The system MUST expose `POST /api/chat` accepting `{ messages: UIMessage[] }`
and returning a streaming SSE response via `toUIMessageStreamResponse()`.

#### Scenario: Send message and receive stream

- GIVEN a valid user message `{ role: "user", content: "Search product PROD-001" }`
- WHEN POSTed to `/api/chat`
- THEN the response MUST be `text/event-stream` with status 200
- AND the stream MUST contain the model's reply

#### Scenario: Empty messages array

- GIVEN an empty messages array
- WHEN POSTed to `/api/chat`
- THEN the response MUST be 400 with a descriptive error

### Requirement: Multi-step tool calling

The system MUST support automatic multi-step tool calling with `stopWhen:
isStepCount(5)`. The model SHOULD call multiple tools in sequence to fulfill
a request.

#### Scenario: Create invoice from natural language

- GIVEN a user says "Create an invoice for Carlos Perez with 1 Laptop Gamer"
- WHEN the agent processes the request
- THEN it MUST call `search_customers` to find Carlos Perez
- AND it MUST call `get_product_by_code` to find Laptop Gamer
- AND it MUST call `get_default_numbering_range` to get the numbering range
- AND it MUST call `create_invoice_with_numbering` with the gathered data
- AND it MUST report the result to the user

#### Scenario: Tool call failure recovery

- GIVEN a tool call fails (e.g., MCP server cold start)
- WHEN the tool returns an error
- THEN the agent MUST inform the user about the failure
- AND it MUST suggest retrying or an alternative action

### Requirement: Agent system prompt

The system prompt MUST define the agent's persona, rules, and context about
Factus invoicing. It MUST be stored in a separate file (`system-prompt.ts`)
independent of the model configuration.

#### Scenario: Agent follows Factus-specific rules

- GIVEN a user asks to create an invoice without specifying a product code
- WHEN the agent processes the request
- THEN it MUST search for products by name using `search_products`
- AND it MUST NOT invent product data that doesn't exist

### Requirement: Swappable model provider

The model configuration MUST be isolated in `model.ts` as a factory function.
Changing the provider (e.g., Gemini to OpenAI) MUST require editing only that
file.

#### Scenario: Model swap

- GIVEN a developer wants to change from Gemini to OpenAI
- WHEN they edit `model.ts` to use a different provider
- THEN the system prompt, tools, and pipeline MUST work without changes
- AND `tsc --noEmit` MUST pass

### Requirement: Error handling

The system MUST handle MCP server unavailability gracefully without crashing
the API route.

#### Scenario: MCP server is down

- GIVEN the MCP server at Render is unreachable
- WHEN a user sends a message that requires an MCP tool
- THEN the agent MUST respond with a clear message about the outage
- AND the API route MUST return a valid stream (not crash)

#### Scenario: Missing API key

- GIVEN `GOOGLE_GENERATIVE_AI_API_KEY` is not set
- WHEN POST /api/chat is called
- THEN the response MUST be 500 with a clear configuration error
