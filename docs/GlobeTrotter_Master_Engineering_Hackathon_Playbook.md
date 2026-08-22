# GlobeTrotter — Master Engineering & Hackathon Playbook

> **Purpose:** This document is the single engineering rulebook for the GlobeTrotter team.
>
> **Read this before writing code.**
>
> The goal is not to build the largest project. The goal is to build a project that is **complete, clean, secure, testable, maintainable, accessible, demonstrable, and deeply aligned with the problem statement**.

---

## 0. The One Rule That Overrides Everything

### **Depth > Breadth**

Do not keep adding features just because they sound impressive.

A smaller set of features that are:

- fully functional
- properly connected
- secure
- tested
- responsive
- accessible
- documented
- easy to demonstrate

is better than a large number of half-finished features.

The competitive analysis showed that the major gap was not lack of ambition. The bigger issue was engineering discipline: code quality, testing, traceability, documentation, and polish.

**Our objective:**

> Build fewer things, but build every important thing properly.

---

# 1. Project Goal

GlobeTrotter is a personalized travel-planning platform.

The core user journey is:

```text
Register / Login
      ↓
Dashboard
      ↓
Create Trip
      ↓
Discover Cities
      ↓
Add Stops
      ↓
Discover Activities
      ↓
Build Itinerary
      ↓
Calculate Budget
      ↓
View Calendar / Timeline
      ↓
Review Trip
      ↓
Share Trip
      ↓
Another User Can Copy Trip
```

Every major feature should support this journey.

Do not build unrelated features that do not strengthen the core workflow.

---

# 2. Problem-Statement Traceability

The official problem statement requires users to:

- create customized multi-city itineraries
- assign travel dates, activities, and budgets
- discover destinations and activities
- receive cost breakdowns and visual calendars
- share plans publicly or with friends
- store complex travel data using a relational database
- provide dynamic interfaces that adapt to the user's trip flow

Source: GlobeTrotter problem statement. 

The application features include authentication, dashboard, trip creation, trip management, itinerary building, itinerary viewing, city search, activity search, budget breakdown, calendar/timeline, public sharing, and profile/settings. Admin/analytics is explicitly optional.

### Rule

Every requirement must map to:

```text
Requirement
    ↓
Feature
    ↓
UI
    ↓
API
    ↓
Database
    ↓
Validation
    ↓
Tests
    ↓
Demo evidence
```

If a feature cannot be traced through this chain, it is not finished.

---

# 3. Architecture Philosophy

We will use a **feature-oriented architecture**.

Do NOT create a giant project where everything is mixed together.

Do NOT create:

```text
utils/
services/
controllers/
models/
helpers/
misc/
```

with hundreds of unrelated files thrown into generic folders.

Instead, organize around actual product features.

### Example

```text
features/
├── auth/
├── users/
├── trips/
├── destinations/
├── activities/
├── itinerary/
├── budget/
├── sharing/
├── community/
└── admin/
```

Each feature owns its related logic.

---

# 4. Golden Rule: One File, One Responsibility

A file should have one clear reason to change.

Avoid:

```text
trip.ts = 1000 lines
```

containing:

- routes
- database queries
- validation
- business logic
- calculations
- formatting
- external API calls

Instead:

```text
features/
└── trips/
    ├── routes.ts
    ├── service.ts
    ├── repository.ts
    ├── schemas.ts
    ├── types.ts
    └── tests/
```

If a file becomes difficult to understand, split it.

### Practical target

- Prefer <100–150 lines per file.
- Avoid files >200 lines unless there is a strong reason.
- Avoid functions that become large enough to require scrolling through multiple screens.
- Keep functions focused.

The winning-project analysis identified a large "God File" as the largest code-quality problem and specifically recommended feature folders and small single-purpose files.

---

# 5. Do Not Create a "God File"

Never create files such as:

```text
api.ts
utils.ts
helpers.ts
service.ts
gemini_client.ts
database.ts
app.ts
```

that eventually contain everything.

A shared utility file should contain genuinely shared utilities.

If something belongs to one feature, keep it in that feature.

---

# 6. Recommended Repository Structure

Use a unified repository/monorepo so the whole team works from one source of truth.

```text
globetrotter/
│
├── apps/
│   ├── web/
│   │   └── src/
│   │       ├── components/
│   │       ├── features/
│   │       │   ├── auth/
│   │       │   ├── dashboard/
│   │       │   ├── trips/
│   │       │   ├── destinations/
│   │       │   ├── activities/
│   │       │   ├── itinerary/
│   │       │   ├── budget/
│   │       │   ├── sharing/
│   │       │   ├── community/
│   │       │   └── profile/
│   │       ├── lib/
│   │       ├── hooks/
│   │       ├── routes/
│   │       └── styles/
│   │
│   └── api/
│       └── src/
│           ├── config/
│           ├── middleware/
│           ├── lib/
│           ├── features/
│           │   ├── auth/
│           │   ├── users/
│           │   ├── trips/
│           │   ├── destinations/
│           │   ├── activities/
│           │   ├── itinerary/
│           │   ├── budget/
│           │   ├── sharing/
│           │   ├── community/
│           │   └── admin/
│           └── app/
│
├── packages/
│   ├── shared-types/
│   ├── validation/
│   └── config/
│
├── database/
│   ├── migrations/
│   ├── seeds/
│   └── tests/
│
├── e2e/
│
├── docs/
│   ├── ARCHITECTURE.md
│   ├── API.md
│   ├── SECURITY.md
│   ├── TESTING.md
│   ├── ACCESSIBILITY.md
│   ├── decisions.md
│   ├── requirements.md
│   └── performance.md
│
├── .github/
│   ├── workflows/
│   │   ├── ci.yml
│   │   ├── security.yml
│   │   └── e2e.yml
│   └── CODEOWNERS
│
├── README.md
├── CONTRIBUTING.md
├── CHANGELOG.md
├── SECURITY.md
├── CODE_OF_CONDUCT.md
├── .editorconfig
├── .gitignore
└── package.json
```

