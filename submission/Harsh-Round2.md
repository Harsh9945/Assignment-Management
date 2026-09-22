# Harsh-Round2 — Joineazy Technical Assessment Task 2

> **Full Name**: Harsh  
> **Submission File Target**: `Harsh-Round2.pdf`  
> **Repository**: [`Harsh9945/Assignment-Management`](https://github.com/Harsh9945/Assignment-Management)  
> **Round**: Task 2 — UI/UX, Database, Courses & Group Submission Enhancements  

---

## 1. Submission Links

- **GitHub Repository**: [https://github.com/Harsh9945/Assignment-Management](https://github.com/Harsh9945/Assignment-Management)
- **Working Demo Video**: [https://youtu.be/demo-video-link-placeholder](https://youtu.be/demo-video-link-placeholder) *(Replace with actual video link if uploaded)*
- **Deployed Platform URL**: [https://joineazy-eduflow.vercel.app](https://joineazy-eduflow.vercel.app)

---

## 2. Summary of Completed Task 2 Features

### UI/UX & Authentication
- **Role-Based Authentication**: Seamless JWT login & registration with inline field validation, loader animations, and role-based redirection (`/dashboard` for Students, `/admin/dashboard` for Professors).
- **Responsive Course Grid**: Student dashboard displays enrolled courses in a responsive card grid (1/2/3 columns) with assignment counts and instructor details.
- **Course-Scoped Assignment View**: Clickable course cards navigate to `/courses/:courseId/assignments` featuring filter tabs (`All`, `Pending`, `Confirmed`).
- **Assignment Detail & Leader Confirmation**: Displays submission mode badges (`INDIVIDUAL` vs `GROUP`). For group assignments, only group leaders can acknowledge submission, which automatically updates status for all team members. Non-leaders see an informative disabled state.
- **Progress Visualizations**: Animated progress bars with smooth fill transitions, gradient completion styles, and checkmark micro-animations.

### Database & Backend Logic
- **Database Relational Schema**: Extended PostgreSQL schema with `courses`, `course_enrollments`, `submission_type`, and `confirmed_by` attribution fields.
- **Atomic Group Fan-Out**: Transactional `BEGIN ... COMMIT` logic ensures leader confirmation updates all current group members atomically with `confirmed_by = leaderId`.
- **Professor Controls**: Course creation, student enrollment by email/ID, status query filtering (`?status=CONFIRMED|PENDING`), and class completion analytics.

### Test Automation & Documentation
- **Automated Test Coverage**: 7 complete test suites covering auth, groups, courses, group leader fan-out, and end-to-end acceptance scenarios.
- **Clean Architecture & Build**: Verified production Vite bundle compilation (`npm run build`) with 0 build errors.
