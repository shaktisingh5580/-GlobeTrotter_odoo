# GlobeTrotter — API Design & Expected Responses

> **Base URL:** `http://localhost:3000/api/v1`  
> **Auth:** Bearer JWT · **Format:** JSON · **75+ Endpoints**  
> **Related Files:** [database_design.md](file:///c:/Users/shakt/Downloads/oddo/database_design.md) · [security_layer.md](file:///c:/Users/shakt/Downloads/oddo/security_layer.md) · [phases.md](file:///c:/Users/shakt/Downloads/oddo/phases.md)

---

## Standard Response Envelope

Every API response follows this format:

### Success Response
```json
{
  "success": true,
  "data": { ... },
  "meta": {
    "request_id": "req_abc123",
    "timestamp": "2026-08-22T12:00:00.000Z"
  }
}
```

### Success Response (Paginated)
```json
{
  "success": true,
  "data": [ ... ],
  "meta": {
    "request_id": "req_abc123",
    "timestamp": "2026-08-22T12:00:00.000Z",
    "pagination": {
      "total": 42,
      "limit": 20,
      "offset": 0,
      "has_more": true
    }
  }
}
```

### Error Response
```json
{
  "success": false,
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "end_date must be after start_date",
    "request_id": "req_abc123"
  }
}
```

### Standard Error Codes

| HTTP | Code | Meaning |
|---|---|---|
| 400 | `BAD_REQUEST` | Invalid input / validation failure |
| 401 | `UNAUTHORIZED` | Missing or invalid JWT |
| 403 | `FORBIDDEN` | Valid JWT but insufficient role (returned as 404 for IDOR safety) |
| 404 | `NOT_FOUND` | Resource not found OR access denied (intentionally ambiguous) |
| 409 | `CONFLICT` | Duplicate resource (email, share token, etc.) |
| 413 | `PAYLOAD_TOO_LARGE` | Body exceeds size limit |
| 429 | `TOO_MANY_REQUESTS` | Rate limit exceeded |
| 500 | `INTERNAL_ERROR` | Server error (details hidden from client) |

---

## Pagination

All list endpoints use **offset pagination**:

| Param | Type | Default | Max |
|---|---|---|---|
| `limit` | number | 20 | 100 |
| `offset` | number | 0 | — |

---

# MODULE 1: Auth (`/api/v1/auth`)

## POST `/auth/register`

**Auth:** None | **Rate Limit:** 5/hr/IP | **Audit:** `USER_CREATED`

**Request:**
```json
{
  "email": "shakti@example.com",
  "password": "SecureP@ss123",
  "first_name": "Shakti",
  "last_name": "Kumar",
  "bio": "Love traveling and exploring new cultures",
  "phone": "+91-9876543210",
  "city": "Mumbai",
  "country": "India"
}
```

**Validation Rules:**
```text
email:      required, valid email format, max 255 chars
password:   required, min 8 chars, must contain uppercase + lowercase + number + special
first_name: required, max 100 chars
last_name:  required, max 100 chars
bio:        optional, text
phone:      optional, max 20 chars
city:       optional, max 100 chars
country:    optional, max 100 chars
```

**Success Response (201):**
```json
{
  "success": true,
  "data": {
    "user": {
      "id": "a1b2c3d4-e5f6-7890-abcd-ef1234567890",
      "email": "shakti@example.com",
      "first_name": "Shakti",
      "last_name": "Kumar",
      "bio": "Love traveling and exploring new cultures",
      "phone": "+91-9876543210",
      "city": "Mumbai",
      "country": "India",
      "avatar_url": null,
      "language": "en",
      "role": "user",
      "email_verified": false,
      "created_at": "2026-08-22T12:00:00.000Z"
    },
    "access_token": "eyJhbGciOiJIUzI1NiIs...",
    "refresh_token": "f8a9b7c6d5e4f3a2b1c0..."
  }
}
```

**Error (409 — email exists):**
```json
{
  "success": false,
  "error": {
    "code": "CONFLICT",
    "message": "An account with this email already exists",
    "request_id": "req_abc123"
  }
}
```

---

## POST `/auth/login`

**Auth:** None | **Rate Limit:** 10/15min/IP | **Audit:** `LOGIN_SUCCESS` or `LOGIN_FAILED`

**Request:**
```json
{
  "email": "shakti@example.com",
  "password": "SecureP@ss123"
}
```

**Success Response (200):**
```json
{
  "success": true,
  "data": {
    "user": {
      "id": "a1b2c3d4-e5f6-7890-abcd-ef1234567890",
      "email": "shakti@example.com",
      "first_name": "Shakti",
      "last_name": "Kumar",
      "bio": "Love traveling and exploring new cultures",
      "avatar_url": "http://localhost:3000/uploads/abc123.jpg",
      "role": "user",
      "email_verified": true
    },
    "access_token": "eyJhbGciOiJIUzI1NiIs...",
    "refresh_token": "f8a9b7c6d5e4f3a2b1c0..."
  }
}
```

**Error (401):**
```json
{
  "success": false,
  "error": { "code": "UNAUTHORIZED", "message": "Invalid email or password" }
}
```

---

## POST `/auth/refresh`

**Auth:** Refresh Token | **Rate Limit:** 30/min/IP

**Request:**
```json
{
  "refresh_token": "f8a9b7c6d5e4f3a2b1c0..."
}
```

**Success Response (200):**
```json
{
  "success": true,
  "data": {
    "access_token": "eyJhbGciOiJIUzI1NiIs...(new)...",
    "refresh_token": "new_refresh_token_here..."
  }
}
```

**Error (401 — token reuse detected):**
```json
{
  "success": false,
  "error": { "code": "UNAUTHORIZED", "message": "Token reuse detected. Please log in again." }
}
```

---

## POST `/auth/logout`

**Auth:** JWT | **Rate Limit:** 30/min

**Request:**
```json
{
  "refresh_token": "current_refresh_token..."
}
```

**Success Response (200):**
```json
{
  "success": true,
  "data": { "message": "Logged out successfully" }
}
```

---

## POST `/auth/forgot-password`

**Auth:** None | **Rate Limit:** 5/hr | **Audit:** `PASSWORD_RESET_REQ`

**Request:**
```json
{
  "email": "shakti@example.com"
}
```

**Success Response (200 — always, for privacy):**
```json
{
  "success": true,
  "data": { "message": "If an account exists with this email, a reset link has been sent." }
}
```

---

## POST `/auth/reset-password`

**Auth:** None | **Rate Limit:** 5/hr/IP | **Audit:** `PASSWORD_RESET_DONE`

**Request:**
```json
{
  "token": "reset_token_from_email",
  "new_password": "NewSecureP@ss456"
}
```

**Success Response (200):**
```json
{
  "success": true,
  "data": { "message": "Password has been reset. Please log in." }
}
```

---

## POST `/auth/verify-email`

**Auth:** None | **Rate Limit:** 10/hr/IP | **Audit:** `EMAIL_VERIFIED`

**Request:**
```json
{
  "token": "verification_token_from_email"
}
```

**Success Response (200):**
```json
{
  "success": true,
  "data": { "message": "Email verified successfully." }
}
```

---

# MODULE 2: Users (`/api/v1/users`)

## GET `/users/me`

**Auth:** JWT

**Success Response (200):**
```json
{
  "success": true,
  "data": {
    "id": "a1b2c3d4-e5f6-7890-abcd-ef1234567890",
    "email": "shakti@example.com",
    "first_name": "Shakti",
    "last_name": "Kumar",
    "bio": "Love traveling and exploring new cultures",
    "phone": "+91-9876543210",
    "city": "Mumbai",
    "country": "India",
    "avatar_url": "http://localhost:3000/uploads/abc123.jpg",
    "language": "en",
    "role": "user",
    "email_verified": true,
    "created_at": "2026-08-22T12:00:00.000Z",
    "updated_at": "2026-08-22T13:00:00.000Z"
  }
}
```

> **NEVER returned:** `password_hash`, `deleted_at`, `email_verified_at`, `avatar_file_id`

---

## PATCH `/users/me`

**Auth:** JWT | **Audit:** implicit

**Request (partial update — all fields optional):**
```json
{
  "first_name": "Shakti",
  "last_name": "Kumar",
  "bio": "Updated bio text",
  "phone": "+91-9876543210",
  "city": "Delhi",
  "country": "India",
  "avatar_file_id": "file-uuid-here",
  "language": "hi"
}
```

> **FORBIDDEN fields (rejected by validation pipe):** `email`, `role`, `password_hash`, `email_verified`, `deleted_at`, `id`

**Success Response (200):** Same shape as `GET /users/me`

---

## DELETE `/users/me`

**Auth:** JWT | **Audit:** `ACCOUNT_DELETED`

**Success Response (200):**
```json
{
  "success": true,
  "data": { "message": "Account deleted successfully" }
}
```

**Side effects:** Soft-delete user, revoke all refresh sessions.

---

## PATCH `/users/me/password`

**Auth:** JWT | **Audit:** `PASSWORD_CHANGED`

**Request:**
```json
{
  "current_password": "OldP@ss123",
  "new_password": "NewP@ss456"
}
```

**Success Response (200):**
```json
{
  "success": true,
  "data": { "message": "Password changed. All sessions have been revoked." }
}
```

**Side effects:** Revoke ALL refresh sessions (force re-login on all devices).

---

## GET `/users/me/stats`

**Auth:** JWT

**Success Response (200):**
```json
{
  "success": true,
  "data": {
    "total_trips": 5,
    "completed_trips": 2,
    "planned_trips": 2,
    "ongoing_trips": 1,
    "destinations_visited": 8,
    "total_expenses": 145000.00,
    "saved_destinations": 12,
    "community_posts": 3
  }
}
```

---

# MODULE 3: Trips (`/api/v1/trips`)

## GET `/trips`

**Auth:** JWT | **Own trips only**

**Query params:** `?status=planned&sort=start_date&order=asc&limit=20&offset=0`

**Success Response (200):**
```json
{
  "success": true,
  "data": [
    {
      "id": "trip-uuid-1",
      "title": "European Adventure 2026",
      "description": "A two-week trip across Europe",
      "start_date": "2026-09-01",
      "end_date": "2026-09-15",
      "budget_limit": 200000.00,
      "currency": "INR",
      "cover_url": "http://localhost:3000/uploads/cover123.jpg",
      "status": "planned",
      "stops_count": 3,
      "total_expenses": 0,
      "created_at": "2026-08-22T12:00:00.000Z"
    }
  ],
  "meta": {
    "pagination": { "total": 5, "limit": 20, "offset": 0, "has_more": false }
  }
}
```

---

## POST `/trips`

**Auth:** JWT | **Audit:** `TRIP_CREATED`

**Request:**
```json
{
  "title": "European Adventure 2026",
  "description": "A two-week trip across Europe",
  "start_date": "2026-09-01",
  "end_date": "2026-09-15",
  "budget_limit": 200000.00,
  "currency": "INR"
}
```

**Validation:**
```text
title:        required, max 200 chars
description:  optional
start_date:   required, ISO date, must be today or future
end_date:     required, ISO date, must be >= start_date
budget_limit: optional, >= 0
currency:     optional, one of: INR, USD, EUR, GBP, JPY, AUD, CAD
```

**Success Response (201):**
```json
{
  "success": true,
  "data": {
    "id": "trip-uuid-1",
    "title": "European Adventure 2026",
    "description": "A two-week trip across Europe",
    "start_date": "2026-09-01",
    "end_date": "2026-09-15",
    "budget_limit": 200000.00,
    "currency": "INR",
    "cover_url": null,
    "status": "draft",
    "created_at": "2026-08-22T12:00:00.000Z"
  }
}
```

---

## GET `/trips/:tripId`

**Auth:** JWT | **Ownership check**

**Success Response (200):**
```json
{
  "success": true,
  "data": {
    "id": "trip-uuid-1",
    "title": "European Adventure 2026",
    "description": "A two-week trip across Europe",
    "start_date": "2026-09-01",
    "end_date": "2026-09-15",
    "budget_limit": 200000.00,
    "currency": "INR",
    "cover_url": "http://localhost:3000/uploads/cover123.jpg",
    "status": "planned",
    "stops": [
      {
        "id": "stop-uuid-1",
        "destination": { "id": "dest-uuid", "name": "Paris", "country": "France" },
        "stop_order": 0,
        "arrival_date": "2026-09-01",
        "departure_date": "2026-09-05"
      }
    ],
    "created_at": "2026-08-22T12:00:00.000Z",
    "updated_at": "2026-08-22T13:00:00.000Z"
  }
}
```

---

## PATCH `/trips/:tripId`

**Auth:** JWT | **Ownership check** | **Audit:** `TRIP_UPDATED`

**Request (partial):**
```json
{
  "title": "Updated Title",
  "status": "planned",
  "cover_file_id": "file-uuid-here"
}
```

---

## DELETE `/trips/:tripId`

**Auth:** JWT | **Ownership check** | **Audit:** `TRIP_DELETED`

**Success Response (200):**
```json
{
  "success": true,
  "data": { "message": "Trip deleted successfully" }
}
```

**Side effects:** Soft-delete. Cascades to stops, sections, items, expenses, shares.

---

## GET `/trips/:tripId/full`

**Auth:** JWT | **Ownership check**

Returns the complete trip with stops, sections, itinerary items, and expenses.

**Success Response (200):**
```json
{
  "success": true,
  "data": {
    "id": "trip-uuid-1",
    "title": "European Adventure 2026",
    "start_date": "2026-09-01",
    "end_date": "2026-09-15",
    "budget_limit": 200000.00,
    "currency": "INR",
    "status": "planned",
    "stops": [
      {
        "id": "stop-uuid-1",
        "destination": { "id": "dest-uuid", "name": "Paris", "country": "France", "image_url": "..." },
        "stop_order": 0,
        "arrival_date": "2026-09-01",
        "departure_date": "2026-09-05",
        "itinerary_items": [
          {
            "id": "item-uuid-1",
            "item_date": "2026-09-01",
            "start_time": "09:00",
            "end_time": "12:00",
            "activity": { "id": "act-uuid", "name": "Eiffel Tower Visit", "category": "sightseeing" },
            "custom_title": null,
            "section": { "id": "sec-uuid", "title": "Paris Sightseeing", "section_type": "activity" }
          }
        ]
      }
    ],
    "sections": [
      {
        "id": "sec-uuid",
        "title": "Paris Sightseeing",
        "section_type": "activity",
        "start_date": "2026-09-01",
        "end_date": "2026-09-03",
        "planned_budget": 50000.00,
        "actual_spent": 12500.00
      }
    ],
    "budget_summary": {
      "total_budget": 200000.00,
      "total_spent": 45000.00,
      "remaining": 155000.00
    }
  }
}
```

---

# MODULE 4: Stops (`/api/v1/trips/:tripId/stops`)

## GET `/trips/:tripId/stops`

**Auth:** JWT | **Trip ownership check**

**Success Response (200):**
```json
{
  "success": true,
  "data": [
    {
      "id": "stop-uuid-1",
      "destination": {
        "id": "dest-uuid",
        "name": "Paris",
        "country": "France",
        "country_code": "FR",
        "image_url": "https://..."
      },
      "stop_order": 0,
      "arrival_date": "2026-09-01",
      "departure_date": "2026-09-05",
      "notes": "Staying near Champs-Elysees"
    },
    {
      "id": "stop-uuid-2",
      "destination": {
        "id": "dest-uuid-2",
        "name": "Amsterdam",
        "country": "Netherlands"
      },
      "stop_order": 1,
      "arrival_date": "2026-09-05",
      "departure_date": "2026-09-08",
      "notes": null
    }
  ]
}
```

---

## POST `/trips/:tripId/stops`

**Auth:** JWT | **Trip ownership** | **Audit:** `STOP_CREATED`

**Request:**
```json
{
  "destination_id": "dest-uuid",
  "stop_order": 0,
  "arrival_date": "2026-09-01",
  "departure_date": "2026-09-05",
  "notes": "Staying near Champs-Elysees"
}
```

**Validation:**
```text
destination_id: required, must exist in destinations table
stop_order:     required, >= 0, unique within trip
arrival_date:   required, within trip date range
departure_date: required, >= arrival_date, within trip date range
notes:          optional
```

---

## PATCH `/trips/:tripId/stops/reorder`

**Auth:** JWT | **Trip ownership**

**Request:**
```json
{
  "order": [
    { "id": "stop-uuid-2", "stop_order": 0 },
    { "id": "stop-uuid-1", "stop_order": 1 }
  ]
}
```

---

# MODULE 5: Sections (`/api/v1/trips/:tripId/sections`)

## GET `/trips/:tripId/sections`

**Auth:** JWT | **Trip ownership**

**Success Response (200):**
```json
{
  "success": true,
  "data": [
    {
      "id": "sec-uuid-1",
      "title": "Hotel Le Marais",
      "description": "3-night stay in the heart of Paris",
      "section_type": "stay",
      "start_date": "2026-09-01",
      "end_date": "2026-09-03",
      "planned_budget": 45000.00,
      "actual_spent": 42000.00,
      "currency": "INR",
      "section_order": 0,
      "linked_stop": { "id": "stop-uuid-1", "destination_name": "Paris" },
      "items_count": 0
    },
    {
      "id": "sec-uuid-2",
      "title": "Paris Sightseeing",
      "description": "Major attractions visit",
      "section_type": "activity",
      "start_date": "2026-09-01",
      "end_date": "2026-09-03",
      "planned_budget": 15000.00,
      "actual_spent": 8500.00,
      "currency": "INR",
      "section_order": 1,
      "linked_stop": { "id": "stop-uuid-1", "destination_name": "Paris" },
      "items_count": 3
    },
    {
      "id": "sec-uuid-3",
      "title": "Train to Amsterdam",
      "description": "Thalys high-speed train",
      "section_type": "travel",
      "start_date": "2026-09-03",
      "end_date": "2026-09-03",
      "planned_budget": 8000.00,
      "actual_spent": 7200.00,
      "currency": "INR",
      "section_order": 2,
      "linked_stop": null,
      "items_count": 0
    }
  ]
}
```

## POST `/trips/:tripId/sections`

**Auth:** JWT | **Trip ownership** | **Audit:** `SECTION_CREATED`

**Request:**
```json
{
  "title": "Hotel Le Marais",
  "description": "3-night stay in the heart of Paris",
  "section_type": "stay",
  "start_date": "2026-09-01",
  "end_date": "2026-09-03",
  "planned_budget": 45000.00,
  "currency": "INR",
  "section_order": 0,
  "trip_stop_id": "stop-uuid-1"
}
```

**Validation:**
```text
title:         required, max 200 chars
section_type:  required, one of: travel, stay, activity, food, transport, custom
start_date:    required, within trip date range
end_date:      required, >= start_date, within trip date range
planned_budget: optional, >= 0
currency:      optional
section_order: required, >= 0, unique within trip
trip_stop_id:  optional, must belong to same trip (cross-parent validation!)
```

---

# MODULE 6: Destinations (`/api/v1/destinations`)

## GET `/destinations/search`

**Auth:** JWT | **Query params:** `?q=paris&country=France&region=Europe&min_cost=1&max_cost=3&limit=20&offset=0`

**Success Response (200):**
```json
{
  "success": true,
  "data": [
    {
      "id": "dest-uuid-1",
      "name": "Paris",
      "country": "France",
      "country_code": "FR",
      "region": "Europe",
      "latitude": 48.8566000,
      "longitude": 2.3522000,
      "timezone": "Europe/Paris",
      "description": "The City of Light...",
      "image_url": "https://...",
      "cost_index": 4,
      "popularity_score": 95,
      "activities_count": 15
    }
  ],
  "meta": { "pagination": { "total": 3, "limit": 20, "offset": 0, "has_more": false } }
}
```

## GET `/destinations/popular`

Returns popular destinations calculated from **real trip_stops data**, not static scores.

```json
{
  "success": true,
  "data": [
    { "id": "dest-uuid", "name": "Paris", "country": "France", "trip_count": 142, "image_url": "..." },
    { "id": "dest-uuid", "name": "Tokyo", "country": "Japan", "trip_count": 98, "image_url": "..." }
  ]
}
```

## POST `/destinations/:id/save` & DELETE `/destinations/:id/save`

**Auth:** JWT

**Success (201):**
```json
{ "success": true, "data": { "message": "Destination saved" } }
```

## GET `/destinations/saved`

**Auth:** JWT | **Own saves only**

```json
{
  "success": true,
  "data": [
    {
      "id": "saved-uuid",
      "destination": { "id": "dest-uuid", "name": "Paris", "country": "France", "image_url": "..." },
      "notes": "Want to visit in spring",
      "created_at": "2026-08-22T12:00:00.000Z"
    }
  ]
}
```

---

# MODULE 7: Activities (`/api/v1/activities`)

## GET `/activities/search`

**Auth:** JWT | **Query:** `?q=eiffel&destination_id=uuid&category=sightseeing&limit=20`

```json
{
  "success": true,
  "data": [
    {
      "id": "act-uuid-1",
      "name": "Eiffel Tower Visit",
      "description": "Visit the iconic iron lattice tower...",
      "category": "sightseeing",
      "estimated_cost": 2500.00,
      "currency": "INR",
      "duration_minutes": 120,
      "image_url": "https://...",
      "rating": 4.7,
      "destination": { "id": "dest-uuid", "name": "Paris", "country": "France" }
    }
  ]
}
```

## GET `/activities/categories`

```json
{
  "success": true,
  "data": ["sightseeing", "food", "adventure", "culture", "nightlife", "shopping", "nature", "other"]
}
```

---

# MODULE 8: Itinerary (`/api/v1/trips/:tripId/itinerary`)

## GET `/trips/:tripId/itinerary`

**Auth:** JWT | **Trip ownership**

```json
{
  "success": true,
  "data": {
    "trip_id": "trip-uuid",
    "days": [
      {
        "date": "2026-09-01",
        "stop": { "id": "stop-uuid", "destination_name": "Paris" },
        "items": [
          {
            "id": "item-uuid-1",
            "start_time": "09:00",
            "end_time": "12:00",
            "item_order": 0,
            "activity": { "id": "act-uuid", "name": "Eiffel Tower Visit", "category": "sightseeing", "estimated_cost": 2500 },
            "custom_title": null,
            "custom_description": null,
            "notes": "Book skip-the-line tickets",
            "section": { "id": "sec-uuid", "title": "Paris Sightseeing", "section_type": "activity" },
            "expense": { "id": "exp-uuid", "amount": 2400, "category": "activities" }
          },
          {
            "id": "item-uuid-2",
            "start_time": "13:00",
            "end_time": "14:30",
            "item_order": 1,
            "activity": null,
            "custom_title": "Lunch at Cafe de Flore",
            "custom_description": "Famous literary cafe in Saint-Germain",
            "notes": null,
            "section": { "id": "sec-uuid-2", "title": "Food & Dining", "section_type": "food" },
            "expense": { "id": "exp-uuid-2", "amount": 3500, "category": "meals" }
          }
        ]
      }
    ]
  }
}
```

## POST `/trips/:tripId/itinerary/items`

**Auth:** JWT | **Trip ownership** | **Audit:** `ITEM_CREATED`

**Request:**
```json
{
  "trip_stop_id": "stop-uuid",
  "trip_section_id": "sec-uuid",
  "activity_id": "act-uuid",
  "item_date": "2026-09-01",
  "start_time": "09:00",
  "end_time": "12:00",
  "item_order": 0,
  "custom_title": null,
  "custom_description": null,
  "notes": "Book tickets in advance"
}
```

**Validation:**
```text
trip_stop_id:   required, must belong to this trip
trip_section_id: optional, must belong to same trip (cross-parent validation)
activity_id:     optional (null = custom item)
item_date:       required, within stop's arrival-departure range
start_time:      optional
end_time:        optional, must be > start_time
item_order:      required, unique within (stop, date)
custom_title:    required if activity_id is null
```

## GET `/trips/:tripId/itinerary/calendar`

**Auth:** JWT | **Trip ownership**

```json
{
  "success": true,
  "data": {
    "trip_id": "trip-uuid",
    "start_date": "2026-09-01",
    "end_date": "2026-09-15",
    "calendar": [
      { "date": "2026-09-01", "stop": "Paris", "items_count": 4, "total_expense": 12500 },
      { "date": "2026-09-02", "stop": "Paris", "items_count": 3, "total_expense": 8000 },
      { "date": "2026-09-03", "stop": "Paris", "items_count": 2, "total_expense": 15200 }
    ]
  }
}
```

---

# MODULE 9: Budget (`/api/v1/trips/:tripId/budget`)

## GET `/trips/:tripId/budget`

**Auth:** JWT | **Trip ownership**

All values are **calculated from expenses** — nothing is stored as a duplicate.

```json
{
  "success": true,
  "data": {
    "trip_id": "trip-uuid",
    "total_budget": 200000.00,
    "total_spent": 45000.00,
    "remaining": 155000.00,
    "currency": "INR",
    "expense_count": 12,
    "average_per_day": 3000.00,
    "trip_duration_days": 15
  }
}
```

## GET `/trips/:tripId/budget/breakdown`

```json
{
  "success": true,
  "data": {
    "categories": [
      { "category": "stay", "total": 20000.00, "percentage": 44.4, "count": 2 },
      { "category": "meals", "total": 12000.00, "percentage": 26.7, "count": 5 },
      { "category": "activities", "total": 8000.00, "percentage": 17.8, "count": 3 },
      { "category": "transport", "total": 5000.00, "percentage": 11.1, "count": 2 }
    ]
  }
}
```

## GET `/trips/:tripId/budget/by-section`

Per-section planned vs actual budget comparison.

```json
{
  "success": true,
  "data": {
    "sections": [
      {
        "section_id": "sec-uuid-1",
        "title": "Hotel Le Marais",
        "section_type": "stay",
        "planned_budget": 45000.00,
        "actual_spent": 42000.00,
        "remaining": 3000.00,
        "status": "within_budget"
      },
      {
        "section_id": "sec-uuid-2",
        "title": "Paris Sightseeing",
        "section_type": "activity",
        "planned_budget": 15000.00,
        "actual_spent": 18500.00,
        "remaining": -3500.00,
        "status": "over_budget"
      }
    ]
  }
}
```

## POST `/trips/:tripId/budget/expenses`

**Auth:** JWT | **Trip ownership** | **Audit:** `EXPENSE_CREATED`

**Request:**
```json
{
  "title": "Eiffel Tower tickets",
  "amount": 2400.00,
  "currency": "INR",
  "category": "activities",
  "expense_date": "2026-09-01",
  "trip_stop_id": "stop-uuid",
  "trip_section_id": "sec-uuid",
  "itinerary_item_id": "item-uuid",
  "notes": "2 adult tickets"
}
```

**Validation:**
```text
title:             required, max 200 chars
amount:            required, >= 0
currency:          optional
category:          required, one of: transport, stay, activities, meals, other
expense_date:      required, within trip date range
trip_stop_id:      optional, must belong to this trip
trip_section_id:   optional, must belong to this trip (cross-parent)
itinerary_item_id: optional, must belong to this trip (cross-parent)
```

---

# MODULE 10: Sharing (`/api/v1/sharing`)

## POST `/sharing/trips/:tripId/share`

**Auth:** JWT | **Trip ownership** | **Audit:** `SHARE_CREATED`

**Request:**
```json
{
  "visibility": "link_only",
  "expires_in_days": 30
}
```

**Success Response (201):**
```json
{
  "success": true,
  "data": {
    "share_token": "abc123def456",
    "share_url": "http://localhost:3000/shared/abc123def456",
    "visibility": "link_only",
    "expires_at": "2026-09-22T12:00:00.000Z"
  }
}
```

## GET `/sharing/shared/:shareToken`

**Auth:** None (public)

Returns a **filtered** view — no user PII exposed.

```json
{
  "success": true,
  "data": {
    "title": "European Adventure 2026",
    "description": "A two-week trip across Europe",
    "start_date": "2026-09-01",
    "end_date": "2026-09-15",
    "status": "planned",
    "stops": [
      {
        "destination": { "name": "Paris", "country": "France", "image_url": "..." },
        "arrival_date": "2026-09-01",
        "departure_date": "2026-09-05"
      }
    ]
  }
}
```

> **NEVER exposed:** `user_id`, `user.email`, `user.first_name`, `budget_limit`, `expenses`

## POST `/sharing/shared/:shareToken/copy`

**Auth:** JWT | **Audit:** `TRIP_COPIED`

Copies the shared trip into the authenticated user's account. Transaction-wrapped.

```json
{
  "success": true,
  "data": {
    "trip_id": "new-trip-uuid",
    "message": "Trip copied to your account",
    "copied_from": "original-trip-uuid"
  }
}
```

---

# MODULE 11: Community (`/api/v1/community`)

## GET `/community/posts`

**Auth:** JWT | **Query:** `?q=paris&destination_id=uuid&sort=recent&limit=20&offset=0`

```json
{
  "success": true,
  "data": [
    {
      "id": "post-uuid-1",
      "title": "My Amazing Paris Experience",
      "content": "We spent 5 wonderful days in Paris...",
      "author": {
        "id": "user-uuid",
        "first_name": "Shakti",
        "last_name": "K.",
        "avatar_url": "http://localhost:3000/uploads/avatar.jpg"
      },
      "destination": { "id": "dest-uuid", "name": "Paris", "country": "France" },
      "activity": null,
      "media": [
        { "id": "media-uuid", "url": "http://localhost:3000/uploads/photo1.jpg", "display_order": 0 }
      ],
      "reactions_count": { "like": 12, "love": 5, "inspire": 3, "helpful": 1 },
      "comments_count": 8,
      "user_reaction": "like",
      "created_at": "2026-08-20T10:00:00.000Z"
    }
  ],
  "meta": { "pagination": { "total": 42, "limit": 20, "offset": 0, "has_more": true } }
}
```

## POST `/community/posts`

**Auth:** JWT | **Audit:** `POST_CREATED`

**Request:**
```json
{
  "title": "My Amazing Paris Experience",
  "content": "We spent 5 wonderful days in Paris exploring...",
  "trip_id": "trip-uuid",
  "destination_id": "dest-uuid",
  "activity_id": null,
  "visibility": "public"
}
```

## GET `/community/posts/:postId`

**Auth:** JWT

Full post with comments and reactions.

```json
{
  "success": true,
  "data": {
    "id": "post-uuid-1",
    "title": "My Amazing Paris Experience",
    "content": "Full content here...",
    "author": { "id": "user-uuid", "first_name": "Shakti", "avatar_url": "..." },
    "destination": { "id": "dest-uuid", "name": "Paris" },
    "media": [
      { "id": "media-uuid", "url": "http://localhost:3000/uploads/photo1.jpg", "display_order": 0 }
    ],
    "reactions_count": { "like": 12, "love": 5, "inspire": 3, "helpful": 1 },
    "user_reaction": "like",
    "comments": [
      {
        "id": "comment-uuid-1",
        "author": { "id": "user-2", "first_name": "Priya", "avatar_url": "..." },
        "content": "This looks incredible!",
        "parent_comment_id": null,
        "replies": [
          {
            "id": "comment-uuid-2",
            "author": { "id": "user-uuid", "first_name": "Shakti" },
            "content": "Thank you! It really was.",
            "parent_comment_id": "comment-uuid-1",
            "created_at": "2026-08-20T11:30:00.000Z"
          }
        ],
        "created_at": "2026-08-20T11:00:00.000Z"
      }
    ],
    "created_at": "2026-08-20T10:00:00.000Z"
  }
}
```

## POST `/community/posts/:postId/comments`

**Auth:** JWT | **Audit:** `COMMENT_CREATED`

```json
{
  "content": "This looks incredible!",
  "parent_comment_id": null
}
```

## POST `/community/posts/:postId/react`

**Auth:** JWT | **UNIQUE constraint per user**

```json
{
  "reaction_type": "like"
}
```

**Response (201):**
```json
{ "success": true, "data": { "reaction_type": "like", "total_reactions": 13 } }
```

## GET `/community/trending`

Trending based on **real analytics data**.

```json
{
  "success": true,
  "data": {
    "trending_destinations": [
      { "id": "dest-uuid", "name": "Paris", "post_count": 45, "image_url": "..." }
    ],
    "recent_posts": [ ... ]
  }
}
```

---

# MODULE 12: Uploads (`/api/v1/uploads`)

## POST `/uploads/image`

**Auth:** JWT | **Audit:** `FILE_UPLOADED` | **Rate Limit:** 20/hr/user

**Request:** `multipart/form-data` with field `image`

**Restrictions:**
```text
Max size:      5MB
Allowed types: image/jpeg, image/png, image/webp
Validation:    Magic bytes check (not just Content-Type header)
Filename:      Server-generated UUID (original name stored but never used for path)
```

**Success Response (201):**
```json
{
  "success": true,
  "data": {
    "id": "file-uuid",
    "url": "http://localhost:3000/uploads/a1b2c3d4.jpg",
    "original_filename": "my_photo.jpg",
    "mime_type": "image/jpeg",
    "file_size": 2456789
  }
}
```

> **NEVER returned:** `storage_key`, `checksum`, `owner_user_id`

## DELETE `/uploads/:fileId`

**Auth:** JWT | **Ownership check** | **Audit:** `FILE_DELETED`

```json
{ "success": true, "data": { "message": "File deleted" } }
```

---

# MODULE 13: Admin (`/api/v1/admin`)

All admin endpoints require `role = 'admin'` in JWT.

## GET `/admin/stats`

```json
{
  "success": true,
  "data": {
    "total_users": 1250,
    "total_trips": 3456,
    "completed_trips": 1200,
    "active_trips": 890,
    "total_community_posts": 567,
    "total_expenses_amount": 45000000.00,
    "registrations_last_30_days": 89,
    "trips_created_last_30_days": 234
  }
}
```

## GET `/admin/users`

**Query:** `?q=shakti&role=user&limit=20&offset=0`

```json
{
  "success": true,
  "data": [
    {
      "id": "user-uuid",
      "email": "shakti@example.com",
      "first_name": "Shakti",
      "last_name": "Kumar",
      "role": "user",
      "email_verified": true,
      "trips_count": 5,
      "created_at": "2026-08-22T12:00:00.000Z"
    }
  ],
  "meta": { "pagination": { "total": 1250, "limit": 20, "offset": 0, "has_more": true } }
}
```

## GET `/admin/users/:userId/trips`

**Auth:** Admin only

```json
{
  "success": true,
  "data": [
    {
      "id": "trip-uuid",
      "title": "European Adventure",
      "status": "planned",
      "start_date": "2026-09-01",
      "stops_count": 3,
      "total_expenses": 45000.00,
      "created_at": "2026-08-22T12:00:00.000Z"
    }
  ]
}
```

## GET `/admin/trips`

**Auth:** Admin only | **Query:** `?user_id=uuid&status=completed&destination=Paris&limit=20`

```json
{
  "success": true,
  "data": [
    {
      "id": "trip-uuid",
      "title": "European Adventure",
      "user": { "id": "user-uuid", "email": "shakti@example.com", "first_name": "Shakti" },
      "status": "planned",
      "start_date": "2026-09-01",
      "stops_count": 3,
      "created_at": "2026-08-22T12:00:00.000Z"
    }
  ]
}
```

## GET `/admin/destinations/popular`

Calculated from **real user data** (trip_stops counts), not static `popularity_score`.

```json
{
  "success": true,
  "data": {
    "period": "last_30_days",
    "destinations": [
      { "id": "dest-uuid", "name": "Paris", "country": "France", "trip_count": 142 },
      { "id": "dest-uuid", "name": "Tokyo", "country": "Japan", "trip_count": 98 }
    ]
  }
}
```

## GET `/admin/analytics/trends`

Calculated from `analytics_events` table.

```json
{
  "success": true,
  "data": {
    "period": "last_30_days",
    "top_searched_destinations": [
      { "destination": "Paris", "search_count": 456 }
    ],
    "top_viewed_activities": [
      { "activity": "Eiffel Tower Visit", "view_count": 234 }
    ],
    "user_engagement": {
      "trips_created": 234,
      "trips_completed": 45,
      "posts_created": 67,
      "shares_created": 89
    }
  }
}
```

## GET `/admin/audit-logs`

**Query:** `?action=LOGIN_FAILED&user_id=uuid&limit=50`

```json
{
  "success": true,
  "data": [
    {
      "id": "log-uuid",
      "action": "LOGIN_FAILED",
      "actor_user_id": null,
      "resource_type": "auth",
      "ip_address": "192.168.1.1",
      "request_id": "req_abc123",
      "metadata": { "email": "attacker@example.com", "reason": "invalid_password" },
      "created_at": "2026-08-22T12:00:00.000Z"
    }
  ]
}
```

## PATCH `/admin/users/:userId/role`

**Audit:** `ADMIN_ROLE_CHANGED`

```json
{ "role": "admin" }
```

## DELETE `/admin/users/:userId`

**Audit:** `ADMIN_USER_DELETED`

## DELETE `/admin/community/posts/:postId`

**Audit:** `POST_DELETED`

---

# Endpoint Summary (75 Endpoints)

| Module | Count | Endpoints |
|---|---|---|
| Auth | 7 | register, login, refresh, logout, forgot-password, reset-password, verify-email |
| Users | 5 | me(GET), me(PATCH), me(DELETE), me/password, me/stats |
| Trips | 6 | list, create, get, update, delete, full |
| Stops | 6 | list, create, get, update, delete, reorder |
| Sections | 6 | list, create, get, update, delete, reorder |
| Destinations | 7 | search, get, popular, countries, save, unsave, saved |
| Activities | 4 | search, get, by-destination, categories |
| Itinerary | 7 | list, create-item, update-item, delete-item, reorder, calendar, timeline |
| Budget | 7 | summary, breakdown, daily, by-section, add-expense, update-expense, delete-expense |
| Sharing | 4 | share, view, copy, revoke |
| Community | 15 | posts-list, create, view, update, delete, add-media, remove-media, comments-list, add-comment, update-comment, delete-comment, react, unreact, trending, my-posts |
| Uploads | 2 | upload, delete |
| Admin | 12 | stats, users, user-trips, all-trips, user-role, delete-user, popular-dests, popular-activities, community-posts, delete-post, analytics, audit-logs |
| **Total** | **88** | |