The exact framework-specific names may change, but the architectural principle must remain.

---

# 7. Backend Feature Structure

Every meaningful backend feature should follow a consistent pattern.

Example:

```text
features/trips/
├── routes.ts
├── service.ts
├── repository.ts
├── schemas.ts
├── types.ts
├── errors.ts
└── tests/
    ├── service.test.ts
    ├── routes.test.ts
    └── repository.test.ts
```

### Responsibilities

#### `routes.ts`

Only HTTP concerns:

- route definitions
- request extraction
- authentication dependency
- calling the service
- returning response

Do not put large business logic here.

#### `service.ts`

Business logic:

- create trip
- validate business rules
- update trip
- calculate relevant domain decisions
- coordinate repositories

#### `repository.ts`

Database access:

- queries
- inserts
- updates
- deletes

Do not put UI logic here.

#### `schemas.ts`

Input/output validation schemas.

#### `types.ts`

Domain types/interfaces.

#### `errors.ts`

Feature-specific typed errors where needed.

---

# 8. Frontend Feature Structure

The frontend should mirror the product domain.

Example:

```text
features/trips/
├── components/
│   ├── TripCard.tsx
│   ├── TripForm.tsx
│   └── TripList.tsx
├── hooks/
│   ├── useTrips.ts
│   └── useTrip.ts
├── api.ts
├── schemas.ts
├── types.ts
└── index.ts
```

This makes it obvious where a developer should work.

---

# 9. API Design Rules

All APIs must be versioned.

```text
/api/v1/
```

Examples:

```text
GET    /api/v1/trips
POST   /api/v1/trips
GET    /api/v1/trips/:tripId
PATCH  /api/v1/trips/:tripId
DELETE /api/v1/trips/:tripId
```

Nested resources:

```text
GET    /api/v1/trips/:tripId/stops
POST   /api/v1/trips/:tripId/stops

PATCH  /api/v1/stops/:stopId
DELETE /api/v1/stops/:stopId
```

Itinerary:

```text
GET    /api/v1/trips/:tripId/itinerary
POST   /api/v1/trips/:tripId/itinerary-items
PATCH  /api/v1/itinerary-items/:itemId
DELETE /api/v1/itinerary-items/:itemId
```

Budget:

```text
GET    /api/v1/trips/:tripId/budget
POST   /api/v1/trips/:tripId/expenses
PATCH  /api/v1/expenses/:expenseId
DELETE /api/v1/expenses/:expenseId
```

Sharing:

```text
POST   /api/v1/trips/:tripId/share
GET    /api/v1/shared/:shareToken
POST   /api/v1/shared/:shareToken/copy
```

---

# 10. Do Not Create Useless Endpoints

Avoid endpoints such as:

```text
/trip-data
/trip-info
/trip-details
/trip-overview
/trip-summary
```

when one properly designed resource endpoint can provide the required representation.

Use explicit sub-resources only when they represent a meaningful operation or expensive view.

---

# 11. API Response Standard

Success:

```json
{
  "data": {},
  "meta": {}
}
```

Error:

```json
{
  "error": {
    "code": "TRIP_NOT_FOUND",
    "message": "Trip not found",
    "request_id": "req_123"
  }
}
```

Never return:

- stack traces
- SQL errors
- internal file paths
- secrets
- access tokens
- database credentials

to clients.

---

# 12. Request IDs

Every API request should have a request ID.

Example:

```text
req_01JXXXXXXXX
```

The request ID should appear in:

- server logs
- error responses
- debugging information

This makes production debugging much easier.

---

# 13. Validation

Validation happens at every external boundary.

```text
Request
  ↓
Schema validation
  ↓
Authentication
  ↓
Authorization
  ↓
Business validation
  ↓
Database
```

Never trust frontend validation.

The frontend validation is for user experience.

The backend validation is mandatory for security and correctness.

---

# 14. Business Rules

Schema validation is not enough.

Example:

```text
start_date = 2026-08-20
end_date   = 2026-08-15
```

Both values are valid dates.

The request is still invalid.

Another example:

```text
Trip:
Aug 20 → Aug 25

Activity:
Aug 30
```

Reject it.

Business rules must be explicitly implemented and tested.

---

# 15. Database Philosophy

Use a real relational database.

The problem statement explicitly requires proper relational storage for complex travel data.

The database should enforce integrity instead of relying entirely on application code.

Use:

- primary keys
- foreign keys
- unique constraints
- check constraints
- indexes
- transactions
- timestamps

---

# 16. Core Database Model

Conceptually:

```text
profiles
    │
    └── trips
          │
          ├── trip_stops
          │       │
          │       └── itinerary_items
          │
          └── expenses

destinations ─── trip_stops
activities ───── itinerary_items

profiles ─────── saved_destinations

trips ─────────── shared_trips
```

