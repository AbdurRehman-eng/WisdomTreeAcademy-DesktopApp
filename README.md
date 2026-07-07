# Wisdom Tree Academy: School Management & Diagnostic Assessment System

Wisdom Tree Academy is a production-ready, offline-first client application for school registry, attendance logging, question bank curation, and diagnostic child assessments (Nursery through Grade 5).

The system integrates a desktop client powered by **Electron** and **React 19** with a local **SQLite** database, supporting offline classrooms, and is ready for cloud database synchronization.

---

## 🛠️ Repository Architecture

The codebase has been reorganized into clean, modular workspaces:

```
├── desktop/                  # Electron + React + SQLite Production Client App
│   ├── db/                   # Database schema definitions and seeding SQL
│   ├── src/                  # React 19 UI, Context providers, and Screens
│   ├── utils/                # Cryptographic hashing & licensing helpers (CommonJS)
│   ├── main.cjs              # Electron main process backend controller
│   ├── preload.cjs           # Secure Context Isolation IPC Bridge
│   └── vite.config.mjs       # Vite configuration with Node test environments
├── owner-dashboard/          # React 19 + Vite 8 Standalone Owner Dashboard Web App
├── prototype/                # Legacy interactive web prototype (Isolated)
├── docs/                     # Guides and manuals
│   ├── ADMIN_GUIDE.md        # System setup, deployment packaging, and database console scripts
│   ├── TEACHER_GUIDE.md      # User manual for attendance, MCQs, and assessment runner
│   ├── DEVELOPER_GUIDE.md    # Process architectural flows, IPC channels, and schemas
│   └── SYNC_GUIDE.md         # Supabase setup, postgres SQL schema, and RLS policies
└── tests/                    # System integration testing scripts
```

## 🎨 Premium Glassmorphic UI/UX

The Wisdom Tree Academy user interface has been completely overhauled with a state-of-the-art visual style:
* **HSL-Tailored Theme Tokens**: Premium space slate dark mode and soft clean light mode tailored with deep indigo, purple, and success-emerald gradients.
* **Glassmorphism & Depth**: Backdrop filters (`backdrop-filter: blur(12px)`), double border styles, and rich, layered box-shadows.
* **Micro-Animations & Feedback**: Hover elevation offsets, smooth sliding navigation indicators, active selector animations, and fluid state changes.
* **Custom Window Chrome**: Fully custom OS-integrated desktop titlebar controls, responsive headers, and tailored database pagination components.

---

## 🧩 Core Application Modules

1. **Secure Login Portal:** Features role selections (Administrator vs. Teacher) validated against a local PBKDF2 hashed password table.
2. **Interactive Student Registry:** Allows full CRUD, filtering by grade level, and automatic offline status tracking.
3. **Registry Attendance Ledger:** Standard calendar tracker for Present/Absent/Late status pills with persistence and pending-sync indicators.
4. **Assessment Setup & Runner:** A child-friendly assessment panel featuring large responsive question option cards, micro-animations, and integrated Text-to-Speech (TTS) read-aloud prompts.
5. **Question Bank Manager:** Administrative question creator mapping options to schema-compliant SQLite JSON values.
6. **Aggregate Reporting Center:** Calculates real-time average metrics per grade and lets teachers print standard report card sheets or download PDF transcripts.
7. **Offline-First Synchronization Console:** Validates cryptographic license keys offline and queues changed database rows for synchronization when connected.

---

## 🚀 Quick Start Guide

### 1. Run the Desktop App (Local Dev Mode)
Ensure you have Node.js (version 20.18.0+) installed, then execute:
```bash
# Navigate to the desktop app folder
cd desktop

# Install dependencies (automatically builds better-sqlite3 native bindings)
npm install

# Start the desktop application
npm run dev
```

### 2. Run the Unit Test Suites
We use **Vitest** configured in a Node testing environment to test cryptographic security helpers:
```bash
cd desktop
npm run test:unit
```

All 5 cryptographic licensing and hashing helper unit tests execute and pass:
```bash
 ✓ tests/unit/helpers.test.js (5 tests) 11ms
   Test Files  1 passed (1)
        Tests  5 passed (5)
```

---

## 📖 System Manuals & Documentation

For details on configuration and usage, refer to our system manuals inside the `docs/` folder:

* 🛡️ **[Administrator Setup Guide](file:///d:/Projects/Fenella-G/docs/ADMIN_GUIDE.md)**: Installer packaging, database consoles, seeding, and cryptographic licensing algorithms.
* 🎓 **[Teacher User Manual](file:///d:/Projects/Fenella-G/docs/TEACHER_GUIDE.md)**: Logging student attendance, creating question audio prompts, and conducting diagnostic assessment runs.
* 💻 **[Developer Technical Guide](file:///d:/Projects/Fenella-G/docs/DEVELOPER_GUIDE.md)**: IPC communication events map, SQLite entity-relations, and Vite/Vitest configurations.
* 🔄 **[Cloud Synchronization Manual](file:///d:/Projects/Fenella-G/docs/SYNC_GUIDE.md)**: Supabase schema script setup, API configurations, and database Row Level Security policies.
* 💿 **[Installation & Troubleshooting Guide](file:///d:/Projects/Fenella-G/docs/INSTALLATION_GUIDE.md)**: Standard setup wizard guide, database backup and restoration instructions.
* 🎁 **[Product Ownership Handoff Checklist](file:///d:/Projects/Fenella-G/docs/OWNERSHIP_TRANSFER.md)**: Account transfers, licensing administration, and post-handoff security protocols.


