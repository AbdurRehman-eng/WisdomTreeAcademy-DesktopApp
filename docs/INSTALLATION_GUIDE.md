# Wisdom Tree Academy: Client Installation & Setup Guide

This guide is designed to assist school teachers, administrative staff, and technicians in installing, running, activating, and maintaining the offline-first desktop application on local Windows computers.

---

## 💻 System Requirements

Before starting the installation, ensure the target computer meets the following specifications:
- **Operating System:** Windows 10 or Windows 11 (64-bit Edition)
- **Processor:** Dual-core Intel or AMD processor (1.8 GHz or faster)
- **System Memory:** 2 GB RAM (4 GB recommended for concurrent operations)
- **Disk Storage:** At least 500 MB free space (plus extra space for accumulated reports and questions)
- **Prerequisites:** Active internet connection is **only** required for the first-time activation and subsequent database synchronization. Regular student testing works completely offline.

---

## 📥 Installing the Application

1. Locate the installer executable: `Wisdom Tree Academy Setup 1.0.0.exe`.
2. Double-click the file to launch the setup wizard.
3. If Windows displays a "SmartScreen" warning (since the installer is self-signed), click **More Info** and select **Run Anyway**.
4. The wizard will prompt you to select an installation folder. The default path is recommended:
   `C:\Users\<YourUsername>\AppData\Local\Programs\Wisdom Tree Academy`
5. Check the options to **Create Desktop Shortcut** and **Create Start Menu Shortcut** for easy access.
6. Click **Install**. The setup process takes approximately 10–20 seconds.
7. Once finished, click **Finish** to automatically launch the application.

---

## 🔑 First-Time Activation & Setup

On the first launch of the application on a new machine, you must complete the setup process:

1. **Security Login:**
   - Log in using the system default administrative credentials:
     - **Username:** `admin`
     - **Passcode:** `admin123`
   - *Security Note: You will be prompted to change this password inside the Settings tab immediately after logging in.*

2. **License Activation:**
   - Navigate to the **Sync & Settings** view from the sidebar.
   - Look for the **License Key Activation** card.
   - Enter your activation key (e.g., `WTA-SCH001-G5-FULL-7F1AB9E4`).
   - Click **Activate System**.
   - If valid, the system status updates to **Licensed (Active)**, and all assessment features will unlock.

3. **Cloud Database Synchronization (Optional):**
   - In the **Cloud Configuration** section of the Settings screen, enter the central **Supabase URL** and **Anon API Key** provided by the network administrator.
   - Click **Save Cloud Settings**.
   - Press **Trigger Cloud Sync** to sync the local database with the central server.

---

## 💾 Database Backup & Restore

Since the application is offline-first, all student names, attendance logs, and test results are stored on the local hard drive. 

To prevent data loss, it is highly recommended to perform weekly backups:

### Backing Up Data
1. Press `Win + R` to open the Windows Run dialog.
2. Type `%APPDATA%` and press Enter. This opens the `AppData\Roaming` folder.
3. Locate the `desktop` directory.
4. Copy the file `wisdom_tree.db` to a secure external USB drive or secure cloud storage.

### Restoring Data
1. Close the Wisdom Tree Academy application.
2. Open the `%APPDATA%\desktop` directory.
3. Copy your backed-up `wisdom_tree.db` file and paste it into this folder, overwriting the existing file.
4. Open the application; your records will be restored.

---

## 🛠️ Troubleshooting Common Issues

### Issue: "Application shows a Blank Screen on launch"
- **Cause:** The local database file might be locked by another process or corrupted.
- **Solution:** 
  1. Open Windows Task Manager (`Ctrl + Shift + Esc`).
  2. End all running tasks named `Wisdom Tree Academy` or `Electron`.
  3. Relaunch the application.
  4. If the issue persists, rename the `wisdom_tree.db` file inside `%APPDATA%\desktop\` to `wisdom_tree.db.old` and relaunch. The app will auto-generate a fresh database.

### Issue: "Speech synthesizer/audio does not work in tests"
- **Cause:** The system's Text-to-Speech (TTS) engine is disabled or the audio device is disconnected.
- **Solution:**
  1. Ensure your speakers or headphones are connected and system volume is turned up.
  2. Open Windows Settings → Time & Language → Speech.
  3. Verify a voice package (e.g. English US) is installed and active.

### Issue: "Cloud Sync fails or hangs"
- **Cause:** Network blockages, incorrect Supabase credentials, or firewalls.
- **Solution:**
  1. Confirm your computer has active internet access by opening a webpage.
  2. Check that the Supabase Project URL and API Key in the **Sync & Settings** tab are entered exactly as provided.
  3. Ensure Windows Defender Firewall allows outbound connections for the application.