Keep the model normalized and understandable.

---

# 17. Do Not Store Derived Values Unnecessarily

Avoid storing:

```text
trip.total_cost
trip.average_daily_cost
trip.activity_count
```

if they can reliably be calculated from source data.

For example:

```text
expenses
   ↓
SUM(amount)
   ↓
total cost
```

This prevents stale data.

If denormalization is introduced later for performance, document why in an ADR.

---

# 18. Database Constraints

Use database constraints for important rules.

Examples:

```text
budget >= 0
estimated_cost >= 0
amount >= 0
start_date <= end_date
stop_order >= 0
item_order >= 0
```

Use foreign keys for ownership relationships.

---

# 19. Indexing

Index:

```text
trips.user_id
trip_stops.trip_id
trip_stops.destination_id
itinerary_items.trip_stop_id
itinerary_items.date
expenses.trip_id
expenses.expense_date
saved_destinations.user_id
shared_trips.share_token
destinations.external_id
activities.destination_id
```

Index fields frequently used in:

- RLS policies
- joins
- filtering
- sorting
- lookup operations

---

# 20. RLS / Database Security

Row Level Security is not optional for user-owned data.

The database must remain a security boundary even if the API already performs authorization.

Security should work like:

```text
Frontend
   ↓
API
   ↓
Authentication
   ↓
Authorization
   ↓
PostgreSQL grants
   ↓
RLS
   ↓
Constraints
   ↓
Data
```

---

# 21. Golden RLS Principle

For user-owned data:

```text
auth.uid() = owner_id
```

Users must never be able to access another user's:

- trips
- stops
- itinerary items
- expenses
- saved destinations
- private profile data

Changing an ID in the browser must not bypass authorization.

---

# 22. Child-Resource Authorization

For:

```text
itinerary_items
    ↓
trip_stops
    ↓
trips
    ↓
user
```

authorization must ultimately prove:

```text
trip.user_id = authenticated user
```

Do not trust the client to tell you who owns the resource.

---

# 23. RLS `SELECT`, `INSERT`, `UPDATE`, `DELETE`

Treat each operation separately.

### SELECT

Can this user read the row?

### INSERT

Can this user create this row?

### UPDATE

Can this user modify the existing row?

And is the resulting row still owned by the user?

### DELETE

Can this user delete the row?

Do not create a broad policy such as:

```text
authenticated users can do everything
```

---

# 24. Public Sharing Security

Never expose private trips simply because a public endpoint exists.

Use an opaque share token:

```text
/trip/share/8xK29mQa
```

Public responses should contain only intentionally public fields.

Never expose:

- internal user IDs
- private notes
- private profile information
- authentication information
- private expenses unless intentionally included

---

# 25. Authentication

Use the chosen authentication provider correctly.

Never implement custom password hashing unless there is a genuine requirement.

Never store passwords in:

```text
profiles
```

Never put authentication secrets in the frontend.

Authentication flow:

```text
Register
   ↓
Email verification
   ↓
Profile creation
   ↓
Login
   ↓
Session/JWT
   ↓
Protected application
```

---

# 26. Authorization

Authentication answers:

> Who are you?

Authorization answers:

> What are you allowed to do?

Never confuse them.

Every protected resource must have authorization checks.

---

# 27. Admin Security

Never use:

```text
if email == "admin@example.com"
```

as an authorization mechanism.

Use a controlled role system:

```text
user
admin
```

Admin access must be checked server-side and at the data layer where appropriate.

---

# 28. Rate Limiting

Rate limiting must be intentional and endpoint-specific.

Example starting policy:

| Endpoint type | Starting limit |
|---|---:|
| Normal authenticated GET | 120/min/user |
| Trip CRUD | 60/min/user |
| Search | 30/min/user |
| Reorder | 30/min/user |
| Public share | 60/min/IP |
| Login | 10/15 min/IP |
| Signup | 5/hour/IP |
| Password reset | 5/hour/account + IP |
| Admin | 60/min/user |

These values are starting points, not universal constants.

Measure actual usage and tune them.

---

# 29. Rate Limiting Rules

For sensitive endpoints, consider both:

```text
IP limit
+
User/account limit
```

Do not rely only on per-user limits because attackers can create multiple accounts.

Return:

```text
HTTP 429
```

with:

```text
Retry-After
```

when appropriate.

---

# 30. Pagination

Never return unlimited rows.

Use:

```text
?limit=20&cursor=...
```

Set a server-side maximum.

Example:

```text
maximum limit = 50
```

The client must not be able to request millions of records.

---

# 31. Idempotency

For operations where duplicate requests can cause duplicate data, support idempotency where appropriate.

Potential examples:

```text
create trip
create expense
copy trip
generate share link
```

Use an idempotency key:

```text
Idempotency-Key: <uuid>
```

This protects against accidental duplicate submissions.

---

# 32. Transactions

Multi-step database operations must be transactional.

Example:

```text
Create trip
   ↓
Create stops
   ↓
Create itinerary items
   ↓
Create expenses
```

If one critical step fails:

```text
ROLLBACK
```

Do not leave half-created data.

---

# 33. External APIs

External travel APIs must never be trusted blindly.

Pipeline:

```text
Client
  ↓
Rate limit
  ↓
Input validation
  ↓
Cache lookup
  ↓
External API
  ↓
Timeout
  ↓
Validate response
  ↓
Normalize
  ↓
Client
```

