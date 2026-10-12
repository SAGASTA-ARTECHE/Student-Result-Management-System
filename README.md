# Student Results Management System (SRMS)
**Module:** NPRT63 — Information Systems Project  
**Institution:** Kimberley University of Technology (KUT)  
**Evaluation Rubric:** 50/50 Marks Implementation, Testing & Technical Defense Target

---

## 📖 Project Overview
The **Student Results Management System (SRMS)** is an enterprise academic administration platform engineered to automate and govern the academic grading lifecycle across three institutional roles: **Administrators**, **Lecturers**, and **Students**.

The platform automates weighted continuous assessment calculations, enforces Senate grading thresholds (A+ through F) and Academic Board exclusion standing orders, guarantees multi-role synchronization, maintains an immutable security audit trail, and features an integrated **Automated End-to-End Test Suite**, **Database Trigger Engine**, **Optimistic Concurrency Control (OCC)**, and **Course & Faculty Teaching Evaluation System**.

---

## 🏛️ Comprehensive Architecture & Lecturer Feedback Implementations

### 1. Database Functionality & Stored Procedures vs Clean Application Logic
- **Lecturer Question:** *"Understand whether stored procedures are necessary. An effective database can work without stored procedures if SQL queries and application logic are implemented correctly."*
- **Architectural Defense:**
  - Modern enterprise systems decouple business rules from proprietary database engines.
  - Stored procedures (`sp_CalculateStudentModuleResult`, `sp_SubmitCourseEvaluation`) are implemented in MySQL DDL for benchmarking.
  - However, core business calculations are placed in the **TypeScript Application DAO / Service Layer**, achieving:
    - **Portability:** Database independence (seamless migration between PostgreSQL, Cloud SQL, Firestore, and MySQL).
    - **Testability:** Fully automated unit and E2E testing in CI/CD without database locks.
    - **Version Control:** Complete git traceability of algorithmic business logic.
    - **Horizontal Scalability:** Shifts CPU execution burden away from the database server.
  - Interactive comparison and execution plan inspection available in **Database & Triggers Console -> Tab: Stored Procs vs Clean Logic**.

### 2. Database Triggers (Automated Event Engine)
- **Implemented Triggers (`BEFORE` / `AFTER` `INSERT`, `UPDATE`, `DELETE`):**
  1. `trg_before_mark_validation`: Enforces 0.00 - 100.00 numerical domain constraints and 1% - 100% weight check constraints before write.
  2. `trg_after_mark_insert_or_update`: Fires on mark capture; cascades automatic final grade computation, GPA re-evaluation, and security audit log entry.
  3. `trg_after_rating_insert`: Fires on student course evaluation; recalculates faculty teaching effectiveness score and satisfaction index.
  4. `trg_academic_exclusion_check`: Monitors cumulative failed modules (≥ 3) or average (< 35%) and flags students for academic exclusion review.
  5. `trg_after_mark_delete`: Recalculates remaining assessments or resets final result to Incomplete.
- **Live Trigger Monitor:** Real-time execution logs with millisecond latency timers (`⚡ 1.2 ms`) and active trigger toggles.

### 3. Cloud Database Architecture, Security & Disaster Recovery
- **Cloud vs Local Architecture:**
  - Cloud SQL (PostgreSQL 16) & Google Firebase Firestore integration simulation.
  - **Security & Access Control:**
    - PostgreSQL 16 **Row-Level Security (RLS)** policies restricting lecturers to assigned courses.
    - Firebase **Cloud Security Rules** enforcing role-based document read/write authorization.
  - **Disaster Recovery:**
    - Encrypted JSON full database snapshot export and restore.
    - Live referential integrity and foreign key checksum verification (0 orphan records).
    - Production MySQL 8.0+ 3NF relational DDL script generator.

### 4. System Functions & Mathematical Formulation
- Every system function is documented with its mathematical formula, complexity, and database impact in the in-app **System Functions & Defense Manual**:
  - **Weighted Final Mark:**
    $$\text{Final Mark} = \frac{\sum (\text{Mark}_i \times \text{Weight}_i)}{\sum \text{Weight}_i}$$
    *(Normalizes partial weights when assessments are entered progressively)*.
  - **Credit-Weighted Cumulative GPA (4.0 Scale):**
    $$\text{GPA} = \frac{\sum (\text{GradePoints}_i \times \text{Credits}_i)}{\sum \text{Credits}_i}$$
  - **Interactive Function Playground:** Test functions live with custom marks and weights during your defense!

