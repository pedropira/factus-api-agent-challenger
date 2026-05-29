# User Auth Specification

## Purpose

Define how users authenticate with the Factus Agent app using Supabase Auth (email/password). Unauthenticated users SHOULD be able to browse limited content; authenticated users MUST have access to the full app including persistent chat and document management.

## Requirements

### Requirement: Email/password login

The system MUST expose `POST /api/auth/login` accepting `{ email, password }` and returning a session cookie via Supabase SSR.

#### Scenario: Successful login

- GIVEN a registered user with email `user@example.com` and correct password
- WHEN POST to `/api/auth/login` with valid credentials
- THEN the response MUST be 200 with `{ user }` object
- AND a session cookie MUST be set

#### Scenario: Invalid credentials

- GIVEN a registered user
- WHEN POST to `/api/auth/login` with wrong password
- THEN the response MUST be 401 with `{ error }` message
- AND no session cookie MUST be set

### Requirement: Session management via middleware

The system MUST use Next.js middleware (`src/middleware.ts`) to read the Supabase session cookie and redirect unauthenticated users to `/login` for protected routes.

#### Scenario: Authenticated access to home

- GIVEN a user with a valid session cookie
- WHEN they navigate to `/`
- THEN the middleware MUST allow the request to proceed
- AND the page MUST render normally

#### Scenario: Unauthenticated access redirected

- GIVEN a user with NO session cookie
- WHEN they navigate to `/`
- THEN the middleware MUST redirect to `/login`
- AND the original URL MUST be preserved as a `redirectTo` query param

### Requirement: Login page

The system MUST provide a login page at `/login` with email/password form, error display, and redirect to the original destination after successful login.

#### Scenario: Login then redirect

- GIVEN an unauthenticated user redirected from `/` to `/login?redirectTo=/`
- WHEN they submit valid credentials
- THEN they MUST be redirected to `/`

#### Scenario: Login form validation

- GIVEN a user on `/login`
- WHEN they submit with empty email or password
- THEN the form MUST show validation errors
- AND no API call MUST be made

### Requirement: Logout

The system MUST expose `POST /api/auth/logout` that clears the session cookie and redirects to `/login`.

#### Scenario: Successful logout

- GIVEN an authenticated user
- WHEN POST to `/api/auth/logout`
- THEN the session MUST be cleared
- AND the user MUST be redirected to `/login`

### Requirement: Auth context provider

The system MUST provide a `SupabaseAuthProvider` React context that exposes `{ user, session, isLoading, signIn, signOut }` to all child components.

#### Scenario: Auth state in component

- GIVEN a component wrapped in `SupabaseAuthProvider`
- WHEN the user is authenticated
- THEN `user` MUST contain the user object
- AND `isLoading` MUST be false

### Requirement: Protected API routes

API routes that require authentication MUST verify the session and return 401 if missing.

#### Scenario: Unauthenticated API call

- GIVEN an API route `/api/chat`
- WHEN called without a valid session cookie
- THEN the response MUST be 401
- AND the body MUST contain `{ error: "Unauthorized" }`