Never expose external API secrets to the browser.

Never create an unrestricted proxy where users can provide arbitrary URLs.

---

# 34. Dynamic Data Requirement

The project requires dynamic or real-time data sources.

Do not build the final system around:

```text
cities.json
activities.json
```

as the sole source of truth.

Use dynamic sources for discovery.

Caching is allowed and encouraged where appropriate.

Architecture:

```text
External API
     ↓
Backend
     ↓
Cache
     ↓
Normalized response
     ↓
Frontend
```

---

# 35. Caching

Cache expensive and frequently repeated external requests.

Example:

```text
Paris search
```

should not necessarily trigger a third-party API call every time.

Cache with an appropriate TTL.

Always document:

- what is cached
- cache duration
- invalidation strategy
- fallback behavior

---

# 36. External API Failure

Never let an external API failure crash the whole application.

Handle:

```text
timeout
rate limit
5xx
invalid response
empty response
network failure
```

Return a controlled application error.

---

# 37. Timeouts

All external network calls must have explicit timeouts.

Do not allow a request to hang indefinitely.

---

# 38. Security Headers

Use appropriate security headers.

The competitive analysis specifically highlighted:

- strong CSP
- Permissions-Policy
- CSRF protection
- secret scanning
- security documentation

Do not blindly copy a security-header configuration.

Understand what each directive does.

---

# 39. CSP

Prefer restrictive Content Security Policy configuration.

Do not casually add:

```text
unsafe-inline
unsafe-eval
```

just to make something work.

If an exception is genuinely required, document why.

---

# 40. CSRF

If the application architecture uses cookies for authentication, implement appropriate CSRF protection.

Do not assume:

> "We use JWT, so CSRF can never matter."

Understand the actual browser authentication model before deciding.

---

# 41. Secrets

Never commit:

```text
.env
.env.local
service-role keys
database passwords
JWT secrets
private API keys
```

Use environment variables or a proper secret-management system.

Add secret scanning to CI where possible.

---

# 42. Never Log Secrets

Never log:

```text
password
access token
refresh token
API key
database URL with credentials
```

Be careful with request/response logging.

---

# 43. Error Handling

Use one centralized error-handling strategy.

Do not have every route invent its own error format.

Expected errors should be typed and controlled.

Unexpected errors should:

- be logged internally
- receive a safe client response
- include a request ID

---

# 44. AI Rule

If AI is ever used:

### AI must NOT control deterministic business logic.

Examples:

Do not ask AI:

> "What is the total budget?"

Calculate it in code.

Do not ask AI:

> "Is the trip over budget?"

Calculate it deterministically.

Do not ask AI to invent:

- database IDs
- prices that should come from data
- authorization decisions
- ownership decisions
- dates
- critical business rules

AI can help with:

- natural-language recommendations
- summaries
- explanations
- optional personalization

But deterministic logic stays deterministic.

This separation was a key lesson from the competitive analysis.

---

# 45. Structured AI Output

If AI is used to return structured data:

```text
AI output
   ↓
Schema validation
   ↓
Business validation
   ↓
Application
```

Never use:

```text
eval()
ast.literal_eval()
```

or unsafe string tricks to force arbitrary model output into executable structures.

Use strict schemas.

---

# 46. AI Output Sanitization

If AI-generated text is displayed to users:

```text
AI output
   ↓
Sanitize
   ↓
Length limits
   ↓
Render safely
```

Never assume model output is trusted HTML.

---

# 47. Type Safety

Use strict typing.

Avoid:

```text
any
unknown
```

without a justified reason.

At boundaries, validate unknown data instead of simply casting it.

Bad:

```ts
const trip = response as Trip;
```

Better:

```text
unknown response
    ↓
schema validation
    ↓
Trip
```

---

# 48. Linting

Linting must be enforced, not optional.

CI should fail on warnings where practical.

Do not rely on:

> "Everyone remembers to run lint."

Automate it.

---

# 49. Formatting

Use one formatter.

All contributors should use the same configuration.

Run formatting:

- locally
- pre-commit
- CI

Do not waste team time arguing about formatting.

Let the formatter decide.

---

# 50. Pre-Commit Hooks

Use pre-commit checks for:

- formatting
- linting
- type checking where practical
- secret detection
- staged-file checks

Do not make hooks so slow that developers disable them.

---

# 51. Documentation

The repository should contain:

```text
README.md
CONTRIBUTING.md
SECURITY.md
CHANGELOG.md
CODE_OF_CONDUCT.md

docs/
├── ARCHITECTURE.md
├── API.md
├── TESTING.md
├── ACCESSIBILITY.md
├── decisions.md
├── requirements.md
└── performance.md
```

Documentation is part of the project.

---

# 52. Architecture Decision Records

Whenever the team makes an important architectural decision, document:

```text
Decision
Context
Options considered
Chosen option
Why
Tradeoffs
Consequences
```

Example:

```text
ADR-001: Use PostgreSQL

Context:
The problem requires relational travel data.

Options:
PostgreSQL
Firestore
MongoDB

Decision:
PostgreSQL

Reason:
Strong relational modeling, constraints, transactions,
and suitable authorization policies.

Tradeoff:
More schema/migration work.
```

Do not document decisions after everything is finished.

Document them when the decision is made.

---

# 53. Testing Philosophy

Testing is not the final two-hour task.

Test continuously.

The competitive analysis showed that enforced coverage, hermetic tests, integration tests, E2E tests, accessibility checks, and mutation testing were major engineering-quality signals.

