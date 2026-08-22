# GlobeTrotter Admin Dashboard Workspace

Welcome to the **GlobeTrotter Admin Dashboard & Analytics** workspace.

## 📌 Reference Specifications
- [API Design Specification - Admin & Analytics](../docs/api_design.md)
- [Security Layer - RBAC & Audit Trails](../docs/security_layer.md)
- [Database Design Schema](../docs/database_design.md)

---

## 🛡️ Role-Based Access Control (RBAC)
- Only users with role `ADMIN` or `SUPER_ADMIN` can access administrative endpoints under `/api/v1/admin/*`.
- **Security Rule**: Requests from standard users to admin endpoints return `404 Not Found` (rather than 403) to prevent endpoint enumeration.

---

## 📊 Core Dashboard Modules & Endpoints
1. **User Management**:
   - `GET /api/v1/admin/users`: Search, filter by role/status, pagination.
   - `PATCH /api/v1/admin/users/:userId/role`: Promote/demote user roles.
   - `PATCH /api/v1/admin/users/:userId/status`: Suspend or reinstate user accounts.
2. **Trip & Content Moderation**:
   - `GET /api/v1/admin/trips`: Global trip listing and status audit.
   - `GET /api/v1/admin/community/posts`: Review flagged community posts and comments.
   - `DELETE /api/v1/admin/community/posts/:postId`: Remove policy-violating content.
3. **Destination & Activity Catalog Management**:
   - `POST /api/v1/destinations`: Add curated destinations.
   - `PATCH /api/v1/destinations/:destinationId`: Update descriptions, tags, and media.
   - `POST /api/v1/destinations/:destinationId/activities`: Add curated points of interest.
4. **Audit Trail & System Telemetry**:
   - `GET /api/v1/admin/audit-logs`: Immutable log of user creations, password changes, deletions, and security alerts.
   - `GET /api/v1/admin/analytics`: Aggregated user registration trends, active trip counts, and popular destinations.

---

## 🔌 API Base URL
- **Base URL**: `http://localhost:3000/api/v1`
- **Default Seed Admin**: `admin@globetrotter.internal` / `AdminSecretPass123!`
