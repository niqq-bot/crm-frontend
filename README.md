# Logic-Q1 CRM — Frontend Application

Production-grade B2B SaaS CRM frontend built with React 18, TypeScript, Vite, Tailwind CSS, TanStack Query, and Lucide React. Designed with inspiration from modern SaaS interfaces like Linear, Attio, and Stripe Dashboard.

---

## 🚀 Key Features

### 1. Architectural Foundations & Design
- **Linear & Attio Aesthetic**: Clean typography (Inter), refined slate/zinc borders, consistent status tokens, collapsible sidebar, subtle elevations.
- **Theme Support**: Seamless Light & Dark mode support with persistent user preference.
- **Zero UUID Exposure**: Users never interact with raw database IDs. The `EntitySelect` combobox displays human-readable labels (e.g. `Rahul Sharma — rahul@acme.com`) while transparently submitting UUIDs to backend DTOs.
- **Strict One-User-Per-Organization Rule**:
  - Automatically verifies organization affiliation upon login via `GET /auth/me`.
  - Unaffiliated users (`orgId === null`) are redirected to `/onboarding` to initialize a workspace via `POST /organization/create` or accept an invite token.
  - Affiliated users are routed directly to `/dashboard` and blocked from creating duplicate organizations.
- **Zero Watchlist Exposure**: As mandated, all Watchlist endpoints, UI components, hooks, and navigation items are completely excluded.

---

### 2. Core CRM Modules

#### **Leads (`/leads`)**
- **List & Board Views**: Fast toggle between a responsive data table and Kanban board, persisted across sessions.
- **Dedicated Status Action**: Direct status-change dropdown on table rows, board cards, and details modal (`NEW`, `CONTACTED`, `QUALIFIED`, `LOST`, `CONVERTED`) without opening the full edit form.
- **Convert to Contact**: One-click lead conversion calling `POST /api/leads/{id}/convert-to-contact`.
- **Direct Mail**: In-app mail composition dialog calling `POST /api/leads/send-mail`.

#### **Deals (`/deals`) — Board View Only**
- **Strict Board View**: Implemented strictly as a Kanban pipeline across all 8 backend stages:
  1. `QUALIFICATION`
  2. `NEEDS_ANALYSIS`
  3. `VALUE_PROPOSITION`
  4. `IDENTIFY_DECISION_MAKERS`
  5. `PROPOSAL_PRICE_QUOTE`
  6. `NEGOTIATION_REVIEW`
  7. `CLOSED_WON`
  8. `CLOSED_LOST`
- **Drag-and-Drop Stage Changes**: Native drag-and-drop between columns with optimistic UI updates and automatic rollback on network failure. Calls `PUT /api/deals/{id}` while preserving existing deal attributes.
- **Accessible Stage Transition**: Inline dropdown control on each card for keyboard and touch devices.
- **Metrics Summary**: Real-time calculated Total Pipeline Value, Weighted Expected Revenue, and Opportunity count.

#### **Tasks (`/tasks`)**
- **List & Board Views**: Grouped by statuses (`NOT_STARTED`, `IN_PROGRESS`, `WAITING_FOR_INPUT`, `COMPLETED`, `DEFERRED`) and priorities (`LOWEST` to `HIGHEST`).
- **Dedicated Status Action**: Direct status change dropdown on rows and cards calling `PATCH /task/{id}/move`.
- **Entity Linking**: Searchable selectors to link tasks to contacts and leads without UUID typing.

#### **Contacts (`/contacts`)**
- **Directory**: Full contact table with search, department filtering, and detailed drawer.
- **CSV Data Exchange**: CSV Import (`POST /contact/import`) and CSV Export (`GET /contact/export`).

#### **Management & Security**
- **Organizations (`/manage/organizations`)**: Directory of organizations with active workspace badge and `POST /organization/create`.
- **Users (`/manage/users`)**: Paginated team directory, status activation/deactivation toggles (`PATCH /api/users/{id}/activate`, `/deactivate`), and profile editor (no password exposure).
- **Invitations (`/manage/invitations`)**: Generate invitation links with readable roles (`POST /api/organization/invites`) and test tokens (`GET /api/organization/invites/{token}`).
- **Activity Timeline (`/activity`)**: Paginated workspace audit feed (`GET /api/activity-timeline/organization`) and entity-level timelines.

#### **Dashboard (`/dashboard`)**
- Real-time KPI cards: Total Active Pipeline, Weighted Expected Revenue, Total Leads, Tasks Due Today.
- Recharts visualizations: Deal Stage Value Distribution and Lead Qualification Breakdown.
- Tasks Requiring Attention list and Workspace Audit Feed.
- Global Quick-Create actions.

---

## 🛠️ Technology Stack

| Layer | Library / Tool |
|---|---|
| **Framework** | React 18, TypeScript, Vite 6 |
| **Styling** | Tailwind CSS, clsx, tailwind-merge |
| **Icons & UI** | Lucide React, Sonner (toast notifications) |
| **Routing** | React Router DOM v7 |
| **Data Fetching** | TanStack Query v5, Axios |
| **Charts** | Recharts v2 |
| **Date Handling** | date-fns v4 |

---

## ⚙️ Environment Configuration

Set the backend API base URL in `.env`:

```env
VITE_API_BASE_URL=http://3.85.210.31:8000
```

---

## 🏃 Running the Application

### Development Mode
```bash
npm run dev
```

### Production Build
```bash
npm run build
```

### Production Preview
```bash
npm run preview
```