---

# 54. Test Pyramid

```text
             E2E
            /   \
       Integration
         /       \
       Unit Tests
```

Most tests should be fast unit tests.

Use integration tests for real boundaries.

Use E2E for critical user journeys.

---

# 55. Unit Tests

Test:

- business rules
- budget calculations
- date validation
- authorization decisions
- services
- data transformations
- utility functions

Examples:

```text
trip date validation
budget calculation
stop ordering
expense totals
share-token validation
```

---

# 56. Integration Tests

Every important API should have integration coverage.

Test:

```text
valid request
invalid request
unauthorized request
forbidden request
not found
duplicate data
database constraint failure
rate limit behavior
external API failure
```

---

# 57. E2E Tests

Test the actual user journey.

Minimum critical journey:

```text
Register
 ↓
Login
 ↓
Create Trip
 ↓
Add City
 ↓
Add Activity
 ↓
Build Itinerary
 ↓
Add Expense
 ↓
View Budget
 ↓
View Calendar
 ↓
Share Trip
 ↓
Open Public Trip
 ↓
Copy Trip
```

This is much more valuable than testing random buttons independently.

---

# 58. Coverage

Coverage must be measured.

Use a meaningful threshold.

A good target is:

```text
95%+
```

for important application code.

The goal is not to manipulate the number.

The goal is to make regression difficult.

---

# 59. Mutation Testing

Where practical, use mutation testing.

Mutation testing changes code intentionally and checks whether tests catch the change.

Why?

Because:

```text
100% line coverage
```

does not automatically mean:

```text
good tests
```

Mutation testing provides stronger evidence that tests actually detect incorrect behavior.

---

# 60. Hermetic Tests

Tests should not require:

- real external APIs
- real AI keys
- internet access
- production services

Mock external services.

Use test databases or isolated environments.

Tests should be repeatable.

---

# 61. Dependency Injection

Where dependencies need to be tested, make them injectable.

Examples:

```text
clock
random generator
external API client
repository
cache
AI client
```

Avoid unnecessary global mutable state.

This was one of the engineering differences highlighted in the comparison.

---

# 62. Accessibility

Accessibility is a feature.

Use:

- semantic HTML
- proper headings
- keyboard navigation
- visible focus states
- labels
- meaningful alt text
- sufficient contrast
- reduced-motion support
- ARIA only when necessary
- accessible dynamic announcements

---

# 63. Accessibility Testing

Use automated accessibility testing such as axe-core in E2E flows where possible.

Also test manually:

- keyboard-only navigation
- focus order
- forms
- dialogs
- menus
- responsive layouts

Document accessibility evidence.

---

# 64. Responsive Design

Every core screen must work on:

```text
mobile
tablet
desktop
```

Do not design desktop first and call mobile an afterthought.

The official problem statement expects a responsive application across desktop/mobile platforms.

---

# 65. UI Consistency

Use a shared design system.

Define:

```text
colors
typography
spacing
radius
shadows
buttons
inputs
cards
modals
navigation
```

Do not let every developer invent their own component style.

---

# 66. Loading States

Every asynchronous operation should have a loading state.

Examples:

```text
Searching cities...
Loading trips...
Saving itinerary...
Calculating budget...
```

Never leave the user wondering whether the application is frozen.

---

# 67. Empty States

Every list needs a meaningful empty state.

Example:

```text
No trips yet.

Start planning your first journey.
[Plan New Trip]
```

Not:

```text
[]
```

---

# 68. Error States

Every network-dependent screen needs an error state.

Example:

```text
We couldn't load destinations.

[Try Again]
```

Don't display a blank screen.

---

# 69. Optimistic UI

Use optimistic updates only when safe.

Do not optimistically update critical financial/security state without a clear rollback strategy.

For simple interactions such as reordering or saving preferences, optimistic updates can improve UX.

---

# 70. User Experience Rule

Every action should have an obvious result.

For example:

```text
Add Activity
    ↓
Activity appears in itinerary
    ↓
Budget updates
    ↓
Calendar updates
```

The user should never have to refresh the application manually to understand whether an operation worked.

---

# 71. State Management

Avoid duplicating the same source of truth.

For example:

Do NOT maintain:

```text
itinerary state
calendar state
budget state
trip-details state
```

as independent copies that can become inconsistent.

Prefer:

```text
Trip / Itinerary source data
        ↓
Calendar representation
        ↓
Budget calculation
        ↓
UI
```

One source of truth.

---

# 72. Budget Architecture

Expenses should be stored as source data.

Then calculate:

```text
Total
Category totals
Average per day
Daily totals
Over-budget status
```

from the source data.

Categories:

```text
transport
stay
activities
meals
other
```

The problem statement explicitly requires these categories and budget visualization.

---

# 73. Itinerary Architecture

The hierarchy should be understandable:

```text
Trip
 ↓
Stop / City
 ↓
Day
 ↓
Itinerary Item
 ↓
Activity / Expense
```

Do not make the itinerary data model unnecessarily complicated.

---

# 74. City and Activity Data

External data should be normalized into a stable internal representation.

The UI should not depend on the exact response structure of a third-party API.

Bad:

```text
frontend → raw third-party response
```

Better:

```text
third-party API
     ↓
adapter
     ↓
internal Destination model
     ↓
frontend
```

If the provider changes, only the adapter should need significant modification.

---

