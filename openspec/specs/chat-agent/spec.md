# Chat Agent Specification

## Purpose

Defines how the chat agent processes natural language requests from users,
infers intent, and executes Factus electronic invoicing operations via MCP
tools. The agent MUST use the tools rather than generating fictional responses.
The chat frontend is the CoPilotChat component in the center column of the
3-column workspace layout.

## Requirements

### Requirement: Streaming chat endpoint

The system MUST expose `POST /api/chat` accepting `{ messages: UIMessage[] }`
and returning a streaming SSE response via `toUIMessageStreamResponse()`.
The chat frontend is the CoPilotChat component in the center column.

#### Scenario: Send message and receive stream

- GIVEN a valid user message from CoPilotChat
- WHEN POSTed to `/api/chat`
- THEN the response MUST be `text/event-stream` with status 200
- AND the stream MUST render in the center column CoPilotChat

#### Scenario: Empty messages array

- GIVEN an empty messages array
- WHEN POSTed to `/api/chat`
- THEN the response MUST be 400 with a descriptive error

### Requirement: Multi-step tool calling

The system MUST support automatic multi-step tool calling with `stopWhen:
isStepCount(5)`. The model SHOULD call multiple tools in sequence to fulfill
a request. The frontend MUST display tool execution steps visually in the
chat bubbles.

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

#### Scenario: Tool execution visible in chat

- GIVEN the agent calls `search_customers` then `create_invoice_with_numbering`
- WHEN the steps execute
- THEN each step MUST show a status indicator in the chat bubble
- AND the final result MUST show confirmation with emerald accent

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

### Requirement: Chat central integrado al WorkspaceContext

El CoPilotChat (panel central) MUST integrarse con el WorkspaceContext para
recibir valores del input desde plantillas y notificar finalización de
operaciones CRUD.

#### Scenario: Input del chat se pre-llena desde plantilla

- GIVEN el usuario en la vista de "Clientes"
- WHEN hace clic en "➕ Registrar Cliente" en el EntityWorkspace
- THEN el input del chat MUST mostrar "Crea un nuevo cliente..."
- AND el usuario MUST poder editar el texto antes de enviar

#### Scenario: Chat dispara refresh del panel derecho

- GIVEN el agente completa exitosamente `create_invoice_with_numbering`
- WHEN el stream de la respuesta termina
- THEN el CoPilotChat MUST llamar `triggerRefresh()`
- AND el EntityWorkspace MUST recargar la tabla Top 10 de facturas

### Requirement: Interfaz visual Factus en el chat

El chat central MUST usar la paleta de colores Factus: burbuja del agente
con fondo zinc-800, burbuja del usuario con fondo índigo, acentos esmeralda
para estados exitosos.

#### Scenario: Burbujas con identidad Factus

- GIVEN un mensaje del usuario en el chat
- THEN la burbuja MUST tener fondo índigo oscuro con texto blanco
- GIVEN un mensaje del agente
- THEN la burbuja MUST tener fondo zinc-800 con texto zinc-100
- AND los tool calls exitosos MUST mostrar badge verde esmeralda
