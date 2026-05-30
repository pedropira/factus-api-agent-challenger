# Delta for Chat Agent

## ADDED Requirements

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

## MODIFIED Requirements

### Requirement: Streaming chat endpoint

The system MUST expose `POST /api/chat` accepting `{ messages: UIMessage[] }`
and returning a streaming SSE response via `toUIMessageStreamResponse()`.
The chat frontend is now the CoPilotChat component in the center column.
(Previously: ChatShell was the only chat component, positioned at left)

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
isStepCount(5)`. The frontend MUST display tool execution steps visually
in the chat bubbles.
(Previously: Tool calls were text-only in the message stream)

#### Scenario: Tool execution visible in chat

- GIVEN the agent calls `search_customers` then `create_invoice_with_numbering`
- WHEN the steps execute
- THEN each step MUST show a status indicator in the chat bubble
- AND the final result MUST show confirmation with emerald accent
