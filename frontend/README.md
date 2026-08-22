# GlobeTrotter Frontend Workspace

Welcome to the **GlobeTrotter Client Application** workspace.

## 📌 Architecture & Design System Reference
For full wireframes, 12-screen UI requirements, design tokens, state management guidelines, and API contract bindings, refer to the master playbooks:
- [Frontend Master Engineering Playbook](../docs/GlobeTrotter_Frontend_Master_Engineering_Playbook.md)
- [API Design Specification](../docs/api_design.md)
- [Security & Authentication Guidelines](../docs/security_layer.md)

---

## 🎨 Design System & Visual Identity
- **Primary Palette**: Deep Navy / Indigo (`#0F172A`, `#1E293B`), Emerald Green Accent (`#10B981`), Amber Warning (`#F59E0B`), Coral Danger (`#EF4444`).
- **Typography**: Inter / Outfit (Clean modern sans-serif).
- **Styling Preference**: Modern responsive UI with smooth transitions, glassmorphism cards, and interactive feedback.

---

## 🚀 Recommended Tech Stack
- **Framework**: React 18+ / Next.js (App Router) or Vite + React
- **State Management**: Zustand / TanStack Query (React Query)
- **Forms & Validation**: React Hook Form + Zod
- **Icons**: Lucide Icons / Heroicons
- **HTTP Client**: Axios with standard Authorization header interceptor (`Bearer <access_token>`) and automatic token rotation on 401.

---

## 🔌 API Base URL & Integration
- **Backend Base URL**: `http://localhost:3000/api/v1`
- **Authentication**: JWT Bearer token in `Authorization: Bearer <token>`
- **Response Envelope**:
  ```json
  {
    "success": true,
    "data": { ... },
    "meta": {
      "request_id": "req_...",
      "timestamp": "2026-08-22T14:00:00.000Z"
    }
  }
  ```

---

## 📂 Key Screen Mappings
1. **Screen 1**: Splash / Welcome / Value Proposition
2. **Screen 2**: Multi-Step Registration (Email, Password, Name, Bio / Info)
3. **Screen 3**: Login & Password Recovery
4. **Screen 4**: Main Dashboard / Home (Ongoing, Upcoming, Past Trips Summary)
5. **Screen 5**: Explore Destinations & Curated Recommendations
6. **Screen 6**: Destination Details & Nearby Activities
7. **Screen 7**: Trip Creation Modal / Page (Dates, Title, Budget, Cover Image)
8. **Screen 8**: Trip Overview & Stop Itinerary (Draggable / Ordered Stop List)
9. **Screen 9**: Daily Itinerary Builder (Activity Timeline, Custom Items)
10. **Screen 10**: Budget & Expense Tracker (Categories, Visual Breakdown)
11. **Screen 11**: Community Feed & Travel Stories
12. **Screen 12**: User Profile & Account Settings
