# Wisdom Tree Academy — Standalone Owner Dashboard

This standalone web-based dashboard is built for school chain owners to monitor all franchises, review diagnostic transcripts, track attendance, and manage the central evaluation question bank remotely.

It communicates directly with the cloud database via the **Supabase REST API** client.

---

## Technical Stack
- **Framework:** React 19 + Vite 8
- **Styling:** CSS Design System (co-located glassmorphic styling)
- **Database Client:** `@supabase/supabase-js` (REST client wrapper)
- **Icons:** `lucide-react`

---

## Features
1. **Secure Gatekeeper:** Key/connection based login where credentials persist locally.
2. **Franchise Overview:** Aggregated KPIs including pupil enrollment, overall attendance rate, assessment volume, and active staff counts.
3. **Candidate Registry:** Read-only view of synced students across all schools.
4. **Diagnostic Transcripts:** Modal-based visual evaluation breakdown showing correct/incorrect answers for each question.
5. **Staff Directory:** Roster details of registered administrators and teachers.
6. **Central Question Bank CRUD Manager:** Remote CRUD interface allowing the owner to add, edit, or delete MCQs directly in the central cloud database.

---

## Local Development Setup

To run the Owner Dashboard on your local machine:

1. Navigate to the dashboard directory:
   ```bash
   cd owner-dashboard
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Start the development server:
   ```bash
   npm run dev
   ```

4. Open your browser and navigate to the printed URL (typically `http://localhost:5174`).

---

## Production Build & Static Deployment

The app compiles into a static website inside the `dist/` directory, which can be deployed to any static host (e.g. Vercel, Netlify, Github Pages, or Supabase Hosting) for free.

1. Build the production assets:
   ```bash
   npm run build
   ```

2. Deploy the contents of the `dist/` folder to your provider of choice.

### Deploying to Vercel (CLI Example)
If you have the Vercel CLI installed, you can deploy instantly:
```bash
npx vercel --prod
```

### Credentials & Security
- The application stores the Supabase connection keys (Project URL and Anon API Key) in the user's browser `localStorage`.
- Security is handled at the database level using Supabase Row Level Security (RLS) policies.
- In production, it is recommended to set up read-only database roles for public dashboard users, or implement custom authentication policies.