### 5. Concurrency Handling & Optimistic Concurrency Control (OCC)
- **Problem Prevented:** Lost updates and race conditions when multiple examiners edit the same record simultaneously.
- **OCC Implementation:**
  - Records track integer `version` numbers.
  - Simultaneous writes with stale versions trigger `409 Concurrency Conflict`.
  - Interactive **Live Concurrency Simulator** demonstrates dual-write collisions and collision resolution strategies (Abort, Force Overwrite, Three-Way Merge).

### 6. Automated End-to-End (E2E) Testing Suite
- Built-in interactive test runner executing 8 automated test suites with real assertions:
  1. `E2E-01`: Authentication & RBAC Multi-Role Access Control
  2. `E2E-02`: Assessment Mark Input & Boundary Validation (<0, >100 rejected)
  3. `E2E-03`: Database Triggers Cascading Execution
  4. `E2E-04`: Real-Time Student Transcript Sync (clears pending delay)
  5. `E2E-05`: Optimistic Concurrency Control & Lost Update Prevention
  6. `E2E-06`: Course Quality & Faculty Teaching Evaluation
  7. `E2E-07`: Academic Grading Rules & Exclusion Standing Engine
  8. `E2E-08`: Database ACID Integrity & Relational DDL Generation
- One-click **"Execute All E2E Tests"** button with animated progress and printable report.

### 7. Course & Faculty Teaching Evaluation (Rating System)
- **What is Rated:** Course Delivery, Assessment Fairness, Learning Materials, and Feedback Timeliness (1 - 5 Stars).
- **Eligibility:** Strictly restricted to students registered in that specific module.
- **Anti-Duplicate Policy:** Enforces unique composite key `(student_id, module_id, academic_year)`. Duplicate submissions are strictly blocked.
- **Anonymous Option:** Protects student academic freedom with toggleable anonymity.
- **Aggregated Displays:**
  - Student: "Rate My Courses" portal.
  - Lecturer: "Teaching Effectiveness Scorecard" and student comments.
  - Admin: University-wide Quality Assurance leaderboard.

---

## 🛠️ Technology Stack
- **Frontend:** React 19, TypeScript
- **Styling:** Tailwind CSS (Modern clean design system)
- **Icons:** Lucide React
- **Architecture:** 3-Tier Enterprise Application Layer with Database Trigger Engine
- **Cloud Readiness:** PostgreSQL 16 (Cloud SQL) & Google Firebase Firestore compatible

---

## 👥 Demo User Accounts & Credentials
Use the Quick Role Switcher in the top header or login with these credentials:

| Role | Username | Password | Linked Profile | Scope |
| :--- | :--- | :--- | :--- | :--- |
| **Administrator** | `maje` | `Admin@123` | Institutional Admin | System administration, database console, audit logs |
| **Lecturer** | `dr.may` | `Lecturer@123` | `LEC-MAY` (Dr. May) | Capture marks, course list, teaching ratings scorecard |
| **Student** | `tlhompo` | `Student@123` | `STU-TLHOMPO` | View results, live GPA, official transcript, rate courses |

---

## 🚀 Execution & Setup Instructions

```bash
# 1. Install dependencies
npm install

# 2. Run development server (runs on port 3000)
npm run dev

# 3. Validate TypeScript syntax and types
npm run lint

# 4. Build for production
npm run build
```

---

## 🎯 Quick Navigation During System Presentation
During your live assessment, use the quick navigation buttons in the top header:
- **🧪 E2E Tests:** Execute the 8-suite automated test suite live in front of the examiners.
- **⚡ DB Triggers:** Show the active triggers, fire a live trigger event, and demonstrate OCC concurrency.
- **⭐ Ratings:** Demonstrate student course evaluation submission, duplicate blocking, and faculty scorecards.
