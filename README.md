<h1 align="center">🌳 Wisdom Tree Academy</h1>

<p align="center">
  <b>Offline-First School Management &amp; Diagnostic Assessment System</b><br>
  A production-ready desktop client for student registry, attendance tracking, question bank curation, and diagnostic assessments (Nursery–Grade 5).
</p>

<p align="center">
  <img src="https://img.shields.io/badge/Electron-Desktop-47848F?logo=electron&logoColor=white" alt="Electron">
  <img src="https://img.shields.io/badge/React-19-61DAFB?logo=react&logoColor=black" alt="React 19">
  <img src="https://img.shields.io/badge/SQLite-Local%20DB-003B57?logo=sqlite&logoColor=white" alt="SQLite">
  <img src="https://img.shields.io/badge/Vite-8-646CFF?logo=vite&logoColor=white" alt="Vite 8">
  <img src="https://img.shields.io/badge/Node-%E2%89%A520.18.0-339933?logo=node.js&logoColor=white" alt="Node">
</p>

## What this is

Wisdom Tree Academy is a client application that turns a single desktop machine into a full school registry and diagnostic assessment station — no internet connection required. It runs entirely against a local **SQLite** database, syncing to a cloud **Supabase** instance only when connectivity is available.

The core workflow (registry → attendance → assessment → reporting) is grade-band agnostic and can be reconfigured for any Nursery–Grade 5 curriculum. Cloud sync is built on Supabase but the schema is documented so the sync layer can be swapped for another Postgres-compatible backend.

```
 Login            Registry              Assessment              Sync
   |                  |                      |                     |
   v                  v                      v                     v
Role check      Add/edit students     Question bank +        Queue changed
(Admin/Teacher) grade filtering       assessment runner       rows offline
   |                  |                      |                     |
   v                  v                      v                     v
Session ready   Attendance ledger    Aggregate reports      Push to Supabase
                Present/Absent/Late  PDF report cards       when connected
```

## Prerequisites

