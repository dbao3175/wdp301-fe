# Manga Publishing Management System — Architecture Pack

Documentation for **WDP301** (React + TypeScript + Tailwind, Spring Boot + MySQL + JWT + RBAC).

| # | Document | Description |
|---|----------|-------------|
| 1 | [database-design.md](./database-design.md) | Tables, constraints, indexes |
| 2 | [erd.md](./erd.md) | Entity-relationship diagram (Mermaid) |
| 3 | [api-specification.md](./api-specification.md) | REST API, auth, WebSocket events |
| 4 | [frontend-pages.md](./frontend-pages.md) | Routes and pages per role |
| 5 | [component-architecture.md](./component-architecture.md) | UI component tree and contracts |
| 6 | [rbac-matrix.md](./rbac-matrix.md) | Role × permission matrix |
| 7 | [folder-structure.md](./folder-structure.md) | FE + BE folder layout |
| 8 | [state-management.md](./state-management.md) | Client state layers |
| 9 | [sequence-diagrams.md](./sequence-diagrams.md) | Proposal & production flows |
| 10 | [production-architecture.md](./production-architecture.md) | Deployment, security, evolution |

**SQL DDL:** [sql/schema.sql](./sql/schema.sql)

**Domain enums (FE):** `src/domain/enums.ts`

**Current FE:** Sandbox + optional Node/Mongo backend (`connectionMode: sandbox | backend`). Target stack: Spring Boot + MySQL per technical requirements.
