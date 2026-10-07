# NovaWorks AI Project Manager
**Infinity Hack '26 | 4-Person Team Build**

NovaWorks AI Project Manager is a full-stack Project Management CRM designed to eliminate manual data entry after project kickoff meetings. The system takes raw meeting transcripts, analyzes discussions and final decisions using an LLM pipeline with strict directory constraints, validates business rules, and saves projects and tasks into the database within an atomic transaction.

Role-Based Access Control (RBAC) is strictly enforced at the data layer across every API endpoint.

---

## 🚀 Key Features

1. **AI Transcript-to-Project Extraction**
   - Extracts structured projects, client names, manager assignments, and developer tasks from messy meeting transcripts.
   - **Resolution Rules**: Final agreed decisions and recap values win over earlier superseded comments.
   - **Directory-Only Assignments**: Only existing internal employees from the team directory can be assigned. Outsiders (e.g. Kamran, clients, end users) are never assigned tasks or created as users.
   - **"Ignored by AI" Scope Filtering**: Rejected or out-of-scope features (payments, maps, driver tracking, live email alerts) are excluded from tasks and surfaced in the dedicated Ignored Scope panel.
   - **Zod & Business Rule Validation**: Validates manager roles, developer agent roles, calendar dates (YYYY-MM-DD), positive effort hours, and guarantees task deadlines do not exceed project deadlines.
   - **All-or-Nothing Atomic Transaction**: Saves all projects and tasks inside a single database transaction. If any validation fails, 0 records are written.

2. **Role-Based Access Control (RBAC)**
   - Enforced in `server/access.ts` at the data layer for every API request:
     - **ADMIN**: Complete oversight of all projects, tasks, and system settings. Only ADMIN can call `POST /api/transcript`.
     - **MANAGER**: Sees only projects they manage (`managerId == user.id`) and all tasks within their projects. Direct URL requests to another manager's project return `403 Forbidden`.
     - **AGENT**: Sees distinct projects containing tasks assigned to them. When viewing a project detail, the task table is filtered to show **only their assigned tasks**. Other developers' tasks remain hidden.
   - **Session Security**: HTTP-only signed cookie session using `jose` (JWT) with passwords hashed via `bcryptjs`. The active user is always extracted from the cryptographically verified session.

3. **Live Security & RBAC Auditor**
   - Built-in live test suite allowing judges to trigger real HTTP calls to `/api/*` endpoints and verify `401 Unauthorized`, `403 Forbidden`, and `200 OK` responses live in the browser.

---

## 👥 Demo Accounts (Credentials)

Default password for all demo accounts: **`Demo123!`**

| User ID | Name | Email | Role | Specialization |
|---|---|---|---|---|
| **ADMIN** | System Admin | `admin@novaworks.example` | ADMIN | Operations & Leadership |
| **PM01** | Ayesha Khan | `ayesha@novaworks.example` | MANAGER | E-Commerce & Web Platforms |
| **PM02** | Bilal Ahmed | `bilal@novaworks.example` | MANAGER | Mobile & Real-time Apps |
| **PM03** | Hina Malik | `hina@novaworks.example` | MANAGER | AI/ML Solutions & Integrations |
| **DEV01** | Ali Raza | `ali@novaworks.example` | AGENT | Frontend Engineering |
| **DEV02** | Hamza Shah | `hamza@novaworks.example` | AGENT | Backend & API Architecture |
| **DEV03** | Sara Noor | `sara@novaworks.example` | AGENT | Mobile UI/UX & Flutter |
| **DEV04** | Usman Tariq | `usman@novaworks.example` | AGENT | Mobile Integration & QA |
| **DEV05** | Zain Abbas | `zain@novaworks.example` | AGENT | AI Engineer & LangChain |
| **DEV06** | Maryam Asif | `maryam@novaworks.example` | AGENT | AI Evaluation & Document QA |

*Note: The top navigation bar includes an instant 1-Click Role Switcher so judges can quickly switch between personas.*

---

## 🛠️ Stack Architecture

- **Backend**: Express + TypeScript (`server.ts`) with Vite middlewares
- **Frontend**: React 19 + Tailwind CSS + Lucide Icons
- **Database & Storage**: Atomic transactional persistent storage engine with `prisma/schema.prisma` and `prisma/seed.ts`
- **Auth**: `jose` (JWT HTTP-only cookie session) + `bcryptjs` password hashing
- **AI Engine**: Gemini 3.8 Flash (`@google/genai`) with OpenRouter fallback cascade
- **Validation**: `zod` schema parsing + domain business logic verification

---

