# ClubPulse — System Architecture & Data Flow

```
┌────────────────────────────────────────────────────────────────────────┐
│                        NEXT.JS FRONTEND (CLIENT)                       │
│                                                                        │
│  ┌───────────────────────┐  ┌─────────────────┐  ┌──────────────────┐  │
│  │   Student Dashboard   │  │ Leader Dashboard│  │ Admin Dashboard │  │
│  └───────────┬───────────┘  └────────┬────────┘  └────────┬─────────┘  │
│              │                       │                    │            │
│              └───────────────────────┼────────────────────┘            │
│                                      ▼                                 │
│                    Live MongoDB-backed data only                       │
│                    Signed HTTP-only session                            │
│                    Role-aware API requests                             │
└────────────────────┼───────────────────────────────────────────────────┘
                     │ HTTP JSON Requests
                     ▼
┌────────────────────────────────────────────────────────────────────────┐
│                     NEXT.JS BACKEND (API ROUTES)                       │
│                                                                        │
│    /api/auth/*     /api/clubs      /api/tasks      /api/analytics      │
│    /api/members    /api/evidence   /api/feedback   /api/availability   │
│         │               │               │               │              │
│         ▼               ▼               ▼               ▼              │
│  ┌──────────────────────────────────────────────────────────────────┐  │
│  │                  FairWork Engine (src/lib/fairwork.js)           │  │
│  │  - Ghost Member Detection       - Burnout Risk Calculations     │  │
│  │  - Workload Concentration Index - Redistribution Recommendations │  │
│  └──────────────────────────────────┬───────────────────────────────┘  │
│                                     │                                  │
│                                     ▼                                  │
│                          Database Access Layer                         │
│                             (src/lib/db.js)                            │
│                     - Mongoose Connection Caching                      │
│                     - Lean Query Execution                             │
└─────────────────────────────────────┼──────────────────────────────────┘
                                      │ Mongoose Driver (TLS/SSL)
                                      ▼
┌────────────────────────────────────────────────────────────────────────┐
│                     MONGODB ATLAS (DATABASE CLOUD)                     │
│                                                                        │
│  Database: clubpulse_v2                                                │
│                                                                        │
│  Collections:                                                          │
│  • users            • clubs          • memberships    • tasks          │
│  • contributions    • availability   • feedback       • applications   │
│  • notifications    • auditlogs      • events          • evidence       │
└────────────────────────────────────────────────────────────────────────┘
```

---

## Technical Stack Justifications

| Component | Selected Technology | Engineering Rationale |
|---|---|---|
| **Framework** | Next.js 16.4.2 (App Router) | Unified TypeScript/JavaScript full-stack structure with fast serverless route handlers and SEO-friendly static landing pages. |
| **UI Library** | React 19.3.0 | Modern concurrent React rendering with native hooks (`useCallback`, `useMemo`, `useContext`). |
| **Styling** | Tailwind CSS v4 | High-performance CSS compiling with zero runtime overhead, responsive utility tokens, and dark theme support. |
| **Database** | MongoDB Atlas (`clubpulse_v2`) | Document store supporting flexible nested schemas (e.g. leave details, evidence arrays) without heavy multi-table SQL joins. |
| **Authentication** | Firebase Auth + Session Cookies | Industry-standard identity provider supporting Google OAuth & email/password verification without plaintext password vulnerabilities. |
| **Icons** | Lucide React | Modern, crisp SVG vector icons matching university enterprise design guidelines. |
