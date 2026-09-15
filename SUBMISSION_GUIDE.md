# Joineazy — Final Submission Checklist & Template

**Submission Deadline**: Thursday, 17 September 2026 — 11:30 PM  
**Submission Channel**: Submit exclusively via the official **Google Form link** provided in your task brief (do NOT submit via email).

---

## 1. Required Submission Filename Convention

The generated PDF must strictly adhere to the following naming pattern:

```text
FullName-TaskNo.pdf
```
*(Example: `AlexSmith-Task1.pdf` — exact format, no extra spaces or deviation).*

---

## 2. PDF Content Template

Your PDF must contain the three items below (and nothing else is needed):

```markdown
Student, Group & Assignment Management System
Candidate: [Your Full Name]
Task: Full Stack Intern Technical Task (Joineazy)

1. GitHub Repository Link:
   https://github.com/[your-username]/joineazy
   (Ensure this repository is set to PUBLIC so the evaluator has immediate access)

2. Working Demo Video Link:
   https://[loom.com/... or drive.google.com/... or youtube.com/watch?v=...]
   (Ensure public/unlisted view permissions are enabled without requiring access requests)

3. Live Platform Link (Optional):
   [Link to hosted instance if deployed, or state: "Docker Compose provided for 1-command local evaluation: http://localhost:3000"]
```

---

## 3. Demo Video Recording Checklist (3–5 Minutes)

When recording your demonstration walkthrough on **`http://localhost:3000`**, cover this sequence:

1. **Database & Docker Stack**:
   - Briefly show `docker-compose ps` showing all 3 containers (`joineazy-db`, `joineazy-backend`, `joineazy-frontend`) running and `(healthy)`.
2. **Student 1 (Alpha Squad Owner)**:
   - Log in with 1-click button or `student1@joineazy.edu` / `student123`.
   - Open **"My Group"**: show "Alpha Squad" roster with Alice as Owner, plus Bob, Charlie, Diana.
   - Show student search (`GET /api/students/search?q=`) and direct-add capability.
   - Open **"Assignments"**: show `Orientation Essay & Ethics Form` with the red **Past Due** badge.
   - Show `Final Capstone Project` with active status and group progress bar showing **75% (3/4 confirmed)**.
3. **Student 4 (Pending Submission & Live Update)**:
   - Log out and log in as `student4@joineazy.edu` / `student123`.
   - Open `Final Capstone Project`: show Diana's status is **Pending Submission** while the group is at 75%.
   - Click **"Open OneDrive Link"** (demonstrates `target="_blank" rel="noopener noreferrer"`).
   - Click **"Yes, I have submitted"** → show the **Two-Step Confirmation Modal** appearing.
   - Click **"Confirm Submission"** → show the modal closing, Diana's status updating to **Confirmed**, and the group progress bar dynamically moving from **75%** to **100% (Completed)**!
   - Click "Re-confirm Submission" to demonstrate **idempotency** (no duplicate records, no error).
4. **Professor / Admin Dashboard**:
   - Log in as `prof@joineazy.edu` / `admin123`.
   - Show the summary KPI cards (Total Students: 4, Groups: 1, Assignments: 2, Completion: 100%).
   - Show the responsive **Recharts bar chart** showing confirmed vs pending distributions.
   - Open **Assignment Progress Detail** for `Final Capstone Project`: show the group breakdown at 100% (4/4 confirmed) and the full student confirmation audit trail with timestamps.
5. **Automated Test Suite**:
   - Show terminal running `npm test` inside `backend/`: all 4 suites passing (**40/40 tests**).

---

## 4. Final Verification Checklist Before Uploading

- [ ] Repository pushed to GitHub and verified as **Public** (or evaluator invited).
- [ ] `README.md` contains Decision D-7 (`localStorage`) and Decision D-8 (owner self-removal blocked).
- [ ] Video link tested in an Incognito / private browser window to confirm no login or request permission is required.
- [ ] Exported as `FullName-TaskNo.pdf` and uploaded to the official Google Form before the deadline.
