# Wisdom Tree Academy: Teacher User Manual

Welcome to the Wisdom Tree Academy Diagnostic Assessment & School Registry client. This manual describes how to log in, track attendance, manage your question bank, run assessment evaluations with children, and generate scorecards.

---

## 1. System Login & Custom Interface Themes

1. **Start the Application:** Launch the desktop application.
2. **Choose Role Tile:** On the login card, select the **Class Teacher** tile.
3. **Select Account:** Choose your name (the system seeds `Clarissa Mercer` as the default teacher).
4. **Enter Passcode:** Provide your passcode (the seeded default passcode is `teacher123`).
5. **Theme Selection:** Click the ☀️ / 🌙 toggle icon on the top right of the login screen or in the sidebar header to switch between Light Mode and Dark Mode.
   - **Light Mode:** Highly legible, clean layout optimized for day usage.
   - **Dark Mode:** A soothing, dark HSL-based palette for low-light environments.

---

## 2. Managing Students & Logging Attendance

### Student Registry
The **Students** tab displays a roster of all active students assigned to the school database.
- **Register New Student:** Click the *Register Student* button, enter their full name, roll number, and class (Nursery to Grade 5).
- **Search & Filter:** Search directly by name or filter rows by class level.

### Daily Attendance
The **Attendance Registry** is designed to quickly log daily attendance records.
- **Log attendance:** Select the target date from the date selector.
- **Toggle Status:** Click the status pill beside each student's name to cycle through:
  - 🟢 **Present**
  - 🔴 **Absent**
  - 🟡 **Late**
- **Save Attendance:** Click **Save Attendance**. The entries are saved to the local SQLite database and flagged for cloud sync.

---

## 3. Question Bank Curation & Text-to-Speech

The **Question Bank** screen is the repository of diagnostic Multiple Choice Questions (MCQs).

### Adding Questions
1. Click **Add Question**.
2. Enter the Question Text, Audio Text prompt, and Option Choices (A, B, C, D).
3. Select the correct letter answer (A/B/C/D) from the dropdown.
4. Categorize it by **Class Level** and **Subject** (e.g., Mathematics, Science, English).
5. Click **Register Question**.

### Audio Read-Aloud Setup
For early learners (Nursery & Grade 1), the application provides dynamic audio speech.
- **Audio prompt field:** The text entered into the **Audio Text** field is used by the assessment runner's Text-to-Speech (TTS) module.
- You can review and test the pronunciation directly by clicking the 🔊 test speaker button.

---

## 4. Administering a Child Diagnostic Assessment

The **Assessment Setup** and **Assessment Runner** are designed to be child-friendly, bright, and interactive.

### Launching an Assessment
1. Go to the **Assessment Setup** tab in the sidebar.
2. Select the target **Classroom** and **Subject**.
3. Choose the student's name from the list.
4. Click **Launch Assessment Session**.

### Running the Assessment
1. **Bright Panels:** The runner interface hides the main navigation panel to prevent children from clicking out of the assessment.
2. **Audio Read-Aloud:** Clicking the 🔊 speaker button will trigger the browser's Text-to-Speech synthesizer, reading the question text to the student.
3. **Interactive Answer Tiles:** The student clicks one of the large multiple-choice cards. Options bounce slightly on hover and selection.
4. **Submitting Answers:** Click **Next Question** to proceed.
5. **Session Persistence:** When the final question is answered, the results are calculated and recorded to the local database automatically.

---

## 5. Reports Center & Exporting Scorecards

The **System Reports** center aggregates all assessment sessions completed locally.

### Viewing scorecards
- Locate a completed evaluation transcript.
- Click **Details** to expand the candidate's diagnostic report.
- The scorecard shows the student's final score percentage, strengths/weaknesses (calculated based on question categories), and the specific question breakdown list.
- Click **Print Report** to trigger a print preview or save the report as a PDF.
- Averages are calculated dynamically at the top of the reporting dashboard for general classroom progress tracking.