# 75. API Contracts

Document every endpoint.

For each endpoint document:

```text
Method
Path
Authentication
Authorization
Request body
Query parameters
Response
Errors
Rate limit
Example
```

Keep documentation synchronized with the implementation.

---

# 76. Git Rules

Git is part of the engineering system.

Never have one person managing the entire repository.

Everyone should contribute through branches and pull requests.

Recommended:

```text
main
develop

feature/auth
feature/trips
feature/itinerary
feature/budget
feature/search
feature/sharing
feature/profile
feature/admin
```

---

# 77. Pull Request Rules

Every PR should explain:

```text
What changed?
Why?
How was it tested?
Any database changes?
Any security implications?
Any UI changes?
```

Keep PRs focused.

Do not submit one PR containing:

```text
authentication + budget + UI redesign + database migration + random cleanup
```

---

# 78. Code Review Rules

Review for:

### Correctness

Does it work?

### Security

Can another user access the data?

### Maintainability

Is the code understandable?

### Testing

Is the behavior tested?

### Performance

Does it create unnecessary queries/API calls?

### Accessibility

Does it remain usable?

### Scope

Does this change actually belong?

---

# 79. Commit Convention

Use conventional commits.

Examples:

```text
feat: add trip creation flow
feat: add itinerary activity management
fix: prevent invalid trip date ranges
refactor: split destination search service
test: add trip authorization tests
docs: document sharing architecture
security: tighten trip access policy
chore: update lint configuration
```

Avoid:

```text
update
changes
final
final2
latest
working
new
test
```

---

# 80. Database Migrations

Never manually modify production schema without a migration.

Every schema change should be represented in version control.

Example:

```text
database/migrations/
├── 001_initial_schema
├── 002_add_trip_budget
├── 003_add_shared_trips
└── 004_add_saved_destinations
```

Migrations must be reviewed like code.

---

# 81. Seed Data

Seed data is useful for:

- local development
- demos
- tests

But do not confuse seed/demo data with the dynamic production data requirement.

Clearly separate:

```text
development seed data
```

from:

```text
production external/dynamic data
```

---

# 82. Local Development

Every teammate should be able to clone the repository and run the project with documented steps.

README should include:

```text
Prerequisites
Installation
Environment variables
Database setup
Migrations
Seed data
Development server
Testing
Linting
Build
Deployment
```

No developer should need undocumented tribal knowledge.

---

# 83. Environment Configuration

Validate required environment variables at startup.

Fail fast.

Do not allow:

```text
DATABASE_URL = undefined
```

to cause a random failure 20 minutes later.

Required configuration should be checked immediately.

---

# 84. Environment Separation

Use separate configurations for:

```text
development
test
production
```

Never run tests against production.

Never use production secrets locally unless absolutely necessary.

---

# 85. CI Pipeline

Every pull request should run as much as reasonably practical:

```text
Install
 ↓
Lint
 ↓
Typecheck
 ↓
Unit tests
 ↓
Coverage
 ↓
Integration tests
 ↓
Security checks
 ↓
Build
```

E2E can run in a separate workflow if required for speed.

---

# 86. CI Must Fail on Regression

Do not merely report:

```text
coverage = 72%
```

and continue.

If the project requires:

```text
coverage >= 95%
```

then CI must fail when coverage drops.

Same philosophy for:

- lint warnings
- type errors
- security checks
- broken builds

---

# 87. Security CI

Include automated checks where practical:

```text
secret scanning
dependency audit
lint
type checking
security configuration checks
```

Never treat automated scanners as perfect.

They are additional layers, not replacements for human review.

---

# 88. Performance

Do not optimize blindly.

Measure.

Track:

```text
API response times
database query performance
frontend load performance
bundle size
external API latency
cache hit rate
```

Document meaningful results.

---

# 89. Database Performance

Avoid:

```text
N+1 queries
```

Example:

```text
Load 100 trips
    ↓
100 additional queries for stops
```

Instead, design appropriate queries/joins/preloading.

Measure before optimizing.

---

# 90. External API Performance

Use:

```text
timeouts
caching
request deduplication where useful
pagination
rate limits
```

Do not repeatedly call the same external API for identical information.

---

# 91. Don't Overengineer

This is extremely important.

Do not add:

- microservices
- Kubernetes
- Kafka
- unnecessary WebSockets
- blockchain
- AI everywhere
- multiple databases
- unnecessary message queues

unless there is a clear requirement.

Complexity must have a reason.

---

# 92. Technology Selection Rule

Before adding a technology, answer:

```text
1. What problem does it solve?
2. Why can't our current stack solve it?
3. What complexity does it add?
4. Can the team maintain it?
5. Does it improve the actual product?
6. Can we test it?
7. Does it help the problem statement?
```

If the answer is weak, do not add it.

---

# 93. Feature Completion Definition

A feature is NOT complete when:

```text
"It works on my machine."
```

A feature is complete when:

```text
UI
+
API
+
Database
+
Validation
+
Authorization
+
Error handling
+
Loading state
+
Empty state
+
Tests
+
Accessibility
+
Documentation
```

are appropriate for that feature.

---

# 94. Definition of Done

Before marking a feature complete:

