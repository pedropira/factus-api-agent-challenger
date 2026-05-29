# Delta for Chat Agent

## MODIFIED Requirements

### Requirement: Swappable storage backend

The system MUST support swappable chat storage backends via the `ChatStorage` interface. The factory `createChatStorage()` MUST accept an optional `userId` parameter. When provided without a `conversationId`, it MUST use `SupabaseChatStorage` which loads the latest conversation for that user. When omitted, it MUST use `LocalStorageChatStorage` as fallback for anonymous sessions.
(Previously: factory took no parameters and always returned LocalStorageChatStorage)

#### Scenario: Authenticated user gets Supabase storage

- GIVEN an authenticated user with `userId = "abc-123"`
- WHEN `createChatStorage("abc-123")` is called
- THEN the returned instance MUST be a `SupabaseChatStorage`
- AND loading messages MUST query `chat_messages` for that user's latest conversation

#### Scenario: Anonymous user gets localStorage

- GIVEN NO authenticated user
- WHEN `createChatStorage()` is called without arguments
- THEN the returned instance MUST be a `LocalStorageChatStorage`
- AND messages MUST persist to localStorage

#### Scenario: Supabase messages persist across devices

- GIVEN an authenticated user with messages stored in Supabase
- WHEN they log in from a different device
- THEN `load()` MUST return the same messages
- AND message order MUST be preserved by `sequence_number`

### Requirement: Chat API route is protected

The `POST /api/chat` endpoint MUST verify the user session before processing. If the session is missing or invalid, it MUST return 401.
(Previously: no auth check, all requests were allowed)

#### Scenario: Authenticated request to /api/chat

- GIVEN a valid session cookie
- WHEN POST to `/api/chat` with messages
- THEN the route MUST process the request normally
- AND messages MUST be persisted to Supabase (not localStorage) after each step

#### Scenario: Unauthenticated request to /api/chat

- GIVEN NO session cookie
- WHEN POST to `/api/chat` with messages
- THEN the response MUST be 401
- AND the body MUST contain `{ error: "Unauthorized" }`

## ADDED Requirements

### Requirement: Session-scoped storage resolution

The chat pipeline MUST resolve the storage backend based on the authenticated user. When a user session is present, it MUST pass the `userId` and optional `conversationId` to `createChatStorage()`.

#### Scenario: Pipeline uses correct storage per session

- GIVEN an authenticated request with session user id
- WHEN `runChatPipeline` processes messages
- THEN it MUST create storage with the user's id
- AND after each tool step, messages MUST be persisted to the chosen backend

#### Scenario: Messages saved after each step

- GIVEN a multi-step tool invocation
- WHEN each tool call completes
- THEN `storage.save()` MUST be called with the updated message list
- AND the save MUST include both user messages and assistant responses
