# Wisdom Tree Academy Diagnostic Assessment Software (Frontend UI/UX Prototype)

This repository contains a high-fidelity, modular, and fully interactive frontend UI/UX prototype for the **Wisdom Tree Academy Diagnostic Assessment Software**. 

This system acts as an offline-first school management and diagnostic assessment platform tailored for Nursery through Grade 5.

> [!IMPORTANT]
> **Handoff Disclaimer & Reusability Note**
> - This repository serves as a **design and interaction prototype** built in React + Vite + Vanilla CSS.
> - The production-grade offline client application is targeted to be built separately as a native Windows desktop app using **.NET (WPF or WinForms)** with an offline-first **SQLite** database.
> - The **Online Owner Dashboard** module designed here is web-native and its structure, styles, and layouts can directly carry over to the final cloud dashboard project.

---

## 🛠️ Tech Stack & Architecture

- **Core Framework**: React (Vite)
- **Styling**: Pure Vanilla CSS (using CSS Variables for structural and theme-level design tokens)
- **Icons**: Lucide React
- **Typography**: 
  - **Inter**: Clean, highly legible font for all administrative, class management, and data-dense dashboards.
  - **Poppins**: Rounded, friendly font with high readability for the child-facing assessment runner interface.

---

## 🎨 Theme & Appearance

The app implements a full, live-toggleable **Light Mode** and **Dark Mode**:
- **Light Mode**: Off-white background (`#F7F8FA`), deep education-blue primary (`#2E5AAC`), warm amber accent (`#F5A623`).
- **Dark Mode**: Deep navy-charcoal background (`#12161C`), lighter education-blue primary (`#5B8DEF`), warm amber accent (`#F5B84C`).
- **Child-Facing Screens**: Employs warm, encouraging pastel visual palettes, large touch-friendly panels, and smooth micro-animations.

---

## 📂 Core Screens Included

1. **Login Screen** - Features split branding and role selector (Admin vs. Teacher) which dynamically drives the application shell and dashboards.
2. **Dashboard (Admin)** - Metrics dashboards, sync status, and school-wide logs.
3. **Dashboard (Teacher)** - Simplified dashboards with class selectors and assessment quick-starts.
4. **Student Management** - Searchable/filterable listing tables and modal forms.
5. **Teacher & Admin Management** - Role configuration and credential panels.
6. **Class & Subject Management** - Drag-to-reorder layout for subjects.
7. **Question Bank Manager** - Rich filters, visual audio control components, and custom SVG audio waveforms.
8. **Assessment Runner** - Child-focused screen featuring large question cards, click-bouncing options, and read-aloud playback indicators.
9. **Assessment Setup** - Class, subject, and student selection flows.
10. **Assessment Results** - Dynamic score cards, strengths/weaknesses graphs, and report triggers.
11. **Attendance Module** - Student and Teacher calendars with present/absent/late toggles and attendance graphs.
12. **Reports Center** - Printable letterhead templates (A4 mock view) and file exporters.
13. **Sync & Settings** - Licensing validation controls and manual sync indicators.
14. **Online Owner Dashboard** - Distinct web browser mockup console displaying cloud metrics.

---

## 🚀 Running Locally

To launch the prototype, run the standard development commands:

```bash
# Install dependencies (React, Vite, Lucide React)
npm install

# Start the local development server
npm run dev
```