- [ ] UI implemented
- [ ] Responsive
- [ ] API implemented
- [ ] Database model implemented
- [ ] RLS/authorization reviewed
- [ ] Input validation implemented
- [ ] Business rules implemented
- [ ] Error states handled
- [ ] Loading states handled
- [ ] Empty states handled
- [ ] Unit tests added
- [ ] Integration tests added where applicable
- [ ] E2E coverage added if part of a critical flow
- [ ] Accessibility checked
- [ ] Documentation updated
- [ ] API documentation updated
- [ ] No lint/type errors
- [ ] PR reviewed

---

# 95. Critical GlobeTrotter Demo Journey

The most important demo should be:

```text
1. Register/Login
2. Dashboard
3. Create a trip
4. Search for a city
5. Add city to trip
6. Add another city
7. Search activities
8. Add activities
9. Build day-wise itinerary
10. Reorder itinerary
11. Add expenses
12. Open budget
13. Show cost breakdown
14. Show over-budget warning
15. Open calendar/timeline
16. Share trip
17. Open public URL
18. Copy trip as another user
```

This should work reliably without manual database manipulation.

---

# 96. Demo Data

Prepare a clean demo account and realistic demo data.

Do not depend on:

```text
random external API responses
```

at the critical moment.

Where appropriate:

- cache known demo data
- ensure external APIs are available
- have graceful fallback behavior
- prepare a clean database state

The demo must still demonstrate the required dynamic architecture.

---

# 97. Judge Experience

The judge should not have to:

- configure environment variables
- create database tables
- manually insert data
- run five servers
- install obscure dependencies
- fix CORS
- wait for broken external APIs

Prefer a simple, reliable deployment.

One clear URL is ideal where the architecture permits it.

---

# 98. Requirement Evidence

Create a requirement matrix.

Example:

| Requirement | Feature | Route | API | Test | Demo |
|---|---|---|---|---|---|
| Multi-city itinerary | Itinerary | `/trips/:id` | itinerary API | E2E-01 | Demo step 8 |
| Budget | Budget | `/trips/:id/budget` | budget API | Budget tests | Demo step 12 |
| City discovery | Destinations | `/discover` | search API | Search tests | Demo step 4 |
| Sharing | Sharing | `/share/:token` | share API | Share E2E | Demo step 16 |

This proves alignment instead of merely claiming it.

---

# 99. Assumptions

Document anything simulated.

Example:

```text
Assumption:
Activity prices are estimated and may not represent live booking prices.

Reason:
The application is a planning tool, not a booking platform.
```

Never pretend simulated data is real.

---

# 100. Accessibility Evidence

Document:

```text
WCAG target
axe-core results
keyboard testing
contrast checks
responsive testing
Lighthouse results
```

Evidence is stronger than claims.

---

# 101. Security Evidence

Document:

```text
Authentication
Authorization
RLS
Rate limiting
Input validation
CSRF model
CSP
Security headers
Secret management
Audit logging
Dependency scanning
Threat model
```

Do not claim:

```text
100% secure
```

Security is a continuous process.

Instead document the controls and assumptions.

---

# 102. Threat Model

At minimum consider:

```text
Unauthorized trip access
Account takeover
Brute-force login
Rate-limit abuse
External API abuse
Malicious file uploads
XSS
CSRF
SQL injection
IDOR/BOLA
Privilege escalation
Secret leakage
Data exposure
Denial of service
```

For each:

```text
Threat
Impact
Likelihood
Mitigation
Test
```

---

# 103. Common Mistakes We Must NOT Repeat

## Mistake 1 — Giant files

### Don't

```text
800-line service file
```

### Do

```text
small feature modules
```

---

## Mistake 2 — Adding features faster than finishing them

### Don't

```text
20 half-working features
```

### Do

```text
8 excellent features
```

---

## Mistake 3 — No enforced tests

### Don't

```text
"Tests exist."
```

### Do

```text
CI fails when quality drops.
```

---

## Mistake 4 — Testing only happy paths

Test:

```text
success
invalid input
unauthorized
forbidden
not found
duplicate
rate limited
external API failure
database failure
```

---

## Mistake 5 — Trusting the frontend

Never trust:

```text
user_id
trip_id
role
price
permissions
```

provided by the browser.

Verify everything server-side/database-side.

---

## Mistake 6 — AI everywhere

Do not use AI where normal deterministic code is better.

---

## Mistake 7 — Unsafe parsing

Never use:

```text
eval()
ast.literal_eval()
```

to process untrusted/AI-generated structured output.

---

## Mistake 8 — Hardcoded production data

Do not rely entirely on static JSON when the requirement calls for dynamic data.

---

## Mistake 9 — Secrets in Git

Never commit credentials.

---

## Mistake 10 — Direct database manipulation during demo

If the feature is required, the actual application flow should work.

---

## Mistake 11 — One person controls Git

Everyone contributes through branches and pull requests.

---

## Mistake 12 — No documentation

A technically strong system should still explain:

```text
what
why
how
tradeoffs
limitations
```

---

# 104. Team Responsibilities

The team may divide ownership, but nobody owns an isolated silo forever.

Example:

```text
Developer A
Authentication + Users

Developer B
Trips + Database

Developer C
Itinerary + Activities

Developer D
Budget + Calendar

Developer E
Frontend integration + Sharing + E2E
```

Everyone must:

- understand their code
- understand the API contract
- write tests
- document important decisions
- review other people's PRs

---

# 105. No "It Was Generated by AI" Excuse

AI tools may assist development.

But every generated code section must be:

- understood
- reviewed
- adapted
- tested
- secured
- formatted
- documented where necessary

