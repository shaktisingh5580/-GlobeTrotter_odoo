# GlobeTrotter — Security Layer Document

> **Stack:** NestJS + TypeScript · PostgreSQL 16 RLS · Prisma ORM · JWT + Refresh Tokens  
> **Related Files:** [database_design.md](file:///c:/Users/shakt/Downloads/oddo/database_design.md) · [api_design.md](file:///c:/Users/shakt/Downloads/oddo/api_design.md) · [phases.md](file:///c:/Users/shakt/Downloads/oddo/phases.md)

---

## 1. Defense in Depth — 16-Layer Request Pipeline

Every request passes through these layers **in order**. If any layer fails, the request is rejected.

```text
Layer   What                            Module                  Rejects With
------  ----                            ------                  ------------
  1     HTTPS / TLS                     Reverse Proxy           Connection refused
  2     CORS Allowlist                  NestJS CORS config      403
  3     Security Headers                Helmet middleware        (headers set)
  4     Rate Limiter                    @nestjs/throttler       429 Too Many Requests
  5     Body Size Limiter               Express body-parser     413 Payload Too Large
  6     Request ID Injection            Custom middleware        (req_xxx assigned)
  7     Input Validation                ValidationPipe + DTOs   400 Bad Request
  8     Authentication                  JWT AuthGuard           401 Unauthorized
  9     Authorization / RBAC            RolesGuard              403 Forbidden (shown as 404)
  10    Service-Layer Ownership Check   Service methods         404 Not Found
  11    Cross-Parent Validation         Service methods         404 Not Found
  12    Prisma RLS Context              RLS Middleware           (user context set)
  13    PostgreSQL RLS Policies         DB-level enforcement    Empty result set
  14    DB Constraints                  FK/CHECK/UNIQUE         400 (sanitized)
  15    Response Transform              Interceptor             Standard envelope
  16    Global Exception Filter         ExceptionFilter         Sanitized error
```

### Visualization

```mermaid
graph TD
    REQ[Client Request] --> L1[HTTPS/TLS]
    L1 --> L2[CORS Check]
    L2 --> L3[Security Headers - Helmet]
    L3 --> L4[Rate Limiter]
    L4 --> L5[Body Size Check]
    L5 --> L6[Request ID Injection]
    L6 --> L7[Input Validation - DTOs]
    L7 --> L8[JWT Authentication]
    L8 --> L9[RBAC Authorization]
    L9 --> L10[Ownership Check - Service]
    L10 --> L11[Cross-Parent Validation]
    L11 --> L12[RLS Context Middleware]
    L12 --> L13[PostgreSQL RLS Policies]
    L13 --> L14[DB Constraints]
    L14 --> L15[Response Transform]
    L15 --> L16[Exception Filter]
    L16 --> RES[Client Response]
```

---

## 2. Authentication

### 2.1 Credential Storage Rules

| Credential | How Stored | Rule |
|---|---|---|
| Password | bcrypt hash (12 rounds) in `users.password_hash` | **NEVER** plaintext. **NEVER** returned in API. **NEVER** in Prisma select. |
| Refresh Token | SHA-256 hash in `refresh_sessions.token_hash` | Raw token sent to client exactly once. DB stores only the hash. |
| Password Reset Token | SHA-256 hash in `password_reset_tokens.token_hash` | Raw token sent via email only. DB stores only the hash. |
| Email Verification Token | SHA-256 hash in `email_verification_tokens.token_hash` | Raw token sent via email only. DB stores only the hash. |

### 2.2 JWT Structure

```json
{
  "sub": "user-uuid",
  "email": "user@example.com",
  "role": "user",
  "iat": 1234567890,
  "exp": 1234568790
}
```

| Token | Expiry | Storage |
|---|---|---|
| Access Token (JWT) | 15 minutes | Client memory (NOT localStorage) |
| Refresh Token | 7 days | HttpOnly cookie or secure client storage |

### 2.3 Refresh Token Family Reuse Detection

This prevents stolen refresh tokens from being used.

```text
Step 1: Login
         -> Token A issued (family_id = F1)
         -> DB: { token_hash: hash(A), family_id: F1, revoked_at: null }

Step 2: Normal refresh with Token A
         -> Token B issued (family_id = F1)
         -> DB: { A.replaced_by = B.id, A.revoked_at = now }
         -> DB: { token_hash: hash(B), family_id: F1, revoked_at: null }

Step 3: ATTACKER tries to use Token A (already used)
         -> System detects: A was already replaced
         -> REUSE DETECTED
         -> Revoke ENTIRE family F1 (ALL tokens with family_id = F1)
         -> User must re-login
         -> Audit log: REFRESH_TOKEN_REUSE
```

**Implementation in service:**
```typescript
async refreshToken(rawToken: string): Promise<TokenPair> {
  const hash = sha256(rawToken);
  const session = await this.prisma.refreshSession.findUnique({
    where: { token_hash: hash },
  });

  if (!session) throw new UnauthorizedException();

  // REUSE DETECTION: token already replaced = compromise
  if (session.revoked_at || session.replaced_by) {
    await this.prisma.refreshSession.updateMany({
      where: { family_id: session.family_id },
      data: { revoked_at: new Date() },
    });
    this.audit.log('REFRESH_TOKEN_REUSE', session.user_id);
    throw new UnauthorizedException('Token reuse detected');
  }

  if (session.expires_at < new Date()) {
    throw new UnauthorizedException('Token expired');
  }

  // Issue new token, mark old as replaced
  const newToken = crypto.randomBytes(32).toString('hex');
  const newHash = sha256(newToken);

  const newSession = await this.prisma.refreshSession.create({
    data: {
      user_id: session.user_id,
      token_hash: newHash,
      family_id: session.family_id,
      device_info: session.device_info,
      ip_address: requestIp,
      expires_at: addDays(new Date(), 7),
    },
  });

  await this.prisma.refreshSession.update({
    where: { id: session.id },
    data: { revoked_at: new Date(), replaced_by: newSession.id },
  });

  const accessToken = this.jwtService.sign({ sub: session.user_id });
  return { accessToken, refreshToken: newToken };
}
```

### 2.4 Account Security Controls

| Action | Rate Limit | Side Effects |
|---|---|---|
| Login | 10 attempts / 15 min / IP | Audit log on success + failure |
| Register | 5 / hour / IP | Verification email sent |
| Password reset request | 5 / hour / account+IP | Reset email sent |
| Email verification | 10 / hour / IP | — |
| Refresh token | 30 / min / IP | — |
| Password change | — | **Revoke ALL refresh sessions** |
| Account delete | — | Revoke all sessions, soft-delete user |

---

## 3. Authorization / RBAC

### 3.1 Core Rules

```
+===================================================+
| DEFAULT DENY - no access until explicitly granted  |
| NEVER trust client-provided user_id or role        |
| Ownership ALWAYS derived from JWT -> DB lookup     |
| Role NEVER from request body / query / URL         |
| Return 404 (not 403) for unauthorized access       |
| No unrestricted SELECT * - explicit Response DTOs  |
| Audit logs: append-only, no UPDATE/DELETE ever     |
+===================================================+
```

### 3.2 CRUD Authorization Matrix (20 Tables)

| Resource | Anonymous | User | Owner | Admin |
|---|---|---|---|---|
| `users` | None | Own profile (R/U) | Own (R/U/D) | List (R), Delete (D) |
| `media_files` | None | Own (C/R/D) | Own (C/R/D) | None |
| `trips` | None | Own (CRUD) | Full CRUD | Read all, Delete |
| `trip_stops` | None | Own trip (CRUD) | Full CRUD | Read all |
| `trip_sections` | None | Own trip (CRUD) | Full CRUD | Read all |
| `itinerary_items` | None | Own trip (CRUD) | Full CRUD | Read all |
| `expenses` | None | Own trip (CRUD) | Full CRUD | Read all |
| `destinations` | Read | Read + Save | Read + Save | Full CRUD |
| `activities` | Read | Read | Read | Full CRUD |
| `shared_trips` | Token read | Token read + Copy | Create/Revoke | Read all |
| `saved_destinations` | None | Own (CRUD) | Full CRUD | None |
| `community_posts` | Public read | Own (CRUD) + Public read | Full CRUD | Moderate (R/D) |
| `community_comments` | Public read | Own (CRUD) + Public read | Full CRUD | Moderate (R/D) |
| `community_reactions` | None | Own (C/R/D) | Own (C/R/D) | Read |
| `community_post_media` | Public read | Own post (C/R/D) | Own (C/R/D) | None |
| `refresh_sessions` | None | Own (R, revoke) | Own | None |
| `password_reset_tokens` | None | None | None | None (system) |
| `email_verification_tokens` | None | None | None | None (system) |
| `analytics_events` | None | None | None | Read |
| `audit_logs` | None | None | None | Read (append-only) |

### 3.3 IDOR Prevention — Full Ownership Chain

For deeply nested resources, ownership must be verified through the **entire chain**, not just the immediate parent.

**Example: Accessing an itinerary item**

```text
GET /trips/:tripId/itinerary/items/:itemId

Step 1: Extract user_id from JWT (NEVER from URL/body)
Step 2: Load itinerary_item by itemId
Step 3: Load trip_stop by item.trip_stop_id
Step 4: Load trip by stop.trip_id
Step 5: Verify trip.user_id === JWT user_id
Step 6: Verify stop.trip_id === tripId (URL param)
Step 7: If ANY check fails -> return 404 Not Found (NOT 403)
```

**Implementation pattern:**
```typescript
async getItem(userId: string, tripId: string, itemId: string) {
  const item = await this.prisma.itineraryItem.findUnique({
    where: { id: itemId },
    include: {
      trip_stop: {
        include: { trip: true },
      },
    },
  });

  if (!item) throw new NotFoundException();
  if (item.trip_stop.trip.user_id !== userId) throw new NotFoundException();
  if (item.trip_stop.trip_id !== tripId) throw new NotFoundException();
  if (item.trip_stop.trip.deleted_at) throw new NotFoundException();

  return item;
}
```

### 3.4 Cross-Parent Relationship Validation

When a resource references two different parents, both must belong to the same trip/user.

```text
Example: Creating an itinerary_item

Body: {
  trip_stop_id: "stop-A",
  trip_section_id: "section-B",
  activity_id: "activity-C"
}

Validate:
  1. stop-A.trip_id === the trip from the URL
  2. section-B.trip_id === the same trip
  3. activity-C.destination_id === stop-A.destination_id (logical check)
  4. All belong to the authenticated user's trip
```

### 3.5 Field-Level Protection

| Table | NEVER Return to Client |
|---|---|
| `users` | `password_hash`, `deleted_at`, `email_verified_at` |
| `media_files` | `storage_key` (return generated URL instead) |
| `refresh_sessions` | ALL columns (never exposed via API) |
| `password_reset_tokens` | ALL columns (system only) |
| `email_verification_tokens` | ALL columns (system only) |
| `audit_logs` | `old_values`, `new_values` (except to admin) |
| `shared_trips` (public view) | `trip.user_id`, `trip.user.email` |

**Implementation: Use explicit DTOs, NEVER `return entity`**

```typescript
// WRONG - leaks sensitive fields
return user;

// CORRECT - explicit projection
return {
  id: user.id,
  email: user.email,
  first_name: user.first_name,
  last_name: user.last_name,
  bio: user.bio,
  phone: user.phone,
  city: user.city,
  country: user.country,
  avatar_url: user.avatar_file_id ? this.mediaService.getUrl(user.avatar_file_id) : null,
  language: user.language,
  role: user.role,
  email_verified: user.email_verified,
  created_at: user.created_at,
};
```

### 3.6 Fields Users Can NEVER Update on Themselves

```text
POST /users/me (PATCH)

ALLOWED:   first_name, last_name, bio, phone, city, country, avatar_file_id, language
FORBIDDEN: email, role, password_hash, email_verified, email_verified_at, deleted_at, created_at, id
```

**DTO enforcement:**
```typescript
export class UpdateUserDto {
  @IsOptional() @IsString() @MaxLength(100) first_name?: string;
  @IsOptional() @IsString() @MaxLength(100) last_name?: string;
  @IsOptional() @IsString() bio?: string;
  @IsOptional() @IsString() @MaxLength(20) phone?: string;
  @IsOptional() @IsString() @MaxLength(100) city?: string;
  @IsOptional() @IsString() @MaxLength(100) country?: string;
  @IsOptional() @IsUUID() avatar_file_id?: string;
  @IsOptional() @IsString() @MaxLength(10) language?: string;
  // email, role, password_hash, etc. are NEVER here
}

// In ValidationPipe config:
app.useGlobalPipes(new ValidationPipe({
  whitelist: true,       // Strip unknown properties
  forbidNonWhitelisted: true, // Throw error if unknown property sent
  transform: true,
}));
```

---

## 4. PostgreSQL Row-Level Security (RLS)

### 4.1 Setup

```sql
-- Create application role (used by NestJS via Prisma)
CREATE ROLE globetrotter_app LOGIN PASSWORD 'app_password';

-- Grant table-level permissions
GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA public TO globetrotter_app;
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO globetrotter_app;
```

### 4.2 RLS Context Middleware

Before every query, the NestJS middleware sets the current user context:

```typescript
// rls-context.middleware.ts
@Injectable()
export class RlsContextMiddleware implements NestMiddleware {
  constructor(private prisma: PrismaService) {}

  async use(req: Request, res: Response, next: NextFunction) {
    if (req.user?.id) {
      // Use $queryRaw with parameterized query (NOT $executeRawUnsafe)
      await this.prisma.$executeRaw`
        SELECT set_config('app.current_user_id', ${req.user.id}::text, true)
      `;
    }
    next();
  }
}
```

> **CRITICAL**: Use `$executeRaw` (template literal) NOT `$executeRawUnsafe(string)`.  
> `$executeRawUnsafe` is vulnerable to SQL injection if user input reaches it.

### 4.3 Service-Role Bypass

For operations that need to bypass RLS (admin queries, system operations), use a separate connection:

```typescript
// prisma.service.ts
@Injectable()
export class PrismaService extends PrismaClient {
  // Normal queries go through RLS
  async executeWithUser<T>(userId: string, fn: () => Promise<T>): Promise<T> {
    await this.$executeRaw`SELECT set_config('app.current_user_id', ${userId}::text, true)`;
    return fn();
  }

  // Admin/system bypass - uses superuser connection
  // ONLY used in admin service methods, NEVER in user-facing code
  async executeAsAdmin<T>(fn: () => Promise<T>): Promise<T> {
    await this.$executeRaw`SELECT set_config('app.current_user_id', '', true)`;
    return fn();
  }
}
```

### 4.4 RLS Policies (All Tables)

#### User-Owned Tables (Direct Ownership)

```sql
-- USERS: can only see/edit own row
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE users FORCE ROW LEVEL SECURITY;
CREATE POLICY users_own ON users FOR ALL
    USING (id = current_setting('app.current_user_id')::uuid AND deleted_at IS NULL);

-- MEDIA_FILES: can only see/manage own files
ALTER TABLE media_files ENABLE ROW LEVEL SECURITY;
ALTER TABLE media_files FORCE ROW LEVEL SECURITY;
CREATE POLICY files_own ON media_files FOR ALL
    USING (owner_user_id = current_setting('app.current_user_id')::uuid);

-- SAVED_DESTINATIONS: can only see/manage own saves
ALTER TABLE saved_destinations ENABLE ROW LEVEL SECURITY;
ALTER TABLE saved_destinations FORCE ROW LEVEL SECURITY;
CREATE POLICY saved_own ON saved_destinations FOR ALL
    USING (user_id = current_setting('app.current_user_id')::uuid);
```

#### Trip-Owned Tables (Ownership Through Trip)

```sql
-- TRIPS
ALTER TABLE trips ENABLE ROW LEVEL SECURITY;
ALTER TABLE trips FORCE ROW LEVEL SECURITY;
CREATE POLICY trips_own ON trips FOR ALL
    USING (user_id = current_setting('app.current_user_id')::uuid AND deleted_at IS NULL);

-- TRIP_STOPS (via trip)
ALTER TABLE trip_stops ENABLE ROW LEVEL SECURITY;
ALTER TABLE trip_stops FORCE ROW LEVEL SECURITY;
CREATE POLICY stops_own ON trip_stops FOR ALL
    USING (trip_id IN (
        SELECT id FROM trips
        WHERE user_id = current_setting('app.current_user_id')::uuid AND deleted_at IS NULL
    ));

-- TRIP_SECTIONS (via trip)
ALTER TABLE trip_sections ENABLE ROW LEVEL SECURITY;
ALTER TABLE trip_sections FORCE ROW LEVEL SECURITY;
CREATE POLICY sections_own ON trip_sections FOR ALL
    USING (trip_id IN (
        SELECT id FROM trips
        WHERE user_id = current_setting('app.current_user_id')::uuid AND deleted_at IS NULL
    ));

-- ITINERARY_ITEMS (via stop -> trip)
ALTER TABLE itinerary_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE itinerary_items FORCE ROW LEVEL SECURITY;
CREATE POLICY items_own ON itinerary_items FOR ALL
    USING (trip_stop_id IN (
        SELECT ts.id FROM trip_stops ts
        JOIN trips t ON ts.trip_id = t.id
        WHERE t.user_id = current_setting('app.current_user_id')::uuid AND t.deleted_at IS NULL
    ));

-- EXPENSES (via trip)
ALTER TABLE expenses ENABLE ROW LEVEL SECURITY;
ALTER TABLE expenses FORCE ROW LEVEL SECURITY;
CREATE POLICY expenses_own ON expenses FOR ALL
    USING (trip_id IN (
        SELECT id FROM trips
        WHERE user_id = current_setting('app.current_user_id')::uuid AND deleted_at IS NULL
    ));
```

#### Sharing Tables

```sql
-- SHARED_TRIPS
ALTER TABLE shared_trips ENABLE ROW LEVEL SECURITY;
ALTER TABLE shared_trips FORCE ROW LEVEL SECURITY;

-- Anyone can read active shares (for public/link access)
CREATE POLICY shared_read ON shared_trips FOR SELECT
    USING (is_active = TRUE AND (expires_at IS NULL OR expires_at > NOW()));

-- Only trip owner can create shares
CREATE POLICY shared_write ON shared_trips FOR INSERT
    WITH CHECK (trip_id IN (
        SELECT id FROM trips WHERE user_id = current_setting('app.current_user_id')::uuid
    ));

-- Only trip owner can revoke shares
CREATE POLICY shared_delete ON shared_trips FOR DELETE
    USING (trip_id IN (
        SELECT id FROM trips WHERE user_id = current_setting('app.current_user_id')::uuid
    ));
```

#### Community Tables

```sql
-- COMMUNITY_POSTS
ALTER TABLE community_posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE community_posts FORCE ROW LEVEL SECURITY;

-- Public posts readable by all authenticated users
CREATE POLICY posts_read ON community_posts FOR SELECT
    USING (visibility = 'public' AND deleted_at IS NULL);

-- Only author can insert
CREATE POLICY posts_insert ON community_posts FOR INSERT
    WITH CHECK (user_id = current_setting('app.current_user_id')::uuid);

-- Only author can update own posts
CREATE POLICY posts_update ON community_posts FOR UPDATE
    USING (user_id = current_setting('app.current_user_id')::uuid AND deleted_at IS NULL);

-- Only author can delete own posts
CREATE POLICY posts_delete ON community_posts FOR DELETE
    USING (user_id = current_setting('app.current_user_id')::uuid);

-- COMMUNITY_COMMENTS
ALTER TABLE community_comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE community_comments FORCE ROW LEVEL SECURITY;

CREATE POLICY comments_read ON community_comments FOR SELECT
    USING (post_id IN (
        SELECT id FROM community_posts WHERE visibility = 'public' AND deleted_at IS NULL
    ));
CREATE POLICY comments_insert ON community_comments FOR INSERT
    WITH CHECK (user_id = current_setting('app.current_user_id')::uuid);
CREATE POLICY comments_update ON community_comments FOR UPDATE
    USING (user_id = current_setting('app.current_user_id')::uuid AND deleted_at IS NULL);
CREATE POLICY comments_delete ON community_comments FOR DELETE
    USING (user_id = current_setting('app.current_user_id')::uuid);

-- COMMUNITY_REACTIONS
ALTER TABLE community_reactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE community_reactions FORCE ROW LEVEL SECURITY;

CREATE POLICY reactions_read ON community_reactions FOR SELECT USING (TRUE);
CREATE POLICY reactions_insert ON community_reactions FOR INSERT
    WITH CHECK (user_id = current_setting('app.current_user_id')::uuid);
CREATE POLICY reactions_delete ON community_reactions FOR DELETE
    USING (user_id = current_setting('app.current_user_id')::uuid);
```

#### Public Read-Only Tables

```sql
-- DESTINATIONS (seeded data, public read)
ALTER TABLE destinations ENABLE ROW LEVEL SECURITY;
ALTER TABLE destinations FORCE ROW LEVEL SECURITY;
CREATE POLICY destinations_read ON destinations FOR SELECT USING (TRUE);

-- ACTIVITIES (seeded data, public read)
ALTER TABLE activities ENABLE ROW LEVEL SECURITY;
ALTER TABLE activities FORCE ROW LEVEL SECURITY;
CREATE POLICY activities_read ON activities FOR SELECT USING (TRUE);
```

#### System Tables (No User Access)

```sql
-- AUDIT_LOGS - admin reads via service-role bypass
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_logs FORCE ROW LEVEL SECURITY;
-- No policy = no user access. Admin uses executeAsAdmin().

-- ANALYTICS_EVENTS - admin reads via service-role bypass
ALTER TABLE analytics_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE analytics_events FORCE ROW LEVEL SECURITY;
-- No policy = no user access. Write happens via service role; admin reads via executeAsAdmin().
```

---

## 5. Audit Logging

### 5.1 What Gets Logged

| Category | Events |
|---|---|
| Auth | `LOGIN_SUCCESS`, `LOGIN_FAILED`, `LOGOUT`, `REFRESH_TOKEN_REUSE` |
| Password | `PASSWORD_CHANGED`, `PASSWORD_RESET_REQ`, `PASSWORD_RESET_DONE` |
| Email | `EMAIL_VERIFIED` |
| Trips | `TRIP_CREATED`, `TRIP_UPDATED`, `TRIP_DELETED` |
| Stops | `STOP_CREATED`, `STOP_UPDATED`, `STOP_DELETED` |
| Sections | `SECTION_CREATED`, `SECTION_UPDATED`, `SECTION_DELETED` |
| Itinerary | `ITEM_CREATED`, `ITEM_UPDATED`, `ITEM_DELETED` |
| Expenses | `EXPENSE_CREATED`, `EXPENSE_UPDATED`, `EXPENSE_DELETED` |
| Sharing | `SHARE_CREATED`, `SHARE_REVOKED`, `TRIP_COPIED` |
| Community | `POST_CREATED`, `POST_DELETED`, `COMMENT_CREATED`, `COMMENT_DELETED` |
| Files | `FILE_UPLOADED`, `FILE_DELETED` |
| Admin | `ADMIN_ROLE_CHANGED`, `ADMIN_USER_DELETED` |
| Account | `ACCOUNT_DELETED` |

### 5.2 Audit Service Implementation

```typescript
@Injectable()
export class AuditService {
  constructor(private prisma: PrismaService) {}

  async log(params: {
    action: string;
    actor_user_id?: string;
    resource_type: string;
    resource_id?: string;
    request_id?: string;
    ip_address?: string;
    user_agent?: string;
    old_values?: object;
    new_values?: object;
    metadata?: object;
  }) {
    // Uses service role - bypasses RLS
    await this.prisma.auditLog.create({
      data: {
        action: params.action,
        actor_user_id: params.actor_user_id,
        resource_type: params.resource_type,
        resource_id: params.resource_id,
        request_id: params.request_id,
        ip_address: params.ip_address,
        user_agent: params.user_agent,
        old_values: params.old_values as any,
        new_values: params.new_values as any,
        metadata: params.metadata as any,
      },
    });
  }
}
```

### 5.3 Rules

```text
1. audit_logs is APPEND-ONLY
2. No UPDATE or DELETE ever (not even from admin)
3. Actor is always from JWT, never from request body
4. old_values captures state before mutation
5. new_values captures state after mutation
6. request_id links audit entry to the HTTP request log
```

---

## 6. Error Sanitization

### 6.1 What the Client Receives

```json
{
  "statusCode": 400,
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "end_date must be after start_date",
    "request_id": "req_abc123"
  }
}
```

### 6.2 What the Client NEVER Receives

```text
- PostgreSQL table names
- Column names from constraint violations
- Stack traces
- Internal file paths
- SQL query text
- Prisma error codes (P2002, P2025, etc.)
- Connection strings
- Environment variable values
```

### 6.3 Global Exception Filter

```typescript
@Catch()
export class GlobalExceptionFilter implements ExceptionFilter {
  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();

    let status = 500;
    let message = 'Internal server error';
    let code = 'INTERNAL_ERROR';

    if (exception instanceof HttpException) {
      status = exception.getStatus();
      const res = exception.getResponse();
      message = typeof res === 'string' ? res : (res as any).message;
      code = this.getErrorCode(status);
    } else if (this.isPrismaError(exception)) {
      // Map Prisma errors to safe responses
      const mapped = this.mapPrismaError(exception);
      status = mapped.status;
      message = mapped.message;
      code = mapped.code;
    }

    // Log full details server-side
    this.logger.error({
      request_id: request.requestId,
      path: request.url,
      method: request.method,
      status,
      error: exception,
      stack: exception instanceof Error ? exception.stack : undefined,
    });

    // Return sanitized response
    response.status(status).json({
      statusCode: status,
      error: {
        code,
        message,
        request_id: request.requestId,
      },
    });
  }

  private mapPrismaError(error: any) {
    switch (error.code) {
      case 'P2002': return { status: 409, message: 'Resource already exists', code: 'CONFLICT' };
      case 'P2025': return { status: 404, message: 'Resource not found', code: 'NOT_FOUND' };
      case 'P2003': return { status: 400, message: 'Invalid reference', code: 'BAD_REQUEST' };
      default:      return { status: 500, message: 'Internal server error', code: 'INTERNAL_ERROR' };
    }
  }
}
```

---

## 7. CORS, Headers & Body Limits

### 7.1 CORS

```typescript
app.enableCors({
  origin: process.env.ALLOWED_ORIGINS?.split(',') || ['http://localhost:5173'],
  credentials: true,
  methods: ['GET', 'POST', 'PATCH', 'DELETE'],
  allowedHeaders: ['Content-Type', 'Authorization'],
});
```

### 7.2 Security Headers (Helmet)

```typescript
app.use(helmet({
  contentSecurityPolicy: true,
  crossOriginEmbedderPolicy: true,
  crossOriginOpenerPolicy: true,
  crossOriginResourcePolicy: true,
  hsts: { maxAge: 31536000, includeSubDomains: true },
  frameguard: { action: 'deny' },
  noSniff: true,
  referrerPolicy: { policy: 'strict-origin-when-cross-origin' },
}));
```

### 7.3 Body Size Limits

```typescript
app.use(express.json({ limit: '1mb' }));   // JSON bodies
app.use(express.urlencoded({ limit: '1mb', extended: true }));
// File upload: 5MB max (enforced by Multer)
```

### 7.4 File Upload Security

```typescript
const multerConfig = {
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB
  fileFilter: (req, file, cb) => {
    const allowed = ['image/jpeg', 'image/png', 'image/webp'];
    if (!allowed.includes(file.mimetype)) {
      return cb(new BadRequestException('Invalid file type'), false);
    }
    cb(null, true);
  },
  storage: diskStorage({
    destination: './uploads',
    filename: (req, file, cb) => {
      // Server-generated filename - NEVER use original
      const name = `${uuidv4()}${extname(file.originalname)}`;
      cb(null, name);
    },
  }),
};
```

**Additional validation after upload:**
```text
1. Validate magic bytes (not just MIME type header)
2. Re-encode image to strip EXIF/metadata
3. Check file size matches Content-Length header
4. Generate SHA-256 checksum for integrity
```

---

## 8. Rate Limiting

| Endpoint Group | Limit | Window | Key |
|---|---|---|---|
| `POST /auth/login` | 10 | 15 min | IP |
| `POST /auth/register` | 5 | 1 hour | IP |
| `POST /auth/forgot-password` | 5 | 1 hour | account + IP |
| `POST /auth/refresh` | 30 | 1 min | IP |
| `POST /auth/verify-email` | 10 | 1 hour | IP |
| `POST /uploads/image` | 20 | 1 hour | User |
| `GET /destinations/search` | 60 | 1 min | User |
| `POST /community/posts` | 10 | 1 hour | User |
| All other endpoints | 120 | 1 min | User |

**Implementation:**
```typescript
@Throttle({ default: { limit: 10, ttl: 900000 } }) // 10/15min
@Post('login')
async login(@Body() dto: LoginDto) { ... }
```

---

## 9. Analytics Event Tracking

### 9.1 Events

| Event Type | When Fired | Entity |
|---|---|---|
| `DESTINATION_SEARCHED` | User searches destinations | `destination` |
| `DESTINATION_VIEWED` | User views destination detail | `destination` |
| `ACTIVITY_VIEWED` | User views activity detail | `activity` |
| `TRIP_CREATED` | User creates a trip | `trip` |
| `TRIP_COMPLETED` | User marks trip as completed | `trip` |
| `COMMUNITY_POST_CREATED` | User creates a community post | `community_post` |
| `COMMUNITY_POST_VIEWED` | User views a community post | `community_post` |
| `SHARE_LINK_OPENED` | Someone opens a share link | `shared_trip` |

### 9.2 Implementation

```typescript
@Injectable()
export class AnalyticsService {
  constructor(private prisma: PrismaService) {}

  async track(params: {
    user_id?: string;
    event_type: string;
    entity_type?: string;
    entity_id?: string;
    metadata?: object;
  }) {
    await this.prisma.analyticsEvent.create({
      data: {
        user_id: params.user_id,
        event_type: params.event_type,
        entity_type: params.entity_type,
        entity_id: params.entity_id,
        metadata: params.metadata as any,
      },
    });
  }
}
```

---

## 10. Security Release Checklist

```text
[ ] RLS enabled on ALL 20 tables
[ ] Default deny - no table accessible without explicit policy
[ ] Ownership checks tested for every resource
[ ] IDOR tests pass for every endpoint
[ ] RBAC tests pass (user vs admin vs anonymous)
[ ] CRUD authorization tests pass (every resource x every role)
[ ] Sensitive columns excluded from all API responses
[ ] Passwords hashed with bcrypt (12 rounds)
[ ] All tokens hashed (refresh, reset, verify)
[ ] Refresh token family reuse detection works
[ ] Password change revokes all sessions
[ ] Rate limits tested and enforced
[ ] CORS restricted to allowed origins
[ ] Helmet security headers enabled
[ ] Error responses sanitized (no DB details to client)
[ ] Database constraints verified (FK, CHECK, UNIQUE, NOT NULL)
[ ] Audit logging enabled for all security-sensitive writes
[ ] No secrets committed to version control
[ ] No unrestricted SELECT * in any API response
[ ] Pagination enforced (max 100)
[ ] File upload restrictions verified (type, size, naming)
[ ] Community posts properly ownership-checked
[ ] Admin endpoints guarded + audit-logged
[ ] E2E security tests pass
[ ] Request IDs trace through all log layers
```

---

## 11. Environment Variables

```env
NODE_ENV=development
PORT=3000
DATABASE_URL=postgresql://globetrotter:globetrotter_dev_pass@localhost:5432/globetrotter
JWT_SECRET=change-this-in-production-use-64-char-random
JWT_ACCESS_EXPIRY=15m
JWT_REFRESH_EXPIRY=7d
BCRYPT_ROUNDS=12
ALLOWED_ORIGINS=http://localhost:3000,http://localhost:5173
THROTTLE_TTL=60
THROTTLE_LIMIT=120
UPLOAD_DIR=./uploads
MAX_FILE_SIZE=5242880
```
