# Dashboard Records Specification

## Purpose

Define the read-only REST API that exposes Supabase data (customers, products, invoices, credit notes, support documents, adjustment notes) to the frontend dashboard components. Dashboard reads go DIRECTLY to Supabase via Prisma, NEVER through the MCP server.

## Requirements

### Requirement: Unified records endpoint

The system MUST expose `GET /api/records?type={entity}` accepting a `type` query parameter and returning a JSON array of the requested entity.

#### Scenario: Get top customers

- GIVEN there are customers in Supabase
- WHEN a GET request is sent to `/api/records?type=customers`
- THEN the response MUST have status 200
- AND the body MUST contain a `data` array of up to 10 customer objects
- AND each object MUST include `id`, `identification`, `names` or `company`, `email`, `created_at`

#### Scenario: Get top products

- GIVEN there are products in Supabase
- WHEN a GET request is sent to `/api/records?type=products`
- THEN the response MUST have status 200
- AND the body MUST contain a `data` array of up to 10 product objects
- AND each object MUST include `id`, `code_reference`, `name`, `price`, `tax_rate`

#### Scenario: Get recent invoices

- GIVEN there are invoices in Supabase
- WHEN a GET request is sent to `/api/records?type=invoices`
- THEN the response MUST have status 200
- AND the body MUST contain a `data` array of up to 10 invoice objects
- AND each object MUST include `id`, `reference_code`, `bill_number`, `status`, `total`, `created_at`
- AND the invoices MUST be ordered by `created_at` descending

#### Scenario: Get recent credit notes

- GIVEN there are credit notes in Supabase
- WHEN a GET request is sent to `/api/records?type=credit_notes`
- THEN the response MUST have status 200
- AND the body MUST contain a `data` array of up to 10 credit note objects
- AND each object MUST include `id`, `reference_code`, `bill_number`, `status`, `total`, `created_at`
- AND the credit notes MUST be ordered by `created_at` descending

#### Scenario: Get recent support documents

- GIVEN there are support documents in Supabase
- WHEN a GET request is sent to `/api/records?type=support_documents`
- THEN the response MUST have status 200
- AND the body MUST contain a `data` array of up to 10 support document objects

#### Scenario: Get recent adjustment notes

- GIVEN there are adjustment notes in Supabase
- WHEN a GET request is sent to `/api/records?type=adjustment_notes`
- THEN the response MUST have status 200
- AND the body MUST contain a `data` array of up to 10 adjustment note objects

#### Scenario: Invalid entity type

- GIVEN a GET request to `/api/records?type=invalid`
- THEN the response MUST have status 400
- AND the body MUST contain an `error` field

#### Scenario: Missing type parameter

- GIVEN a GET request to `/api/records` without `type`
- THEN the response MUST have status 400
- AND the body MUST contain an `error` field

### Requirement: Dashboard components fetch from API

Each dashboard component MUST fetch its data from `/api/records?type={entity}` on mount using `useEffect` or a React data-fetching pattern.

#### Scenario: Component shows data on successful fetch

- GIVEN the API returns data successfully
- WHEN the component mounts
- THEN it SHALL render the data in a table or card layout
- AND it SHALL NOT show the "API de datos pendiente" placeholder

#### Scenario: Component shows empty state

- GIVEN the API returns an empty array
- WHEN the component mounts
- THEN it SHALL display a "Sin registros" message

#### Scenario: Component shows error state

- GIVEN the API returns an error or network fails
- WHEN the component mounts
- THEN it SHALL display an error message

### Requirement: Prisma schema includes all entities

The Prisma schema MUST define models for `support_document` and `adjustment_note` matching the Supabase table structure.

#### Scenario: Support document model exists

- GIVEN `npx prisma generate` has been run
- WHEN importing `PrismaClient`
- THEN the client MUST have a `support_document` property

#### Scenario: Adjustment note model exists

- GIVEN `npx prisma generate` has been run
- WHEN importing `PrismaClient`
- THEN the client MUST have an `adjustment_note` property
