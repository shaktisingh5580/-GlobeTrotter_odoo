# GlobeTrotter Monorepo

GlobeTrotter is a high-performance, enterprise-grade AI-powered smart travel planning, trip management, budgeting, and community platform built for scale, resilience, and multi-tenant security.

---

## 🏗️ Repository Architecture

```text
oddo/
├── backend/            # NestJS 10 + PostgreSQL 16 + Prisma 6 + Passport JWT + RLS
├── frontend/           # Client Application Workspace (React/Next.js UI)
├── dashboard/          # Admin Operations & Telemetry Dashboard Workspace
├── docs/               # Master Technical Specifications, Schemas & API Contracts
│   ├── database_design.md
│   ├── security_layer.md
│   ├── api_design.md
│   ├── phases.md
│   ├── GlobeTrotter_Frontend_Master_Engineering_Playbook.md
│   └── GlobeTrotter_Master_Engineering_Hackathon_Playbook.md
└── .gitignore          # Root-level security and build ignore rules
```

---

## 🚀 Getting Started with Backend

### 1. Prerequisites
- Node.js 20+
- Docker & Docker Compose (for PostgreSQL 16)

### 2. Environment Setup
```bash
cd backend
cp .env.example .env
```

### 3. Start Database Container
```bash
docker-compose up -d
```

### 4. Run Migrations, RLS Policies & Seed Data
```bash
npx prisma migrate dev
npx ts-node prisma/seed.ts
```

### 5. Start Development Server
```bash
npm run start:dev
```

### 6. Run Test Suites
```bash
npm test
```

---

## 🔒 Security Architecture Highlights
- **Row-Level Security (RLS)**: PostgreSQL systematic tenant isolation with `FORCE RLS` on sensitive tables.
- **Defense-in-Depth Pipeline**: 16-tier middleware/guard/interceptor/filter pipeline.
- **Deep Magic Bytes Validation**: Prevents script execution disguised as JPEG/PNG/WebP uploads.
- **Family Reuse Detection**: Refresh tokens rotated on use; replay attacks immediately terminate all active family sessions.
- **Zero-Leaking Error Sanitization**: Maps internal database exceptions to clean sanitized JSON envelopes.

---

## 👥 Team Collaboration
- **Frontend Development**: See [frontend/README.md](frontend/README.md)
- **Admin Dashboard**: See [dashboard/README.md](dashboard/README.md)
- **API & Architecture Specifications**: See [docs/](docs/)