Never paste AI code blindly.

The project requirements themselves emphasize understanding AI/code snippets rather than blindly copy-pasting them.

---

# 106. AI Coding Rules

When using an AI coding assistant:

### Before accepting code

Ask:

```text
What does this code do?
What assumptions does it make?
What security risks exist?
What happens on invalid input?
What happens if the API fails?
How is it tested?
Does it match our architecture?
```

If you cannot answer these questions, do not merge the code.

---

# 107. Code Review Checklist

Before approving any PR:

```text
[ ] Does it follow feature architecture?
[ ] Is each file focused?
[ ] Is there duplicated logic?
[ ] Are types strict?
[ ] Is validation present?
[ ] Is authorization correct?
[ ] Are RLS implications considered?
[ ] Are errors handled?
[ ] Are tests included?
[ ] Is accessibility considered?
[ ] Are database migrations included?
[ ] Are docs updated?
[ ] Are secrets absent?
[ ] Does CI pass?
```

---

# 108. Release Checklist

Before the final hackathon submission:

```text
[ ] Production build works
[ ] Deployment works
[ ] Authentication works
[ ] Database migrations applied
[ ] RLS tested
[ ] All critical CRUD operations work
[ ] Dynamic APIs work
[ ] Rate limits tested
[ ] Public sharing works
[ ] Copy-trip works
[ ] Budget calculations verified
[ ] Calendar verified
[ ] Mobile UI verified
[ ] Accessibility scan completed
[ ] E2E critical journey passes
[ ] CI green
[ ] Security scan green
[ ] README complete
[ ] Architecture diagram complete
[ ] API documentation complete
[ ] Requirement traceability complete
[ ] Demo account prepared
[ ] Demo data prepared
[ ] Backup/fallback plan prepared
```

---

# 109. Final Architecture Principle

Our system should look like:

```text
                    USER
                      │
                      ▼
                 FRONTEND
                      │
                      ▼
              VALIDATED API
                      │
            ┌─────────┴─────────┐
            ▼                   ▼
       AUTHORIZATION       EXTERNAL APIs
            │                   │
            ▼                   ▼
          RLS                 CACHE
            │
            ▼
       POSTGRESQL
            │
            ▼
     TESTED DOMAIN LOGIC
```

Every layer has a purpose.

---

# 110. The Standard We Are Targeting

We are not targeting:

> "It works."

We are targeting:

> **"It works, it is understandable, it is secure, it is tested, it is accessible, it is maintainable, it is documented, and we can prove every important requirement."**

That is the standard.

---

# 111. Final Team Rules

### Rule 1

**Do not create unnecessary complexity.**

### Rule 2

**Do not create giant files.**

### Rule 3

**Do not merge untested critical code.**

### Rule 4

**Do not trust client input.**

### Rule 5

**Do not bypass RLS/authorization for convenience.**

### Rule 6

**Do not commit secrets.**

### Rule 7

**Do not use AI as a replacement for deterministic business logic.**

### Rule 8

**Do not add a technology without a reason.**

### Rule 9

**Do not add a feature before the core features are complete.**

### Rule 10

**Every requirement must have evidence.**

### Rule 11

**Every teammate contributes through Git properly.**

### Rule 12

**If something is difficult to test, reconsider the design.**

### Rule 13

**If a file becomes too large, split it.**

### Rule 14

**If a decision has meaningful architectural consequences, document it.**

### Rule 15

**Build for the user first and the evaluator second — but make the engineering quality obvious to both.**

---

# 112. The Winning Mindset

The competitive analysis produced the most important lesson:

> **The winning strategy is not "build more." It is "build cleaner."**

The strongest project is not necessarily the one with:

- the most AI
- the most APIs
- the most screens
- the most technologies
- the most lines of code

It is the project where the important features are:

```text
well designed
    +
well implemented
    +
secure
    +
tested
    +
accessible
    +
documented
    +
traceable
    +
demonstrable
```

That is the engineering standard we will follow.

---

# 113. Source-Derived Engineering Lessons

This playbook incorporates the lessons identified in the uploaded competitive-analysis material:

- Feature-folder architecture and small focused modules were identified as a major code-quality differentiator.
- Strict linting, formatting, typing, documentation, and pre-commit enforcement were highlighted.
- Enforced coverage, integration testing, E2E testing, accessibility scanning, and mutation testing were identified as strong testing signals.
- Architecture Decision Records, security documentation, requirement traceability, and documented performance/accessibility evidence were highlighted.
- The comparison explicitly concluded that depth and polish per feature can outperform broader but thinner feature sets.
- The playbook emphasizes structured validation for AI output and avoiding unsafe parsing.

These lessons come from the uploaded competitive-analysis and hackathon-playbook files and are intentionally generalized here so the team can apply the strategy without reproducing the original project.

---

# 114. Final Message to the Team

Before writing code, remember:

```text
We are not trying to impress people with complexity.

We are trying to build a system so clean that its quality is obvious.

Every feature should have:
UI
API
Database
Validation
Authorization
Tests
Documentation
Evidence

Every important decision should have:
Reason
Tradeoff
Documentation

Every user flow should be:
Simple
Reliable
Responsive
Accessible

Every security boundary should be:
Explicit
Tested
Enforced

Every teammate should:
Use Git properly
Review code
Understand their code
Test their work
Respect the architecture
```

## Build less.

## Build it completely.

## Build it cleanly.

## Prove that it works.

# END
