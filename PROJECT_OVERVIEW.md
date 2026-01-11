# HR & Payroll Platform – Project Overview

## Backend (hr_payroll_backend)

- **Tech stack**: Django 4.2, DRF, SimpleJWT (30m access / 7d refresh with rotation + blacklist), Djoser auth endpoints, CORS headers, SQLite for dev, dotenv for secrets. Custom auth backend supports email login.
- **Config**: `config/settings.py` wires apps, REST defaults to authenticated access, pagination (page size 20), CORS open to localhost dev ports, media/static roots, SMTP settings via env.
- **Entry points**: `config/urls.py` mounts versioned APIs under `/api/v1/`: auth (Djoser + JWT), users, employees, departments, attendance, leaves, notifications, announcements, org policies, payroll, efficiency, company info, support, chat. Static/media served in DEBUG.
- **Auth model**: `apps.users.models.User` extends `AbstractUser`, links one-to-one to `employees.Employee` (optional), keeps email field; exposes `employee_id` helper. `PasswordResetOTP` stores 6-digit OTPs with used flag.
- **Attendance domain** (`apps.attendance.models`):
  - `Attendance` tracks per-employee daily record with clock-in/out, locations, status (auto-evaluated vs policy grace period), worked_hours auto-calc with shift/grace/OT logic (caps hours if overtime not authorized). Unique per employee+date.
  - `WorkSchedule` defines shift times, days of week, schedule type, hours per day/week.
  - `OvertimeRequest` captures manager-initiated OT with M2M employees, status, justification.
- **Payroll domain** (`apps.payroll.models`):
  - `PayrollPeriod` with workflow statuses (draft → generated → pending_approval → approved → finalized / rolled_back), created/submitted/approved audit fields.
  - `PayrollApprovalLog` records transitions with actor and notes.
  - `Payslip` per employee/period with salary, allowances/bonus, overtime hours/rate/pay, deductions, tax amount, gross/net, attendance counts, issue flags, JSON breakdown, linked tax code/version.
  - Tax configuration models: `TaxCode`, versioned `TaxCodeVersion` (JSON configs, exemptions, statutory deductions), `TaxBracket` per version.
  - Assignment models: `Allowance` (fixed/percentage/formula, taxable flag, applicability, optional tax code), `Deduction` (fixed/percentage/tiered/formula, pre-tax/mandatory flags, applicability), `EmployeeAllowance`, `EmployeeDeduction` link overrides per employee.
- **Notifications** (`apps.notifications.models.Notification`): per-recipient messages with sender, type (info/warning/success/error/message/request/system/leave/promotion/policy/hr/attendance/payroll), optional route link, read flag, timestamps.
- **Other apps present (from INSTALLED_APPS)**: employees, departments, leaves, announcements, policies (org-level configs, referenced by attendance policy lookup), efficiency (performance), company, support, chat. URLs are mounted; implementations not fully scanned here.
- **Scripts/tests**: Numerous helper scripts at repo root (reset*db, test*\* files) suggest reproducible scenarios and integration checks; not detailed here.

## Frontend (hr_payroll_front)

- **Tech stack**: Vite + React 19, React Router 7, Context providers, Tailwind (v4 plugin), MUI 7, Headless UI, Emotion, charts (Nivo/Recharts/Chart.js), React Flow, PDF/Doc generation (react-pdf, jspdf, docx), TinyMCE & Lexical editors, socket.io-client, Axios, dayjs, js-cookie, XLSX, framer-motion.
- **Bootstrap**: `src/main.jsx` mounts `<AppProvider><App /></AppProvider>` into `root` with StrictMode; styles via `App.css`.
- **Routing & roles** (`src/App.jsx`): Central router builds nested layouts with a `Routes` guard that accepts `allowedRoles`. Primary layouts: `MainLayout` (shell) and `DashboardLayout` (home). Four main role spaces:
  - **Payroll** (`/Payroll`): generate payroll, salary structure, payslip regeneration/view, department-wise payroll, reports (payroll/tax), clock-in, chat, profile; inherits shared settings/help/notifications/global (myattendance/news).
  - **Manager** (`/hr_dashboard`): employee directory/detail, add/promote/assign, efficiency reports/forms, leave approvals, announcements, payroll reports/my payroll, policies, attendance (lists/detail), clock-in, org chart docs, chat, profile, tax codes, news, shared settings/help/notifications/global.
  - **Employee** (`/Employee`): dashboard, leave requests, my payroll/payslips, salary info view/edit routes present, attendance, efficiency result, overtime, department, policies, notifications, clock-in, chat, profile, shared settings/help/global.
  - **Line Manager** (`/department_manager`): similar to manager with overtime initiation, efficiency fill, attendance lists/detail, leave approvals, employee directory/detail, announcements, payroll reports/my payroll, policies, my attendance/overtime, chat.
  - Additional routes: login, unauthorized/access-denied, forgot/OTP/update password, index redirect, org chart, policy page, news feed, logout.
- **Feature pages referenced**: Attendance (list/detail, correction, my attendance), Leave approvals/requests, Employee CRUD/directory/detail, Announcements/News, Policies, Tax codes, Payroll generation/reports/payslips, Efficiency forms/reports, Overtime initiation, Notifications (send/view), Chat, Help center/FAQ/shortcuts, Company settings (info, password, work schedule), Profile/Change password.
- **UI composition**: Uses modular folders (Pages/…, Components/, layouts/, routes/, Context/, Hooks/, utils/). Chat pages, graphs (calendar), examples (form builder, CV reader), animations/assets present for richer UX.

## How the pieces fit

- Auth: Frontend calls Djoser + SimpleJWT endpoints (`/api/v1/auth/`, `/api/v1/auth/djoser/`) to obtain/refresh tokens; protected routes enforced client-side by `Routes` guard with role checks. Backend defaults to authenticated DRF permissions.
- Domain mapping: Frontend role sections align with backend apps (attendance, leaves, payroll, policies, notifications, chat). Attendance policies retrieved server-side (e.g., `get_policy('attendancePolicy', organization_id=1)`) influence status calculations. Payroll UI maps to payroll models (periods, payslips, tax codes, allowances/deductions). Notifications API backs notification center and send flows.
- Data stores: SQLite dev DB (`db.sqlite3` ignored). Media uploads served from `/media/`; static collected to `/staticfiles/` in Django.

## Suggested next reviews

- Inspect each app’s serializers/views/urls for exact payloads and permissions (not fully scanned yet).
- Confirm role strings used by `Routes` match backend group/claims issuance.
- Verify CORS/CSRF and cookie/token storage in `AppProvider` and API wrappers.
- Align attendance policy JSON contract between frontend and `apps.policies.utils.get_policy` expectations.
