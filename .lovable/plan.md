
# Beating Educore — strategy + build plan

## What Educore actually is (so we know what we're up against)
Educore (parent.educore.io / educore.io) is a **mature, GCC-focused school ERP** with 137+ schools, 81k+ users, ISO 9001 + 27001, Oracle Cloud. Their stack:

- **SIS** (student info system, multi-curriculum)
- **CRM + Admissions workflow**
- **HR + Payroll + Staff Appraisal**
- **Fees / Finance**
- **Attendance** (proximity card + QR)
- **Communicator** (parent/staff messaging, notifications)
- **LMS** (lesson plans, homework, assessments)
- **Health module** (logs, declaration forms)
- **8+ dedicated mobile apps** (Parent, Teacher, Student, Health, Forms, Team, Attendance, Appraisal)
- Localized to local authorities, multi-lingual, professional support

**Where they're weak:** old-school UI, no real AI, slow setup (sales-led pricing), bloated module sprawl, no self-serve, generic LMS.

**Where Teachly already wins:** AI tutor, adaptive quizzes, study plans, presentations, semantic grading, faster onboarding, modern UI, Arabic RTL done well, self-serve pricing.

---

## Strategy — don't out-Educore Educore
Trying to ship 8 modules + payroll + biometric attendance is a 2-year build and you'll lose. Win by being the **"AI-native school OS"**: keep admin/ops *good enough* so a school can fully switch, but make the **teaching layer 10× better**.

Three pillars:

1. **AI moat they can't copy fast** — already partially built; sharpen it.
2. **Admin parity on the modules schools actually open daily** — attendance, fees, communicator, gradebook, report cards, parent app. Skip payroll/HR v1.
3. **Self-serve + transparent pricing** — Educore is sales-led. A principal should sign up, import a roster CSV, and run a class in 10 minutes.

---

## Pillar 1 — sharpen the AI moat (differentiation)
Things Educore literally cannot offer:

- **AI Lesson Planner for teachers** — input curriculum + grade → full week of lesson plans, slides, homework, quiz, differentiated for SEN/gifted. (You already have presentation + study plan generators — fuse them.)
- **AI Co-Teacher inside the gradebook** — explains *why* a student dropped, suggests interventions, drafts the parent message in one click.
- **AI-generated weekly parent digest** (already partially in `send-parent-weekly-digest`) — make it the killer demo.
- **Auto-grading for MCQ + matching, teacher-review queue for open-ended** — already shipped; market it as "save 8 hrs/week per teacher".
- **At-risk early warning** — already have classifications; surface as a principal dashboard widget with predicted term grade.
- **Bilingual AI (English ↔ Arabic)** done natively per message — Educore is multi-lingual UI but not multi-lingual *content generation*.

## Pillar 2 — admin parity (the must-build modules)
Ranked by "schools won't switch without this":

1. **Attendance**
   - Daily class attendance (teacher taps), QR check-in for older grades, parent SMS/email on absence.
   - Monthly attendance report per student + class.
2. **Fees / Invoicing**
   - Term invoices, partial payments, receipts, overdue reminders, Stripe + bank-transfer support, parent-visible balance.
3. **Communicator (in-app + email + push)**
   - School → all parents broadcast, class → parents, 1:1 teacher↔parent thread, read receipts. You already have `news` and `family-messaging` — unify into one Inbox.
4. **Admissions / Enquiries (lite CRM)**
   - Public enquiry form → pipeline (New → Tour → Offered → Enrolled) → auto-create student on enrollment.
5. **Report Cards (designer already planned)** — finish `.lovable/plan.md` Module #12.
6. **Homework & Assignments (already planned)** — finish Module #7.
7. **Timetable**
   - Section × period grid, teacher view, conflict detection. Skip auto-generation v1.
8. **Parent mobile experience**
   - You don't need a native app yet — ship a polished PWA with push notifications and "Add to Home Screen" prompt. Educore's app advantage shrinks dramatically.

## Pillar 3 — go-to-market wedges
- **Free for schools under 50 students** → land smaller schools Educore ignores.
- **Migration tool**: import Educore CSV exports (students, parents, sections, fees) in one click.
- **"Switch from Educore" landing page** — feature comparison, testimonials, free migration assist.
- **Per-curriculum templates**: pre-loaded CBSE / British / American / MOE-UAE / IB curricula. Schools onboard in minutes, not months.
- **Trust badges**: pursue ISO 27001 path; in the meantime publish a clear security & data-residency page (you already have RLS hardening — show it).

---

## Recommended build order (next 6–8 sessions)
Since you said admin/operations is the focus:

1. **Attendance module** (table + teacher UI + parent-visible widget + absence notification edge function)
2. **Communicator unification** (one Inbox: news + family messaging + teacher↔parent threads, with push)
3. **Fees & Invoicing** (Stripe already enabled — extend for invoices, balances, parent payment portal)
4. **Finish Homework + Report Card Designer** (already planned in `.lovable/plan.md`)
5. **Timetable (section grid)**
6. **Admissions pipeline (lite CRM)**
7. **Migration importer + "Switch from Educore" page**

Each is 1 focused session. Approve this and I'll start with #1 (attendance) — that's the single highest-frequency screen in any school day, and Educore's is dated.

## Out of scope (intentionally)
- Payroll, HR, staff appraisal — low ROI to build, schools tolerate keeping these elsewhere.
- Biometric / proximity-card attendance — QR + manual covers 95%; hardware integration later.
- Health module — niche; revisit after core ops are solid.
- Native iOS/Android apps — PWA first, native only after PMF.

---

Want me to start with **Attendance**, or would you rather sequence differently (e.g., Communicator first, or finish the two already-planned modules in `.lovable/plan.md`)?
