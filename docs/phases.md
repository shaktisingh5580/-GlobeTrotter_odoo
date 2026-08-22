# GlobeTrotter — Implementation Phases (15 Phases)

> **Each phase is self-contained and testable.** After completing a phase, you can verify it works before moving on.  
> **Related Files:** [database_design.md](file:///c:/Users/shakt/Downloads/oddo/database_design.md) · [security_layer.md](file:///c:/Users/shakt/Downloads/oddo/security_layer.md) · [api_design.md](file:///c:/Users/shakt/Downloads/oddo/api_design.md)

---

## Phase Overview

| Phase | Name | What You Build | Endpoints Added | Tables Touched |
|---|---|---|---|---|
| 1 | Project Foundation | NestJS project, config, folder structure | 0 | 0 |
| 2 | Database & Prisma | Docker, PostgreSQL, Prisma schema, migrations | 0 | 20 (schema only) |
| 3 | Security Core | Guards, pipes, filters, interceptors, middleware | 0 | 0 |
| 4 | File Uploads | Media files module + Multer | 2 | `media_files` |
| 5 | Auth — Registration & Login | Register, login, JWT | 2 | `users`, `refresh_sessions` |
| 6 | Auth — Tokens & Recovery | Refresh, logout, password reset, email verify | 5 | `refresh_sessions`, `password_reset_tokens`, `email_verification_tokens` |
| 7 | Users Module | Profile CRUD, password change, stats | 5 | `users` |
| 8 | Trips Module | Trip CRUD + full view | 6 | `trips` |
| 9 | Stops Module | Stop CRUD + reordering | 6 | `trip_stops` |
| 10 | Sections Module | Section CRUD + reordering | 6 | `trip_sections` |
| 11 | Seed Data & Discovery | Destinations + Activities + seed script | 11 | `destinations`, `activities`, `saved_destinations` |
| 12 | Itinerary Module | Items CRUD, calendar, timeline | 7 | `itinerary_items` |
| 13 | Budget Module | Expenses CRUD, summaries, breakdowns | 7 | `expenses` |
| 14 | Sharing & Community | Share links, community posts/comments/reactions | 19 | `shared_trips`, `community_posts`, `community_comments`, `community_reactions`, `community_post_media` |
| 15 | Admin, Analytics & Polish | Admin panel, analytics, audit logs, final tests | 12 | `analytics_events`, `audit_logs` |

---

## Phase 1: Project Foundation

### What You Build
- NestJS project with TypeScript strict mode
- Folder structure matching the architecture
- Base configuration module
- `.env.example` and config validation
- `package.json` with all dependencies

### Steps

```text
1. npx @nestjs/cli new globetrotter --strict --skip-git --package-manager npm
2. Install dependencies:
   npm i @nestjs/config @nestjs/throttler @prisma/client class-validator class-transformer
   npm i helmet express-rate-limit uuid bcrypt
   npm i -D prisma @types/bcrypt @types/uuid
3. Create folder structure (see below)
4. Set up ConfigModule with validation
5. Create .env.example
```

### Folder Structure to Create

```text
src/
├── main.ts
├── app.module.ts
├── config/
│   ├── config.module.ts
│   ├── config.service.ts
│   └── env.validation.ts
├── common/
│   ├── decorators/
│   ├── filters/
│   ├── guards/
│   ├── interceptors/
│   ├── middleware/
│   ├── pipes/
│   ├── types/
│   └── utils/
├── prisma/
│   └── prisma.module.ts
│   └── prisma.service.ts
├── audit/
├── analytics/
└── features/
    ├── auth/
    ├── users/
    ├── trips/
    ├── stops/
    ├── sections/
    ├── destinations/
    ├── activities/
    ├── itinerary/
    ├── budget/
    ├── sharing/
    ├── community/
    ├── admin/
    └── uploads/
```

### Verification
```text
[ ] npm run build succeeds
[ ] npm run start:dev starts without errors
[ ] ConfigModule loads environment variables
[ ] Folder structure matches plan
```

### Context References
- **Project structure:** [api_design.md — Endpoint Summary](file:///c:/Users/shakt/Downloads/oddo/api_design.md) — all 13 feature modules that need folders
- **Environment variables:** [security_layer.md — §11 Environment Variables](file:///c:/Users/shakt/Downloads/oddo/security_layer.md) — complete list of env vars

---

## Phase 2: Database & Prisma

### What You Build
- `docker-compose.yml` for PostgreSQL 16
- Complete Prisma schema (20 models)
- Initial migration
- RLS policies migration
- Prisma seed script skeleton

### Steps

```text
1. Create docker-compose.yml
2. docker compose up -d
3. npx prisma init
4. Write schema.prisma with ALL 20 models
5. npx prisma migrate dev --name init
6. Create migration for RLS policies
7. Create seed.ts skeleton
8. Test connection: npx prisma studio
```

### Key Decisions
- `media_files` created BEFORE `users` (circular FK solved with deferred constraint)
- All UUIDs use `@default(uuid())`
- All timestamps use `@default(now())`
- Enums in schema match CHECK constraints

### Verification
```text
[ ] docker compose up -d starts PostgreSQL
[ ] npx prisma migrate dev runs clean
[ ] npx prisma studio connects and shows 20 tables
[ ] All FK constraints visible
[ ] All CHECK constraints visible
[ ] RLS enabled on all tables (verified via psql)
```

### Context References
- **All 20 table DDL:** [database_design.md — Complete SQL Schema](file:///c:/Users/shakt/Downloads/oddo/database_design.md) — Table 1 through Table 20
- **Docker Compose:** [database_design.md — Docker Compose](file:///c:/Users/shakt/Downloads/oddo/database_design.md)
- **Orphan protection matrix:** [database_design.md — Orphan Record Protection](file:///c:/Users/shakt/Downloads/oddo/database_design.md) — 32 FK rules
- **RLS policies:** [security_layer.md — §4 PostgreSQL RLS](file:///c:/Users/shakt/Downloads/oddo/security_layer.md) — all policies

---

## Phase 3: Security Core

### What You Build
- Global validation pipe (whitelist + forbidNonWhitelisted)
- Global exception filter (error sanitization)
- Request ID middleware
- Response transform interceptor
- JWT auth guard (skeleton — wired in Phase 5)
- Roles guard (skeleton — wired in Phase 5)
- RLS context middleware
- Helmet + CORS configuration
- Rate limiting setup

### Steps

```text
1. Create ValidationPipe config (whitelist: true, forbidNonWhitelisted: true)
2. Create GlobalExceptionFilter — maps Prisma errors to safe responses
3. Create RequestIdMiddleware — generates req_xxx
4. Create ResponseTransformInterceptor — wraps all responses in standard envelope
5. Create JwtAuthGuard skeleton
6. Create RolesGuard skeleton
7. Create RlsContextMiddleware — sets app.current_user_id
8. Configure Helmet in main.ts
9. Configure CORS in main.ts
10. Set up @nestjs/throttler
```

### Verification
```text
[ ] Validation pipe rejects unknown fields (send { "role": "admin" } to any endpoint)
[ ] Exception filter returns sanitized errors (trigger a Prisma error, verify no DB details leak)
[ ] Request ID appears in response headers and body
[ ] Response envelope matches standard format
[ ] Helmet headers present (check with curl -I)
[ ] CORS blocks unauthorized origins
[ ] Rate limiting returns 429 after threshold
```

### Context References
- **16-layer pipeline:** [security_layer.md — §1 Defense in Depth](file:///c:/Users/shakt/Downloads/oddo/security_layer.md) — exact layer order and rejection codes
- **Error sanitization:** [security_layer.md — §6 Error Sanitization](file:///c:/Users/shakt/Downloads/oddo/security_layer.md) — what client sees vs what server logs
- **CORS/Headers:** [security_layer.md — §7 CORS, Headers & Body Limits](file:///c:/Users/shakt/Downloads/oddo/security_layer.md)
- **Rate limits per endpoint:** [security_layer.md — §8 Rate Limiting](file:///c:/Users/shakt/Downloads/oddo/security_layer.md)
- **Standard response envelope:** [api_design.md — Standard Response Envelope](file:///c:/Users/shakt/Downloads/oddo/api_design.md) — success/error/pagination formats

---

## Phase 4: File Uploads

### What You Build
- Upload module with Multer
- `media_files` repository
- File validation (MIME type, size, magic bytes)
- Server-generated filenames
- URL generation service
- `POST /uploads/image` and `DELETE /uploads/:fileId`

### Endpoints Added
| Method | Endpoint | Expected Response |
|---|---|---|
| `POST` | `/api/v1/uploads/image` | `201` — `{ id, url, original_filename, mime_type, file_size }` |
| `DELETE` | `/api/v1/uploads/:fileId` | `200` — `{ message: "File deleted" }` |

### Steps

```text
1. npm i @nestjs/platform-express multer
2. npm i -D @types/multer
3. Create uploads/ directory in project root
4. Create UploadsModule with Multer config
5. Create MediaFilesRepository (Prisma CRUD)
6. Create MediaService (URL generation, validation)
7. Implement file type validation (magic bytes)
8. Create upload controller with auth guard
9. Create delete endpoint with ownership check
10. Create AuditService and wire FILE_UPLOADED/FILE_DELETED events
```

### Verification
```text
[ ] Upload a valid JPEG → returns file ID and URL
[ ] Upload a .exe renamed to .jpg → rejected (magic bytes check)
[ ] Upload > 5MB → returns 413
[ ] Delete own file → 200
[ ] Delete another user's file → 404
[ ] URL in response actually serves the image
```

### Context References
- **Media files table DDL:** [database_design.md — Table 1: media_files](file:///c:/Users/shakt/Downloads/oddo/database_design.md)
- **File upload security:** [security_layer.md — §7.4 File Upload Security](file:///c:/Users/shakt/Downloads/oddo/security_layer.md) — magic bytes, re-encoding, server filenames
- **Upload API responses:** [api_design.md — MODULE 12: Uploads](file:///c:/Users/shakt/Downloads/oddo/api_design.md) — exact JSON shapes
- **Audit events:** [security_layer.md — §5 Audit Logging](file:///c:/Users/shakt/Downloads/oddo/security_layer.md) — `FILE_UPLOADED`, `FILE_DELETED`
- **Ownership check:** [security_layer.md — §3.3 IDOR Prevention](file:///c:/Users/shakt/Downloads/oddo/security_layer.md)

---

## Phase 5: Auth — Registration & Login

### What You Build
- AuthModule (controller, service, repository)
- `POST /auth/register` — creates user, hashes password, returns JWT + refresh token
- `POST /auth/login` — validates email+password, returns JWT + refresh token
- JWT strategy (passport-jwt)
- Wire JwtAuthGuard to real JWT verification
- Audit logging for auth events

### Endpoints Added
| Method | Endpoint | Expected Response |
|---|---|---|
| `POST` | `/api/v1/auth/register` | `201` — `{ user, access_token, refresh_token }` |
| `POST` | `/api/v1/auth/login` | `200` — `{ user, access_token, refresh_token }` |

### Steps

```text
1. npm i @nestjs/jwt @nestjs/passport passport passport-jwt
2. npm i -D @types/passport-jwt
3. Create AuthModule, AuthController, AuthService
4. Create RegisterDto with full validation (email, password strength, first_name, last_name, bio, etc.)
5. Create LoginDto (email, password)
6. Implement register: hash password (bcrypt 12), create user, generate JWT + refresh token
7. Implement login: find by email, verify bcrypt, generate tokens
8. Create JWT strategy (extract from Bearer header)
9. Wire JwtAuthGuard to passport-jwt strategy
10. Create refresh_sessions record on login/register
11. Audit log: LOGIN_SUCCESS, LOGIN_FAILED, USER_CREATED
12. Wire rate limiting: register 5/hr, login 10/15min
```

### Verification
```text
[ ] Register → creates user in DB (check prisma studio)
[ ] Register → password_hash is bcrypt (NOT plaintext)
[ ] Register → response does NOT contain password_hash
[ ] Register → duplicate email returns 409
[ ] Login → correct credentials return tokens
[ ] Login → wrong password returns 401 (generic message)
[ ] Login → non-existent email returns 401 (same message as wrong password)
[ ] JWT token works in Authorization header for protected routes
[ ] Rate limit: 11th login attempt in 15 minutes → 429
[ ] Register with bio field → bio saved in DB
```

### Context References
- **Users table DDL:** [database_design.md — Table 2: users](file:///c:/Users/shakt/Downloads/oddo/database_design.md)
- **Refresh sessions table DDL:** [database_design.md — Table 16: refresh_sessions](file:///c:/Users/shakt/Downloads/oddo/database_design.md)
- **Credential storage rules:** [security_layer.md — §2.1 Credential Storage](file:///c:/Users/shakt/Downloads/oddo/security_layer.md)
- **JWT structure:** [security_layer.md — §2.2 JWT Structure](file:///c:/Users/shakt/Downloads/oddo/security_layer.md)
- **Auth API responses:** [api_design.md — MODULE 1: Auth](file:///c:/Users/shakt/Downloads/oddo/api_design.md) — register + login JSON
- **Rate limits:** [security_layer.md — §8 Rate Limiting](file:///c:/Users/shakt/Downloads/oddo/security_layer.md)
- **Field protection:** [security_layer.md — §3.5 Field-Level Protection](file:///c:/Users/shakt/Downloads/oddo/security_layer.md) — users table

---

## Phase 6: Auth — Tokens & Recovery

### What You Build
- Refresh token endpoint with **family-based reuse detection**
- Logout endpoint
- Forgot password + reset password flow
- Email verification flow
- All token hashing (SHA-256)

### Endpoints Added
| Method | Endpoint | Expected Response |
|---|---|---|
| `POST` | `/api/v1/auth/refresh` | `200` — `{ access_token, refresh_token }` |
| `POST` | `/api/v1/auth/logout` | `200` — `{ message }` |
| `POST` | `/api/v1/auth/forgot-password` | `200` — `{ message }` (always, for privacy) |
| `POST` | `/api/v1/auth/reset-password` | `200` — `{ message }` |
| `POST` | `/api/v1/auth/verify-email` | `200` — `{ message }` |

### Steps

```text
1. Implement refresh token rotation (token A used → A marked replaced, B issued)
2. Implement family reuse detection:
   - If token A is used AFTER being replaced → revoke ALL tokens in family F1
   - Audit: REFRESH_TOKEN_REUSE
3. Implement logout: revoke specific refresh token
4. Implement forgot-password: create password_reset_tokens record (hashed)
5. Implement reset-password: verify token hash, update password_hash, mark used
6. Implement verify-email: verify token hash, set email_verified = true
7. All tokens hashed with SHA-256 before DB storage
8. Wire rate limits per endpoint
```

### Verification
```text
[ ] Refresh → old token revoked, new token works
[ ] Refresh → using old token AGAIN revokes entire family
[ ] Logout → refresh token revoked
[ ] Forgot password → always returns 200 (even for non-existent email)
[ ] Reset password → changes password, old password no longer works
[ ] Verify email → email_verified becomes true
[ ] Token hash in DB is NOT the raw token (verify via psql)
```

### Context References
- **Family reuse detection algorithm:** [security_layer.md — §2.3 Refresh Token Family Reuse Detection](file:///c:/Users/shakt/Downloads/oddo/security_layer.md) — full code example
- **Token tables DDL:** [database_design.md — Tables 17 & 18](file:///c:/Users/shakt/Downloads/oddo/database_design.md) — password_reset_tokens, email_verification_tokens
- **Account security controls:** [security_layer.md — §2.4](file:///c:/Users/shakt/Downloads/oddo/security_layer.md) — rate limits and side effects
- **Auth API responses:** [api_design.md — refresh, logout, forgot-password, reset-password, verify-email](file:///c:/Users/shakt/Downloads/oddo/api_design.md)

---

## Phase 7: Users Module

### What You Build
- UsersModule (controller, service, repository)
- Profile CRUD with field-level protection
- Password change (revokes all sessions)
- User stats (calculated, not stored)
- Avatar integration with media_files

### Endpoints Added
| Method | Endpoint | Expected Response |
|---|---|---|
| `GET` | `/api/v1/users/me` | `200` — full profile (never password_hash) |
| `PATCH` | `/api/v1/users/me` | `200` — updated profile |
| `DELETE` | `/api/v1/users/me` | `200` — account deleted |
| `PATCH` | `/api/v1/users/me/password` | `200` — password changed, sessions revoked |
| `GET` | `/api/v1/users/me/stats` | `200` — trip counts, expenses total |

### Steps

```text
1. Create UsersModule, UsersController, UsersService
2. Create UserResponseDto (explicit projection - NEVER return entity directly)
3. Create UpdateUserDto (whitelist: first_name, last_name, bio, phone, city, country, avatar_file_id, language)
4. Implement GET /me — fetch user, resolve avatar_file_id to URL
5. Implement PATCH /me — validate, update, return projected DTO
6. Implement DELETE /me — soft-delete, revoke all refresh sessions
7. Implement PATCH /me/password — verify current, hash new, revoke ALL sessions
8. Implement GET /me/stats — COUNT queries across trips, expenses, saved_destinations
9. Validate avatar_file_id ownership (file must belong to user)
```

### Verification
```text
[ ] GET /me → returns profile with avatar_url (not avatar_file_id)
[ ] GET /me → response does NOT contain password_hash, deleted_at
[ ] PATCH /me with { "role": "admin" } → rejected (400 or stripped)
[ ] PATCH /me with { "email": "new@email.com" } → rejected
[ ] PATCH /me with valid bio → bio updated
[ ] PATCH /me/password → all refresh sessions revoked
[ ] DELETE /me → user soft-deleted, can't login again
[ ] GET /me/stats → numbers match actual data in DB
```

### Context References
- **Users API responses:** [api_design.md — MODULE 2: Users](file:///c:/Users/shakt/Downloads/oddo/api_design.md) — all 5 endpoints with JSON
- **Field-level protection:** [security_layer.md — §3.5](file:///c:/Users/shakt/Downloads/oddo/security_layer.md) — never return password_hash
- **Forbidden update fields:** [security_layer.md — §3.6](file:///c:/Users/shakt/Downloads/oddo/security_layer.md) — email, role, etc.
- **Users table DDL:** [database_design.md — Table 2: users](file:///c:/Users/shakt/Downloads/oddo/database_design.md)

---

## Phase 8: Trips Module

### What You Build
- TripsModule with full CRUD
- Ownership enforcement (user_id from JWT, never from body)
- Status transitions (draft → planned → ongoing → completed)
- Full trip view (with stops, sections, budget summary)
- Cover image integration

### Endpoints Added
| Method | Endpoint | Expected Response |
|---|---|---|
| `GET` | `/api/v1/trips` | `200` — paginated list |
| `POST` | `/api/v1/trips` | `201` — created trip |
| `GET` | `/api/v1/trips/:tripId` | `200` — trip + stops |
| `PATCH` | `/api/v1/trips/:tripId` | `200` — updated trip |
| `DELETE` | `/api/v1/trips/:tripId` | `200` — soft-deleted |
| `GET` | `/api/v1/trips/:tripId/full` | `200` — complete trip data |

### Steps

```text
1. Create TripsModule, TripsController, TripsService
2. Create CreateTripDto (title, start_date, end_date, budget_limit, currency, description)
3. Create UpdateTripDto (all optional, includes status, cover_file_id)
4. Implement list: filter by status, sort by start_date, paginate (user_id from JWT only)
5. Implement create: user_id injected from JWT (never accepted from body)
6. Implement get: ownership check before return
7. Implement update: ownership check, validate status transitions
8. Implement delete: soft-delete, ownership check
9. Implement full: join stops, sections, items, calculate budget summary
10. Audit: TRIP_CREATED, TRIP_UPDATED, TRIP_DELETED
```

### Verification
```text
[ ] POST /trips → user_id comes from JWT (verify in DB)
[ ] GET /trips → only returns authenticated user's trips
[ ] GET /trips?status=planned → filters correctly
[ ] GET /trips/:tripId with someone else's trip → 404
[ ] PATCH /trips/:tripId with wrong user → 404
[ ] DELETE /trips/:tripId → soft-deleted (deleted_at set)
[ ] GET /trips/:tripId/full → includes stops, sections, budget_summary
```

### Context References
- **Trips API responses:** [api_design.md — MODULE 3: Trips](file:///c:/Users/shakt/Downloads/oddo/api_design.md) — all 6 endpoints
- **Trips table DDL:** [database_design.md — Table 3: trips](file:///c:/Users/shakt/Downloads/oddo/database_design.md) — constraints, CHECK
- **IDOR prevention:** [security_layer.md — §3.3](file:///c:/Users/shakt/Downloads/oddo/security_layer.md) — ownership chain
- **RLS policy:** [security_layer.md — §4.4 trips_own](file:///c:/Users/shakt/Downloads/oddo/security_layer.md)

---

## Phase 9: Stops Module

### What You Build
- StopsModule nested under trips
- Ownership chain: stop → trip → user
- Reordering with unique constraint management
- Date validation within trip date range

### Endpoints Added
| Method | Endpoint | Expected Response |
|---|---|---|
| `GET` | `/api/v1/trips/:tripId/stops` | `200` — stops with destination info |
| `POST` | `/api/v1/trips/:tripId/stops` | `201` — created stop |
| `GET` | `/api/v1/trips/:tripId/stops/:stopId` | `200` — stop detail |
| `PATCH` | `/api/v1/trips/:tripId/stops/:stopId` | `200` — updated |
| `DELETE` | `/api/v1/trips/:tripId/stops/:stopId` | `200` — deleted |
| `PATCH` | `/api/v1/trips/:tripId/stops/reorder` | `200` — reordered |

### Verification
```text
[ ] Create stop → trip ownership verified
[ ] Create stop with non-existent destination → 400
[ ] Create stop with duplicate stop_order → 409
[ ] Stop dates within trip date range → OK
[ ] Stop dates outside trip range → 400
[ ] Reorder → updates all stop_order values atomically
[ ] Access stop from another user's trip → 404
```

### Context References
- **Stops API responses:** [api_design.md — MODULE 4: Stops](file:///c:/Users/shakt/Downloads/oddo/api_design.md)
- **Trip stops DDL:** [database_design.md — Table 5: trip_stops](file:///c:/Users/shakt/Downloads/oddo/database_design.md)
- **Ownership chain:** [security_layer.md — §3.3 IDOR](file:///c:/Users/shakt/Downloads/oddo/security_layer.md) — stop → trip → user

---

## Phase 10: Sections Module

### What You Build
- SectionsModule nested under trips
- Section types (travel, stay, activity, food, transport, custom)
- Per-section budget tracking (planned vs actual)
- Optional linking to trip_stops
- Cross-parent validation (section.trip_id must match URL :tripId)

### Endpoints Added
| Method | Endpoint | Expected Response |
|---|---|---|
| `GET` | `/api/v1/trips/:tripId/sections` | `200` — sections with actual_spent calculated |
| `POST` | `/api/v1/trips/:tripId/sections` | `201` — created section |
| `GET` | `/api/v1/trips/:tripId/sections/:sectionId` | `200` — section with linked items/expenses |
| `PATCH` | `/api/v1/trips/:tripId/sections/:sectionId` | `200` — updated |
| `DELETE` | `/api/v1/trips/:tripId/sections/:sectionId` | `200` — deleted (items unlinked, expenses kept) |
| `PATCH` | `/api/v1/trips/:tripId/sections/reorder` | `200` — reordered |

### Key Behavior
- `actual_spent` is calculated: `SUM(expenses.amount) WHERE trip_section_id = section.id`
- Deleting a section → items have `trip_section_id` set to NULL (not deleted)
- Deleting a section → expenses have `trip_section_id` set to NULL (not deleted)
- `trip_stop_id` if provided must belong to the same trip (cross-parent validation)

### Verification
```text
[ ] Create section → trip ownership verified
[ ] Create section with invalid section_type → 400
[ ] Create section with trip_stop_id from different trip → 404
[ ] GET sections → actual_spent calculated from expenses
[ ] Delete section → linked itinerary items NOT deleted (unlinked)
[ ] Delete section → linked expenses NOT deleted (unlinked)
```

### Context References
- **Sections API responses:** [api_design.md — MODULE 5: Sections](file:///c:/Users/shakt/Downloads/oddo/api_design.md)
- **Trip sections DDL:** [database_design.md — Table 6: trip_sections](file:///c:/Users/shakt/Downloads/oddo/database_design.md)
- **Cross-parent validation:** [security_layer.md — §3.4](file:///c:/Users/shakt/Downloads/oddo/security_layer.md)
- **Orphan protection (SET NULL):** [database_design.md — Orphan Record Protection rows 9, 11, 14](file:///c:/Users/shakt/Downloads/oddo/database_design.md)

---

## Phase 11: Seed Data & Discovery

### What You Build
- Seed JSON files (~50 destinations, ~200 activities)
- Prisma seed script
- Destinations module (search, popular, countries, save/unsave)
- Activities module (search, by destination, categories)
- Analytics event tracking for searches/views

### Endpoints Added
| Method | Endpoint |
|---|---|
| `GET` | `/api/v1/destinations/search` |
| `GET` | `/api/v1/destinations/:id` |
| `GET` | `/api/v1/destinations/popular` |
| `GET` | `/api/v1/destinations/countries` |
| `POST` | `/api/v1/destinations/:id/save` |
| `DELETE` | `/api/v1/destinations/:id/save` |
| `GET` | `/api/v1/destinations/saved` |
| `GET` | `/api/v1/activities/search` |
| `GET` | `/api/v1/activities/:id` |
| `GET` | `/api/v1/activities/destination/:destId` |
| `GET` | `/api/v1/activities/categories` |

### Seed Data Structure

```text
database/seed-data/destinations.json
[
  {
    "name": "Paris",
    "country": "France",
    "country_code": "FR",
    "region": "Europe",
    "latitude": 48.8566,
    "longitude": 2.3522,
    "timezone": "Europe/Paris",
    "description": "The City of Light...",
    "image_url": "https://images.unsplash.com/...",
    "cost_index": 4,
    "popularity_score": 95
  }
]
```

### Popular Destinations (Real Data)
```sql
-- NOT from static popularity_score
SELECT d.id, d.name, d.country, COUNT(ts.id) as trip_count
FROM destinations d
LEFT JOIN trip_stops ts ON d.id = ts.destination_id
LEFT JOIN trips t ON ts.trip_id = t.id AND t.deleted_at IS NULL
GROUP BY d.id
ORDER BY trip_count DESC
LIMIT 10;
```

### Verification
```text
[ ] npx prisma db seed → populates destinations and activities
[ ] Search destinations → text search works
[ ] Popular destinations → calculated from trip_stops (not static score)
[ ] Save destination → saved in DB with user_id
[ ] Save duplicate → 409
[ ] Activities by destination → returns correct activities
```

### Context References
- **Destinations DDL:** [database_design.md — Table 4: destinations](file:///c:/Users/shakt/Downloads/oddo/database_design.md)
- **Activities DDL:** [database_design.md — Table 7: activities](file:///c:/Users/shakt/Downloads/oddo/database_design.md)
- **Saved destinations DDL:** [database_design.md — Table 11: saved_destinations](file:///c:/Users/shakt/Downloads/oddo/database_design.md)
- **Discovery API responses:** [api_design.md — MODULE 6 & 7](file:///c:/Users/shakt/Downloads/oddo/api_design.md)
- **Analytics tracking:** [security_layer.md — §9 Analytics](file:///c:/Users/shakt/Downloads/oddo/security_layer.md) — DESTINATION_SEARCHED, DESTINATION_VIEWED

---

## Phase 12: Itinerary Module

### What You Build
- Itinerary items CRUD
- Linking to sections and activities
- Calendar and timeline views
- Reordering within a day
- Cross-parent validation (stop belongs to trip, section belongs to trip)

### Endpoints Added
| Method | Endpoint |
|---|---|
| `GET` | `/api/v1/trips/:tripId/itinerary` |
| `POST` | `/api/v1/trips/:tripId/itinerary/items` |
| `PATCH` | `/api/v1/trips/:tripId/itinerary/items/:itemId` |
| `DELETE` | `/api/v1/trips/:tripId/itinerary/items/:itemId` |
| `PATCH` | `/api/v1/trips/:tripId/itinerary/items/reorder` |
| `GET` | `/api/v1/trips/:tripId/itinerary/calendar` |
| `GET` | `/api/v1/trips/:tripId/itinerary/timeline` |

### Verification
```text
[ ] Create item → ownership chain verified (item → stop → trip → user)
[ ] Create item with section from different trip → 404
[ ] Create custom item (no activity_id) → custom_title required
[ ] Calendar view → grouped by date with expense totals
[ ] Reorder → updates item_order within same (stop, date)
[ ] Full ownership chain: user cannot access items from another user's trip
```

### Context References
- **Itinerary API responses:** [api_design.md — MODULE 8: Itinerary](file:///c:/Users/shakt/Downloads/oddo/api_design.md) — grouped-by-day JSON
- **Itinerary items DDL:** [database_design.md — Table 8: itinerary_items](file:///c:/Users/shakt/Downloads/oddo/database_design.md)
- **IDOR chain:** [security_layer.md — §3.3](file:///c:/Users/shakt/Downloads/oddo/security_layer.md) — item → stop → trip → user
- **Cross-parent validation:** [security_layer.md — §3.4](file:///c:/Users/shakt/Downloads/oddo/security_layer.md)

---

## Phase 13: Budget Module

### What You Build
- Expenses CRUD
- Budget summary (calculated from expenses, never stored)
- Category breakdown
- Daily spending view
- Per-section budget comparison (planned vs actual)

### Endpoints Added
| Method | Endpoint |
|---|---|
| `GET` | `/api/v1/trips/:tripId/budget` |
| `GET` | `/api/v1/trips/:tripId/budget/breakdown` |
| `GET` | `/api/v1/trips/:tripId/budget/daily` |
| `GET` | `/api/v1/trips/:tripId/budget/by-section` |
| `POST` | `/api/v1/trips/:tripId/budget/expenses` |
| `PATCH` | `/api/v1/trips/:tripId/budget/expenses/:id` |
| `DELETE` | `/api/v1/trips/:tripId/budget/expenses/:id` |

### Key Behavior
- `total_spent` = `SUM(expenses.amount) WHERE trip_id = ?`
- `remaining` = `trip.budget_limit - total_spent`
- Per-section: `actual_spent` = `SUM(expenses.amount) WHERE trip_section_id = ?`
- `status` = `actual_spent > planned_budget ? 'over_budget' : 'within_budget'`

### Verification
```text
[ ] Budget summary → all values calculated, nothing stored
[ ] Add expense → budget summary updates
[ ] Delete expense → budget summary recalculates
[ ] Category breakdown → percentages sum to ~100%
[ ] By-section → shows planned vs actual with over/under status
[ ] Expense with section from different trip → 404
```

### Context References
- **Budget API responses:** [api_design.md — MODULE 9: Budget](file:///c:/Users/shakt/Downloads/oddo/api_design.md) — summary, breakdown, daily, by-section JSON
- **Expenses DDL:** [database_design.md — Table 9: expenses](file:///c:/Users/shakt/Downloads/oddo/database_design.md)
- **Design principle:** [database_design.md — Tables NOT Created](file:///c:/Users/shakt/Downloads/oddo/database_design.md) — budget is always calculated

---

## Phase 14: Sharing & Community

### What You Build

**Sharing:**
- Share link generation (secure random token)
- Public trip view (filtered — no user PII)
- Copy trip to own account (transaction-wrapped)
- Revoke share link

**Community:**
- Community posts CRUD
- Comments (threaded with parent_comment_id)
- Reactions (unique per user per post)
- Post media attachments
- Trending (from real analytics data)

### Endpoints Added
| Method | Endpoint | Module |
|---|---|---|
| `POST` | `/api/v1/sharing/trips/:tripId/share` | Sharing |
| `GET` | `/api/v1/sharing/shared/:shareToken` | Sharing |
| `POST` | `/api/v1/sharing/shared/:shareToken/copy` | Sharing |
| `DELETE` | `/api/v1/sharing/trips/:tripId/share` | Sharing |
| `GET` | `/api/v1/community/posts` | Community |
| `POST` | `/api/v1/community/posts` | Community |
| `GET` | `/api/v1/community/posts/:postId` | Community |
| `PATCH` | `/api/v1/community/posts/:postId` | Community |
| `DELETE` | `/api/v1/community/posts/:postId` | Community |
| `POST` | `/api/v1/community/posts/:postId/media` | Community |
| `DELETE` | `/api/v1/community/posts/:postId/media/:mediaId` | Community |
| `GET` | `/api/v1/community/posts/:postId/comments` | Community |
| `POST` | `/api/v1/community/posts/:postId/comments` | Community |
| `PATCH` | `/api/v1/community/comments/:commentId` | Community |
| `DELETE` | `/api/v1/community/comments/:commentId` | Community |
| `POST` | `/api/v1/community/posts/:postId/react` | Community |
| `DELETE` | `/api/v1/community/posts/:postId/react` | Community |
| `GET` | `/api/v1/community/trending` | Community |
| `GET` | `/api/v1/community/my-posts` | Community |

### Key Behavior — Sharing
- `share_token` is a 16-char random string (crypto.randomBytes)
- Public view NEVER exposes: `user_id`, `user.email`, `budget_limit`, `expenses`
- Copy: creates new trip + stops + sections + items in a `$transaction`
- Copy sets `copied_from_trip_id` on the new trip
- Expired shares (`expires_at < NOW()`) return 404

### Key Behavior — Community
- Only public posts visible to other users
- Author can edit/delete own posts
- One reaction per user per post (UNIQUE constraint)
- Threaded comments (parent_comment_id)
- Media attached via `community_post_media` → `media_files`

### Verification
```text
[ ] Share → generates token, returns URL
[ ] Public view → does NOT expose user email or budget
[ ] Copy → creates independent trip with all data
[ ] Revoke → share link no longer works
[ ] Expired share → returns 404
[ ] Create post → linked to user, optionally to trip/destination/activity
[ ] Edit another user's post → 404
[ ] Delete another user's post → 404
[ ] React twice → UNIQUE violation handled gracefully
[ ] Comment → threaded replies work
[ ] Delete comment → child replies cascade-deleted
[ ] Post media → attach via media_file_id, ownership verified
```

### Context References
- **Sharing API:** [api_design.md — MODULE 10: Sharing](file:///c:/Users/shakt/Downloads/oddo/api_design.md) — share, view, copy, revoke JSON
- **Community API:** [api_design.md — MODULE 11: Community](file:///c:/Users/shakt/Downloads/oddo/api_design.md) — posts, comments, reactions JSON
- **Shared trips DDL:** [database_design.md — Table 10](file:///c:/Users/shakt/Downloads/oddo/database_design.md)
- **Community tables DDL:** [database_design.md — Tables 12-15](file:///c:/Users/shakt/Downloads/oddo/database_design.md) — posts, comments, reactions, post_media
- **Community RLS:** [security_layer.md — §4.4 Community Tables](file:///c:/Users/shakt/Downloads/oddo/security_layer.md)
- **Sharing RLS:** [security_layer.md — §4.4 Sharing Tables](file:///c:/Users/shakt/Downloads/oddo/security_layer.md)
- **CRUD matrix:** [security_layer.md — §3.2](file:///c:/Users/shakt/Downloads/oddo/security_layer.md) — community_posts, community_comments, community_reactions rows

---

## Phase 15: Admin, Analytics & Polish

### What You Build
- Admin module (all admin-only endpoints)
- Analytics service (tracks events, provides trend data)
- Full security test suite
- E2E integration tests
- Final polish (docs, error messages, pagination limits)

### Endpoints Added
| Method | Endpoint |
|---|---|
| `GET` | `/api/v1/admin/stats` |
| `GET` | `/api/v1/admin/users` |
| `PATCH` | `/api/v1/admin/users/:userId/role` |
| `DELETE` | `/api/v1/admin/users/:userId` |
| `GET` | `/api/v1/admin/users/:userId/trips` |
| `GET` | `/api/v1/admin/trips` |
| `GET` | `/api/v1/admin/destinations/popular` |
| `GET` | `/api/v1/admin/activities/popular` |
| `GET` | `/api/v1/admin/community/posts` |
| `DELETE` | `/api/v1/admin/community/posts/:postId` |
| `GET` | `/api/v1/admin/analytics/trends` |
| `GET` | `/api/v1/admin/audit-logs` |

### Key Behavior
- ALL admin endpoints require `role = 'admin'` in JWT
- Admin bypasses RLS via `executeAsAdmin()`
- Popular cities/activities calculated from **real trip_stops/itinerary_items**, not static scores
- Analytics trends from `analytics_events` table
- All admin actions are audit-logged

### Security Test Suite (Run This Phase)

```text
TEST: "User cannot update another user's trip" → expect 404
TEST: "User cannot read another user's trip via direct UUID" → expect 404
TEST: "User cannot change own role via PATCH /me" → expect 400
TEST: "User cannot create expense for another user's trip" → expect 404
TEST: "User cannot create section for another user's trip" → expect 404
TEST: "Admin-only endpoint rejects normal users" → expect 404
TEST: "Soft-deleted trip returns 404" → expect 404
TEST: "Refresh token reuse revokes entire family" → expect 401
TEST: "Password change revokes all refresh sessions" → verified
TEST: "Login response does not contain password_hash" → verified
TEST: "Profile response does not contain deleted_at" → verified
TEST: "Public shared trip does not expose user_id or email" → verified
TEST: "Community post by User A cannot be edited by User B" → expect 404
TEST: "File uploaded by User A cannot be deleted by User B" → expect 404
TEST: "Rate limit returns 429 after threshold" → verified
TEST: "Database constraint errors return sanitized response" → verified
TEST: "Pagination limit > 100 is clamped to 100" → verified
TEST: "File upload rejects non-image files" → expect 400
TEST: "File upload rejects files > 5MB" → expect 413
```

### Verification
```text
[ ] All 88 endpoints working
[ ] Admin can view any user's trips
[ ] Admin popular cities → calculated from real data
[ ] Admin analytics → shows search/view trends
[ ] Audit logs → all security events captured
[ ] Full security test suite passes
[ ] E2E: complete user journey (register → create trip → add stops → add sections → add items → add expenses → share → community post)
[ ] Error sanitization → no DB details leak
[ ] npm run build succeeds
[ ] npm run test passes
```

### Context References
- **Admin API responses:** [api_design.md — MODULE 13: Admin](file:///c:/Users/shakt/Downloads/oddo/api_design.md) — all 12 endpoints
- **Analytics events DDL:** [database_design.md — Table 19: analytics_events](file:///c:/Users/shakt/Downloads/oddo/database_design.md)
- **Audit logs DDL:** [database_design.md — Table 20: audit_logs](file:///c:/Users/shakt/Downloads/oddo/database_design.md)
- **Audit actions list:** [security_layer.md — §5 Audit Logging](file:///c:/Users/shakt/Downloads/oddo/security_layer.md)
- **CRUD authorization matrix:** [security_layer.md — §3.2](file:///c:/Users/shakt/Downloads/oddo/security_layer.md) — all 20 tables x 4 roles
- **Security release checklist:** [security_layer.md — §10](file:///c:/Users/shakt/Downloads/oddo/security_layer.md) — 25-item checklist

---

# Cross-Reference Index

This section maps every phase to the exact sections in the other documents it needs for context.

## Database Design References

| Phase | What You Need | Where to Find It |
|---|---|---|
| Phase 2 | All 20 table DDL statements | [database_design.md — Complete SQL Schema](file:///c:/Users/shakt/Downloads/oddo/database_design.md) |
| Phase 2 | Docker Compose | [database_design.md — Docker Compose](file:///c:/Users/shakt/Downloads/oddo/database_design.md) |
| Phase 2 | FK/ON DELETE rules | [database_design.md — Orphan Record Protection](file:///c:/Users/shakt/Downloads/oddo/database_design.md) |
| Phase 4 | `media_files` columns and constraints | [database_design.md — Table 1](file:///c:/Users/shakt/Downloads/oddo/database_design.md) |
| Phase 5 | `users` columns (including `bio`) | [database_design.md — Table 2](file:///c:/Users/shakt/Downloads/oddo/database_design.md) |
| Phase 5 | `refresh_sessions` columns | [database_design.md — Table 16](file:///c:/Users/shakt/Downloads/oddo/database_design.md) |
| Phase 6 | Token tables (password_reset, email_verification) | [database_design.md — Tables 17 & 18](file:///c:/Users/shakt/Downloads/oddo/database_design.md) |
| Phase 8 | `trips` columns and constraints | [database_design.md — Table 3](file:///c:/Users/shakt/Downloads/oddo/database_design.md) |
| Phase 9 | `trip_stops` constraints (unique order, date check) | [database_design.md — Table 5](file:///c:/Users/shakt/Downloads/oddo/database_design.md) |
| Phase 10 | `trip_sections` types and constraints | [database_design.md — Table 6](file:///c:/Users/shakt/Downloads/oddo/database_design.md) |
| Phase 11 | `destinations` and `activities` columns | [database_design.md — Tables 4 & 7](file:///c:/Users/shakt/Downloads/oddo/database_design.md) |
| Phase 11 | `saved_destinations` unique constraint | [database_design.md — Table 11](file:///c:/Users/shakt/Downloads/oddo/database_design.md) |
| Phase 12 | `itinerary_items` columns and constraints | [database_design.md — Table 8](file:///c:/Users/shakt/Downloads/oddo/database_design.md) |
| Phase 13 | `expenses` columns and constraints | [database_design.md — Table 9](file:///c:/Users/shakt/Downloads/oddo/database_design.md) |
| Phase 14 | `shared_trips` columns | [database_design.md — Table 10](file:///c:/Users/shakt/Downloads/oddo/database_design.md) |
| Phase 14 | Community tables (12-15) | [database_design.md — Tables 12-15](file:///c:/Users/shakt/Downloads/oddo/database_design.md) |
| Phase 15 | `analytics_events` columns | [database_design.md — Table 19](file:///c:/Users/shakt/Downloads/oddo/database_design.md) |
| Phase 15 | `audit_logs` columns and actions | [database_design.md — Table 20](file:///c:/Users/shakt/Downloads/oddo/database_design.md) |

## Security Layer References

| Phase | What You Need | Where to Find It |
|---|---|---|
| Phase 1 | Environment variables | [security_layer.md — §11](file:///c:/Users/shakt/Downloads/oddo/security_layer.md) |
| Phase 2 | RLS policies for all tables | [security_layer.md — §4](file:///c:/Users/shakt/Downloads/oddo/security_layer.md) |
| Phase 3 | 16-layer pipeline order | [security_layer.md — §1](file:///c:/Users/shakt/Downloads/oddo/security_layer.md) |
| Phase 3 | Error sanitization filter | [security_layer.md — §6](file:///c:/Users/shakt/Downloads/oddo/security_layer.md) |
| Phase 3 | CORS + Helmet config | [security_layer.md — §7](file:///c:/Users/shakt/Downloads/oddo/security_layer.md) |
| Phase 3 | Rate limiting table | [security_layer.md — §8](file:///c:/Users/shakt/Downloads/oddo/security_layer.md) |
| Phase 4 | File upload security (magic bytes, re-encoding) | [security_layer.md — §7.4](file:///c:/Users/shakt/Downloads/oddo/security_layer.md) |
| Phase 5 | Credential storage rules | [security_layer.md — §2.1](file:///c:/Users/shakt/Downloads/oddo/security_layer.md) |
| Phase 5 | JWT structure | [security_layer.md — §2.2](file:///c:/Users/shakt/Downloads/oddo/security_layer.md) |
| Phase 6 | Refresh token family reuse detection | [security_layer.md — §2.3](file:///c:/Users/shakt/Downloads/oddo/security_layer.md) |
| Phase 6 | Account security controls | [security_layer.md — §2.4](file:///c:/Users/shakt/Downloads/oddo/security_layer.md) |
| Phase 7 | Field-level protection | [security_layer.md — §3.5](file:///c:/Users/shakt/Downloads/oddo/security_layer.md) |
| Phase 7 | Forbidden update fields | [security_layer.md — §3.6](file:///c:/Users/shakt/Downloads/oddo/security_layer.md) |
| Phase 8 | IDOR prevention (ownership chain) | [security_layer.md — §3.3](file:///c:/Users/shakt/Downloads/oddo/security_layer.md) |
| Phase 10 | Cross-parent validation | [security_layer.md — §3.4](file:///c:/Users/shakt/Downloads/oddo/security_layer.md) |
| Phase 14 | Community RLS policies | [security_layer.md — §4.4](file:///c:/Users/shakt/Downloads/oddo/security_layer.md) |
| Phase 14 | Sharing RLS policies | [security_layer.md — §4.4](file:///c:/Users/shakt/Downloads/oddo/security_layer.md) |
| Phase 15 | CRUD authorization matrix (20 tables) | [security_layer.md — §3.2](file:///c:/Users/shakt/Downloads/oddo/security_layer.md) |
| Phase 15 | Security release checklist (25 items) | [security_layer.md — §10](file:///c:/Users/shakt/Downloads/oddo/security_layer.md) |
| Phase 15 | Audit actions list | [security_layer.md — §5](file:///c:/Users/shakt/Downloads/oddo/security_layer.md) |

## API Design References

| Phase | What You Need | Where to Find It |
|---|---|---|
| Phase 3 | Standard response envelope format | [api_design.md — Standard Response Envelope](file:///c:/Users/shakt/Downloads/oddo/api_design.md) |
| Phase 3 | Standard error codes | [api_design.md — Standard Error Codes](file:///c:/Users/shakt/Downloads/oddo/api_design.md) |
| Phase 4 | Upload endpoint request/response | [api_design.md — MODULE 12](file:///c:/Users/shakt/Downloads/oddo/api_design.md) |
| Phase 5 | Register + Login request/response | [api_design.md — MODULE 1](file:///c:/Users/shakt/Downloads/oddo/api_design.md) |
| Phase 6 | Refresh, logout, password reset responses | [api_design.md — MODULE 1](file:///c:/Users/shakt/Downloads/oddo/api_design.md) |
| Phase 7 | User profile responses | [api_design.md — MODULE 2](file:///c:/Users/shakt/Downloads/oddo/api_design.md) |
| Phase 8 | Trip CRUD responses | [api_design.md — MODULE 3](file:///c:/Users/shakt/Downloads/oddo/api_design.md) |
| Phase 9 | Stop CRUD responses | [api_design.md — MODULE 4](file:///c:/Users/shakt/Downloads/oddo/api_design.md) |
| Phase 10 | Section CRUD responses (with actual_spent) | [api_design.md — MODULE 5](file:///c:/Users/shakt/Downloads/oddo/api_design.md) |
| Phase 11 | Destination + Activity search responses | [api_design.md — MODULE 6 & 7](file:///c:/Users/shakt/Downloads/oddo/api_design.md) |
| Phase 12 | Itinerary grouped-by-day response | [api_design.md — MODULE 8](file:///c:/Users/shakt/Downloads/oddo/api_design.md) |
| Phase 13 | Budget summary, breakdown, by-section | [api_design.md — MODULE 9](file:///c:/Users/shakt/Downloads/oddo/api_design.md) |
| Phase 14 | Share + Community post/comment responses | [api_design.md — MODULE 10 & 11](file:///c:/Users/shakt/Downloads/oddo/api_design.md) |
| Phase 15 | Admin stats, users, trips, analytics responses | [api_design.md — MODULE 13](file:///c:/Users/shakt/Downloads/oddo/api_design.md) |
| Phase 15 | Complete endpoint count (88) | [api_design.md — Endpoint Summary](file:///c:/Users/shakt/Downloads/oddo/api_design.md) |