- [Node.js](https://nodejs.org/) `v20.18.0` or later
- A C/C++ build toolchain for native module compilation (`better-sqlite3` builds against it — Visual Studio Build Tools on Windows)
- Optional: a [Supabase](https://supabase.com/) project if you intend to enable cloud synchronization — see the [Sync Guide](./docs/SYNC_GUIDE.md)

## Quick start

### 1. Clone the repository

```bash
git clone https://github.com/AbdurRehman-eng/WisdomTreeAcademy-DesktopApp.git
cd WisdomTreeAcademy-DesktopApp
```

### 2. Install and run the desktop app

```bash
cd desktop

# Installs dependencies and automatically builds better-sqlite3 native bindings
npm install

# Launches the Electron + React dev build
npm run dev
```

### 3. Seed the local database (first run only)

The database is auto-generated on first launch with default admin/teacher accounts and grade/subject data. Console scripts and custom seeding commands are documented in the [Administrator Setup Guide](./docs/ADMIN_GUIDE.md).

### 4. (Optional) Enable cloud sync

Follow the [Cloud Synchronization Manual](./docs/SYNC_GUIDE.md) to point the app at a Supabase project, apply the Postgres schema, and configure Row Level Security policies.

## File structure

```
WisdomTreeAcademy-DesktopApp/
├── desktop/                    # Electron + React + SQLite production client app
│   ├── db/                     # Database schema definitions and seeding SQL
│   ├── src/                    # React 19 UI, context providers, and screens
│   ├── utils/                  # Cryptographic hashing & licensing helpers (CommonJS)
│   ├── tests/
│   │   └── unit/               # Vitest suite for crypto/licensing helpers
│   ├── public/
│   │   └── templates/          # Sample question CSV and report HTML templates
│   ├── main.cjs                # Electron main process backend controller
│   ├── preload.cjs             # Secure context-isolation IPC bridge
│   └── vite.config.mjs         # Vite configuration with Node test environments
├── owner-dashboard/            # React 19 + Vite 8 standalone owner dashboard web app
├── prototype/                  # Legacy interactive web prototype (isolated)
├── docs/
│   ├── ADMIN_GUIDE.md          # Setup, deployment packaging, DB console scripts
│   ├── TEACHER_GUIDE.md        # Attendance, MCQs, and assessment runner manual
│   ├── DEVELOPER_GUIDE.md      # IPC channel map, SQLite entity-relations, Vite/Vitest config
│   ├── SYNC_GUIDE.md           # Supabase setup, Postgres schema, RLS policies
│   ├── INSTALLATION_GUIDE.md   # Setup wizard, database backup and restore
│   └── OWNERSHIP_TRANSFER.md   # Account transfer and post-handoff security protocol
└── tests/                      # System integration test scripts
```

## How the assessment pipeline works

The **Assessment Setup & Runner** is the core module teachers interact with day to day:

1. **Setup** — a teacher selects a grade and question set from the Question Bank Manager, which stores each question's options as schema-compliant SQLite JSON.
2. **Run** — the child-facing runner presents large, responsive option cards with micro-animations and an integrated text-to-speech read-aloud prompt, so pre-readers can complete the assessment independently.
3. **Score** — responses are written to SQLite as they're answered, so a mid-assessment crash or restart never loses progress.
4. **Aggregate** — the Reporting Center computes real-time grade-level averages and generates printable report cards or PDF transcripts.
5. **Sync** — once online, changed rows are queued and pushed to the Supabase-backed cloud database, validated against an offline cryptographic license key.

### What makes this workflow different

- **Offline-first by construction, not by fallback.** Every module writes to local SQLite first; cloud sync is a queue that drains opportunistically, so a school with unreliable internet never blocks on it.
- **Child-appropriate assessment UX.** Large touch targets, TTS read-aloud, and micro-animation feedback are built into the runner itself rather than bolted on, since the target users (Nursery–Grade 5) can't reliably navigate a standard form UI.
- **License-gated sync, not license-gated usage.** The cryptographic license check governs cloud synchronization only — the offline core (registry, attendance, assessments, reporting) works fully without a valid key, so a lapsed license degrades gracefully instead of locking teachers out mid-term.

## Testing

Cryptographic and licensing helpers are covered by a **Vitest** suite running in a Node test environment.

```bash
cd desktop
npm run test:unit
```

**Expected output:**

```
 ✓ tests/unit/helpers.test.js (5 tests) 11ms

   Test Files  1 passed (1)
        Tests  5 passed (5)
```

## Customization

### Which files to edit manually

| File | What to change |
|---|---|
| `desktop/db/*.sql` | Schema definitions and seed data for students, attendance, and question banks |
| `desktop/src/index.css` | HSL theme tokens for the dark "space slate" and light glassmorphic modes |
| `desktop/utils/` | Password hashing (PBKDF2) and license-validation logic |
| `docs/SYNC_GUIDE.md` | Supabase project connection details and RLS policy definitions |

### Design system

- **HSL-based theme tokens** — deep indigo, purple, and success-emerald gradients across dark and light modes
- **Glassmorphism & depth** — `backdrop-filter: blur(12px)`, layered box-shadows, and double-border styling
- **Micro-animations** — hover elevation, sliding navigation indicators, and fluid active-state transitions
- **Custom window chrome** — OS-integrated desktop titlebar controls and tailored pagination components

## Documentation

| Guide | Description |
|---|---|
| 🛡️ [Administrator Setup Guide](./docs/ADMIN_GUIDE.md) | Installer packaging, database consoles, seeding, and licensing algorithms |
| 🎓 [Teacher User Manual](./docs/TEACHER_GUIDE.md) | Logging attendance, creating audio prompts, and running diagnostic assessments |
| 💻 [Developer Technical Guide](./docs/DEVELOPER_GUIDE.md) | IPC event map, SQLite entity relations, and Vite/Vitest configuration |
| 🔄 [Cloud Synchronization Manual](./docs/SYNC_GUIDE.md) | Supabase schema setup, API configuration, and Row Level Security policies |
| 💿 [Installation & Troubleshooting Guide](./docs/INSTALLATION_GUIDE.md) | Setup wizard walkthrough, database backup, and restoration |
| 🎁 [Ownership Handoff Checklist](./docs/OWNERSHIP_TRANSFER.md) | Account transfer, licensing administration, and post-handoff security protocols |

## Tech stack

| Layer | Technology |
|---|---|
| Runtime | Electron |
| UI | React 19, Vite 8 |
| Local Database | SQLite (`better-sqlite3` native bindings) |
| Cloud Sync Target | Supabase (Postgres + PostgREST) |
| Testing | Vitest |
| Security | PBKDF2 password hashing, HMAC-SHA256 license validation |