## 📦 Setup & Run Instructions

### 1. Environment Configuration
Copy `.env.example` to `.env`:
```bash
cp .env.example .env
```

Ensure variables are set:
```env
DATABASE_URL="sqlserver://localhost:1433;database=novaworks;user=sa;password=Demo123!;trustServerCertificate=true;encrypt=true"
SESSION_SECRET="novaworks-super-secret-jwt-key-2026-infinity-hack"
GEMINI_API_KEY="YOUR_GEMINI_API_KEY"
OPENROUTER_API_KEY="YOUR_OPENROUTER_KEY" # Optional fallback
```

### 2. Install Dependencies
```bash
npm install
```

### 3. Database Seed
To initialize or reset the 10 team member accounts idempotently:
```bash
npx tsx prisma/seed.ts
```

### 4. Start Development Server
```bash
npm run dev
```
The server starts on port `3000`.

---

## 🧪 Hackathon Test Key Verification

Running the **Official Hackathon Transcript** in the Admin Hub extracts exactly **3 projects** and **12 tasks**:

### 1. UrbanCart Website
- **Client**: UrbanCart Inc | **Manager**: PM01 Ayesha Khan | **Deadline**: **`2026-10-20`** (resolves 18 Oct discussion trap)
- **Product catalog UI**: DEV01 Ali Raza · `2026-10-12` · **12h**
- **Demo cart UI**: DEV01 Ali Raza · `2026-10-15` · **8h**
- **Product and cart APIs**: DEV02 Hamza Shah · `2026-10-14` · **14h**
- **Website integration and testing**: DEV01 Ali Raza · **`2026-10-19`** · **6h** (resolves 17 Oct discussion trap)
- *Total effort*: **40 hours**

### 2. QuickServe Mobile App
- **Client**: QuickServe Delivery Services | **Manager**: PM02 Bilal Ahmed | **Deadline**: `2026-10-24`
- **Login and profile screens**: DEV03 Sara Noor · `2026-10-12` · **8h**
- **Service booking screens**: DEV03 Sara Noor · `2026-10-17` · **12h**
- **Booking and account APIs**: DEV02 Hamza Shah · `2026-10-16` · **16h**
- **Mobile integration and testing**: DEV04 Usman Tariq · `2026-10-22` · **10h** (resolves 8h initial discussion trap)
- *Total effort*: **46 hours**

### 3. HelpDeskPro AI Assistant
- **Client**: HelpDeskPro Corp | **Manager**: PM03 Hina Malik | **Deadline**: `2026-10-22`
- **FAQ document processing**: DEV06 Maryam Asif · `2026-10-13` · **10h**
- **Assistant answer generation**: DEV05 Zain Abbas · `2026-10-17` · **14h**
- **Human escalation flow**: DEV05 Zain Abbas · `2026-10-18` · **6h**
- **Assistant evaluation and testing**: DEV06 Maryam Asif · `2026-10-21` · **8h** (resolves Zain initial suggestion trap)
- *Total effort*: **38 hours**

### Traps Passed:
- **Kamran Trap**: Not an internal employee; never assigned tasks.
- **Out-of-Scope Features**: Stripe payments, warehouse inventory, live maps, driver GPS tracking, SMTP automated emails are excluded and placed in the "Ignored by AI" panel.
- **Changed-Input Verification**: Using the "Changed-Input Test" button (QuickServe testing revised to 12h and 23 Oct) updates only that task, proving the AI is dynamic and not hardcoded.

---

## 🔒 Security & Access Testing Steps

1. **Test AGENT Ali Raza Project Privacy**:
   - Log in as DEV01 Ali (`ali@novaworks.example`).
   - Open `/api/projects/<UrbanCart_ID>`: returns 200, but the task table contains **only Ali's 3 tasks**. Hamza's API task is strictly filtered out.
   - Attempt to open QuickServe project directly via URL: returns `403 Forbidden`.
2. **Test Unauthorized Transcript Call**:
   - Log in as any Manager or Agent.
   - Call `POST /api/transcript`: returns `403 Forbidden: Access Denied: Only ADMIN can process meeting transcripts`.
3. **Test Manager Cross-Access**:
   - Log in as PM01 Ayesha (`ayesha@novaworks.example`).
   - Attempt to view Bilal's QuickServe project: returns `403 Forbidden`.

---

## ⚠️ Known Limitations
- The AI pipeline requires a valid API key (`GEMINI_API_KEY` or `OPENROUTER_API_KEY`).
- In environments without local Microsoft SQL Server, the application uses an atomic transactional file persistence engine while maintaining Prisma schema parity.
