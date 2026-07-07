# Wisdom Tree Academy: Product Ownership Handoff Checklist

This document details the critical developer-to-owner transfer tasks, infrastructure details, credentials, and administration protocols for the Wisdom Tree Academy application suite.

---

## 🔑 1. Repository & Source Code Control

- **Remote Git Repository:** `https://github.com/AbdurRehman-eng/WisdomTreeAcademy-DesktopApp`
- **Ownership Transfer Checklist:**
  - [ ] Add the owner's Github Account as an Admin Collaborator under **Settings → Collaborators**.
  - [ ] Transfer ownership of the repository to the owner's personal account or organization account via **Settings → General → Danger Zone → Transfer ownership**.
  - [ ] Set up repository branch protection rules for the `main` branch to require code reviews or green builds before merging.

---

## ☁️ 2. Cloud Infrastructure Administration (Supabase)

The ecosystem uses **Supabase (PostgreSQL + PostgREST)** as its cloud backend. To take full ownership of the cloud data layer:

1. **Account Transfer:**
   - Invitation of the owner's email address as an Organization Owner in the Supabase Dashboard under **Organization Settings → Members**.
   - The developer should leave the organization once the owner has accepted the invitation and verified billing setup.
2. **API Credentials:**
   - **Project URL:** `https://[ProjectRef].supabase.co`
   - **Anon API Key:** Public key used by clients (located under **Project Settings → API**).
   - **Service Role Secret Key:** *WARNING: Keep this hidden.* Only used for backend scripts or migration runners. Never embed in client code.
3. **Database Security (RLS):**
   - The tables `students`, `attendance`, `teachers_admins`, `question_bank`, and `assessments` have Row Level Security enabled.
   - Set up custom security rules or restrict key usage as needed in the Supabase SQL editor.

---

## 🔐 3. Licensing Key Generation & Administration

Licensing keys prevent unauthorized copying of the client software. Keys are signed using a secure SHA-256 HMAC algorithm.

### Derivation Protocol
To generate a valid activation key for a new school franchise:
1. Identify the input components:
   - **School Code:** e.g., `SCH001`
   - **Max Grade Level:** e.g., `G5` (Standard grade range allowed: `G1`-`G5` or `Nursery`)
   - **Features:** e.g., `FULL` or `LITE`
2. Combine into a token string:
   `WTA-SCH001-G5-FULL`
3. Generate the signature:
   Compute the HMAC-SHA256 signature using the secret licensing salt/pepper (configured in the code). Take the first 8 characters of the resulting hex string.
4. Final activation key:
   `WTA-SCH001-G5-FULL-[8-Char-Signature]`

*See the `desktop/utils/licenseHelper.cjs` script to automate this generation programmatically.*

---

## 🛠️ 4. Application Packaging & Deployment Operations

### Desktop App (Windows)
1. **Compilation Command:** Run `npm run package` inside the `desktop/` folder.
2. **Build Artifacts:** The generated setup installer is saved as `desktop/release/Wisdom Tree Academy Setup 1.0.0.exe`.
3. **Distribution:** Upload this `.exe` file to a public download page or school network file share for teacher distribution.

### Web Owner Dashboard
1. **Compilation Command:** Run `npm run build` inside the `owner-dashboard/` folder.
2. **Build Artifacts:** Generates a static HTML/JS bundle in the `owner-dashboard/dist/` directory.
3. **Hosting:** Deploy to any free static host (Vercel, Netlify, Github Pages). The owner dashboard retrieves all databases live using API keys stored locally in browser storage.

---

## 🛡️ 5. Post-Handover Security Protocols

1. **Database Secrets Rotation:** Go to the Supabase console under **Project Settings → API** and rotate the API keys once the handoff is complete.
2. **Password Updates:** Update default passcodes inside the application immediately upon deployment:
   - Administrators must log in and change their passcode via the Settings tab.
   - Unused or default accounts should be deleted from the database using SQL scripts or the client UI.
3. **Offline Integrity:** Remind technicians that SQLite database backups (`wisdom_tree.db`) are stored locally on computers. Standard local Windows file permissions should restrict read access to unauthorized user profiles.
