# backlog.md — LeaderOS: Tiến độ & Phân chia Phase

> Checklist phát triển, trích từ MVP Functional Scope (`plan.md` §33) và tổ chức lại theo Phase.
> Quy tắc: mỗi task hoàn thành theo **Vertical Slice** (DB → Shared Types → API → UI → Verify), xem `CLAUDE.md`.
> Chỉ tick `- [x]` sau khi đã `typecheck` + `build` pass và thử luồng thật.

---

## MVP Functional Scope (tổng quan)

Nguồn gốc từ `plan.md` §33 — 20 mục:

- [x] Login
- [x] Manage Members
- [x] Create Projects
- [x] Assign Members to Projects
- [x] Set Project Progress
- [x] Mark Project Completed
- [x] Create Milestones
- [x] Create Tasks
- [x] Manage Today
- [x] Manage Follow-ups
- [ ] Create Reminders
- [ ] Create Weekly Plans
- [ ] Record Weekly Reviews
- [x] Capture Quick Notes
- [x] Store Technical Notes
- [x] Store Lessons Learned
- [x] Maintain Learning List
- [ ] Search Knowledge
- [ ] View Dashboard
- [ ] See Need My Attention

---

## Phase 0 — Foundation & Monorepo Setup

Mục tiêu: repo chạy được, `pnpm dev` khởi động cả web và api, DB kết nối thành công.

### Repo & tooling

- [x] Khởi tạo pnpm workspace (`pnpm-workspace.yaml`, root `package.json`)
- [x] Tạo `apps/web` với Next.js (App Router) + TypeScript
- [x] Tạo `apps/api` với NestJS + TypeScript
- [x] Tạo `packages/shared-types` và wire vào cả hai app
- [x] Cấu hình `tsconfig` base strict (`strict`, `noUncheckedIndexedAccess`, `noImplicitOverride`, `exactOptionalPropertyTypes`)
- [x] Cấu hình ESLint + Prettier, rule cấm `any` / `@ts-ignore`
- [x] Script root: `dev`, `build`, `typecheck`, `lint`
- [x] `.env.example` và `.gitignore` (loại trừ `.env`)
- [x] `docker-compose.yml` cho PostgreSQL
- [x] `README.md` hướng dẫn chạy local

### Database foundation

- [x] Cài Prisma trong `apps/api`, kết nối PostgreSQL
- [x] Quy ước schema: UUID/CUID, `created_at`, `updated_at`, `deleted_at`
- [x] Khai báo toàn bộ enum trong `schema.prisma` (xem `spec.md` §4)
- [x] Migration đầu tiên chạy thành công
- [x] Mirror enum sang `packages/shared-types`

### API foundation

- [x] Global validation pipe + error filter theo format chuẩn
- [x] Response envelope interceptor (`data` / `meta`)
- [x] Cấu hình Swagger tại `/api/docs`
- [x] Prefix `/api/v1`, bật CORS cho web
- [x] Health check endpoint

### Frontend foundation

- [x] Tailwind CSS + shadcn/ui khởi tạo
- [ ] Layout: left sidebar + top action bar
- [ ] TanStack Query provider + API client (credentials: include)
- [ ] Design token: màu status chip theo enum
- [ ] Skeleton / empty state / error state dùng chung

---

## Phase 1 — Auth & Members

Mục tiêu: Leader đăng nhập được và quản lý danh sách thành viên. Xác lập rõ `User != Member`.

### Auth (slice hoàn chỉnh)

- [x] Model `users` + migration
- [x] Seed 1 account Leader (password hash)
- [x] `POST /api/v1/auth/login` (email + password, HttpOnly cookie)
- [x] `POST /api/v1/auth/logout`
- [x] `GET /api/v1/auth/me`
- [x] Session guard bảo vệ toàn bộ endpoint nghiệp vụ
- [x] Trang `/login`
- [x] Redirect chưa auth → `/login`; đã auth → `/`
- [x] **Login** ✅ MVP scope

### Members (slice hoàn chỉnh)

- [x] Model `members` + migration (không có credential field)
- [x] `GET/POST /api/v1/members`, `GET/PATCH /api/v1/members/:id`
- [x] Filter `active`, search theo tên/nickname
- [x] Trang `/members`: compact table + drawer create/edit
- [x] Inline toggle `active`
- [x] **Manage Members** ✅ MVP scope

---

## Phase 2 — Projects & Members Assignment

Mục tiêu: tạo dự án, gán member, đặt tiến độ, đánh dấu hoàn thành.

### Projects core

- [x] Model `projects` + migration (đủ field theo `spec.md` §3.3)
- [x] `GET/POST /api/v1/projects`, `GET/PATCH /api/v1/projects/:id`
- [x] Filter theo `status`, sort theo `target_date` / `priority`
- [x] Trang `/projects`: list kèm status chip, progress bar, deadline, members, health
- [ ] Dự án `COMPLETED` vẫn searchable, hiển thị gạch ngang
- [x] Trang `/projects/[id]` với khung tabs (Overview trước, tab khác mở dần theo Phase)
- [x] **Create Projects** ✅ MVP scope

### Project members

- [x] Model `project_members` + migration (`project_role`, `allocation_percent`, `joined_at`, `left_at`)
- [x] API add / update / remove member khỏi project
- [x] Tab **Members** trong project detail
- [x] **Assign Members to Projects** ✅ MVP scope

### Progress & completion

- [x] Model `project_progress_snapshots` + migration
- [x] `PATCH /api/v1/projects/:id/progress` — mode MANUAL
- [x] Service tính AUTO progress theo weight task (`sum(weight DONE) / sum(weight active) * 100`)
- [x] Ghi snapshot mỗi lần progress hoặc health thay đổi
- [x] UI cập nhật tiến độ (manual progress slider + Đánh dấu hoàn thành)
- [x] Tab **History** đọc từ snapshots (Tab Snapshots)
- [x] **Set Project Progress** ✅ MVP scope
- [x] **Mark Project Completed** ✅ MVP scope

### Milestones

- [x] Model `milestones` + migration
- [x] `GET/POST /api/v1/milestones`, `PATCH /api/v1/milestones/:id`
- [x] Sort theo `order`, đổi status nhanh
- [x] Tab **Milestones** trong project detail
- [x] **Create Milestones** ✅ MVP scope

---

## Phase 3 — My Work (Tasks · Today · Follow-ups · Reminders)

Mục tiêu: luồng dùng hằng ngày hoàn chỉnh, cập nhật trong 5–10 phút.

### Tasks

- [x] Model `tasks` + `task_status_history` + migration (có `weight`)
- [x] `GET/POST /api/v1/tasks`, `GET/PATCH /api/v1/tasks/:id`
- [x] `PATCH /api/v1/tasks/:id/status` — ghi history mỗi lần đổi
- [x] `GET /api/v1/tasks/:id/history`
- [x] Filter: `status`, `priority`, `projectId`, `memberId`, `dueDate`, overdue
- [x] Trang `/tasks`: compact table, one-click status update, inline edit
- [x] Quick create task qua drawer (tối thiểu field bắt buộc)
- [x] Tab **Tasks** trong project detail (Table & Kanban view)
- [x] **Manage Tasks** & **Create Tasks** ✅ MVP scope

### Today

- [x] `GET /api/v1/today` gộp: top priorities, due today, overdue, completed today, pending follow-ups
- [x] Trang `/today` với các nhóm trên + follow-ups hôm nay + 1-click batch reschedule tomorrow
- [x] Ô Quick Note ngay trên trang Today
- [x] **Manage Today** ✅ MVP scope

### Follow-ups

- [x] Model `follow_ups` + migration (quan hệ member_id, project_id, owner_id)
- [x] `GET/POST /api/v1/follow-ups`, `PATCH /api/v1/follow-ups/:id`, `PATCH /api/v1/follow-ups/:id/status`
- [x] Filter due today / overdue / `WAITING`
- [x] Action resolve nhanh trên `/today` & follow-ups widget
- [x] **Manage Follow-ups** ✅ MVP scope

### Reminders

- [ ] Model `reminders` + migration (polymorphic `entity_type` + `entity_id`)
- [ ] `GET/POST /api/v1/reminders`, `PATCH /api/v1/reminders/:id`
- [ ] MVP chỉ one-time reminder (`recurrence = NONE`)
- [ ] Gắn reminder khi tạo task / follow-up / milestone / learning / decision review
- [ ] Hiển thị reminder đến hạn trên Today và Dashboard
- [ ] **Create Reminders** ✅ MVP scope

### Global Quick Create

- [ ] Nút `+ New`: Task · Note · Follow-up · Project · Lesson · Learning Item
- [ ] Đo và đảm bảo capture dưới 15 giây

---

## Phase 4 — Weekly Plans & Reviews

Mục tiêu: lập kế hoạch tuần theo dự án và lưu lịch sử review.

- [x] Model `weekly_plans`, `weekly_plan_tasks`, `weekly_reviews` + migration
- [x] Unique constraint `(project_id, year, week_number)`
- [x] `GET/POST /api/v1/weekly-plans`, `PATCH /api/v1/weekly-plans/:id`
- [x] `POST /api/v1/weekly-plans/:id/tasks` — gắn task vào plan tuần
- [x] `POST /api/v1/weekly-plans/:id/review` — lưu planned/completed/blocked/carried_over/completion_rate/summary
- [x] Service tự tính `completion_rate` từ task thực tế
- [ ] Logic `carried_over` sang tuần kế tiếp
- [x] Tab **Weekly** trong project detail + trang Weekly Plans (`/weekly`)
- [x] Hiển thị lịch sử review các tuần trước
- [x] **Create Weekly Plans** ✅ MVP scope
- [x] **Record Weekly Reviews** ✅ MVP scope

---

## Phase 5 — Knowledge Base (Notes · Lessons · Learning · Search)

Mục tiêu: capture nhanh, tổ chức sau, tìm lại được.

### Notes & Quick Note

- [x] Model `notes` + migration (quan hệ project_id, member_id, owner_id, type, source)
- [x] `GET/POST /api/v1/notes`, `GET/PATCH/DELETE /api/v1/notes/:id`
- [x] `POST /api/v1/notes/quick` — chỉ cần text, tự sinh title, source = QUICK
- [ ] `POST /api/v1/notes/:id/convert` → Task / Follow-up / Lesson / Learning / Technical Note / Idea
- [x] Filter theo `type`, `tag`, `projectId`, pinned
- [x] Trang `/notes` + pin/unpin + tag editor (Triển khai tại `/knowledge/notes`)
- [x] **Capture Quick Notes** ✅ MVP scope
- [x] **Store Technical Notes** ✅ MVP scope

### Lessons Learned

- [x] Model `lessons_learned` + migration (5 phần: situation → problem → root_cause → lesson → future_action)
- [x] `GET/POST /api/v1/lessons-learned`, `PATCH /api/v1/lessons-learned/:id`
- [x] Liên kết optional tới project và incident
- [x] Trang `/knowledge/lessons` + tab **Lessons**
- [x] **Store Lessons Learned** ✅ MVP scope

### Learning List

- [x] Model `learning_items` + migration
- [x] `GET/POST /api/v1/learning-items`, `PATCH /api/v1/learning-items/:id`, `PATCH /api/v1/learning-items/:id/status`
- [x] Trang `/knowledge/learning` với đổi status nhanh (BACKLOG → LEARNING → COMPLETED)
- [x] **Maintain Learning List** ✅ MVP scope

### Search

- [ ] Index full-text PostgreSQL cho các bảng cần tìm
- [ ] `GET /api/v1/search?q=&types=` bao phủ Projects · Tasks · Members · Notes · Lessons · Learning · Decisions
- [ ] UI global search, kết quả phân nhóm theo loại
- [ ] **Search Knowledge** ✅ MVP scope

---

## Phase 6 — Management (Risks · Incidents · Decisions)

Mục tiêu: theo dõi rủi ro, xử lý sự cố, lưu và đánh giá lại quyết định.

### Risks

- [x] Model `risks` + migration
- [x] `GET/POST /api/v1/risks`, `PATCH /api/v1/risks/:id`, `DELETE /api/v1/risks/:id`, `GET /api/v1/risks/matrix`
- [x] Filter `severity`/`impact`, `probability`, `status`, `projectId`
- [x] Ma trận Rủi ro tương tác Heatmap (Probability x Impact 3x4) + Sổ Rủi ro (Risk Register) tại `/management/risks`
- [ ] Tab **Risks** trong project detail

### Incidents

- [x] Model `incidents` + migration
- [x] `GET/POST /api/v1/incidents`, `PATCH /api/v1/incidents/:id`, `DELETE /api/v1/incidents/:id`
- [x] `POST /api/v1/incidents/:id/convert-to-lesson` — tạo lesson với `incident_id` và tag đồng bộ
- [x] UI theo luồng Problem → Investigation → Root Cause → Solution → Prevention tại `/management/risks` (Tab Incidents)
- [ ] Tab **Incidents** trong project detail

### Decisions

- [x] Model `decisions` + migration
- [x] `GET/POST /api/v1/decisions`, `PATCH /api/v1/decisions/:id`, `DELETE /api/v1/decisions/:id`
- [x] `POST /api/v1/decisions/:id/review` — ghi `actual_result`, chuyển `REVIEWED`
- [x] Tự động chuyển `DECIDED` → `REVIEW_PENDING` khi tới `review_date` (<= today)
- [x] Nhật ký Quyết định dạng Timeline tại `/management/decisions` hỗ trợ filter và modal đánh giá lại sau 3–6 tháng
- [ ] Tab **Decisions** trong project detail

---

## Phase 7 — Dashboard & Need Attention Engine

Mục tiêu: hiểu toàn cảnh trong dưới 30 giây, mọi cảnh báo giải thích được lý do.

### Project Health
 
 - [ ] Service tính health theo 4 chiều: Schedule · Execution · Risk · Blockers
 - [x] Rule GREEN / YELLOW / RED đúng `spec.md` §6.6
 - [x] Trả kèm lý do vì sao ra màu đó (không có điểm số bí ẩn)
 - [x] Health chip trong project list và project detail
 
 ### Need Attention Engine (rule-based)
 
 - [x] R1: task overdue > 0 / task urgent stuck
 - [x] R2: milestone overdue / milestone due <= 3 ngày and progress < 50%
 - [x] R3: project health RED/YELLOW hoặc status = AT_RISK
 - [x] R4: follow_up_date trễ > 3 ngày
 - [ ] R5: tồn tại critical risk chưa xử lý
 - [ ] R6: blocked tasks ≥ 3
 - [x] Output contract `{ id, rule_code, severity, title, reason, entity_type, entity_id, project_id, project_name, detected_at, action_hint }`
 - [x] `GET /api/v1/dashboard/need-attention`
 - [x] Panel **NEED ATTENTION** hiển thị reason cho từng mục
 - [x] **See Need My Attention** ✅ MVP scope
 
 ### Dashboard
 
 - [x] `GET /api/v1/dashboard/summary` gộp toàn bộ số liệu (backend tính, < 500ms, đạt 28ms)
 - [x] Panel MY DAY: tasks / overdue / follow-ups
 - [x] Panel PROJECT STATUS: active / at-risk / open tasks
 - [x] Panel PROJECTS: tên + progress + health indicator
 - [x] Panel THIS WEEK: planned / completed / completion rate %
 - [x] Panel upcoming milestones & urgent follow-ups
 - [x] Trang `/dashboard` và `/` Central Cockpit một màn, không cần scroll để nắm tình hình
 - [x] **View Dashboard** ✅ MVP scope

### Đa ngôn ngữ (i18n) & Navigation Top-Bar

- [x] Cài đặt và cấu hình thư viện `i18next` + `react-i18next` với Type-Safe definitions
- [x] Tạo bộ từ điển 4 ngôn ngữ trong `apps/web/src/locales/`: `vi.json`, `en.json`, `zh-CN.json`, `zh-TW.json` (fallback `vi`)
- [x] Rà soát và chuyển đổi 100% chuỗi văn bản cứng trên toàn bộ giao diện Frontend (`apps/web/src`) sang Master Dictionary i18n
- [x] Top Header Bar góc phải với 🔔 Thông báo (badge động), ❓ Docs & Trợ giúp, 💬 Ghi chú nhanh (Quick Note), Vạch ngăn cách `|`
- [x] Thẻ tài khoản Leader Profile Dropdown: Avatar, Badge `Admin`, Email, Team, ⚙️ Settings, 🌐 Languages (Flyout Sub-menu sang trái: 繁體中文, 简体中文, English, Tiếng Việt), ↪️ Logout
- [x] Lưu và duy trì lựa chọn ngôn ngữ qua Cookie (`NEXT_LOCALE`) và `localStorage` (`leaderos_locale`)
- [x] Tự động gửi header `Accept-Language` qua `apiClient` trên mọi request
- [x] Backend NestJS `HttpExceptionFilter` đọc `Accept-Language` và chuyển ngữ các thông báo lỗi (400, 401, 403, 404, 500)

### Settings & hoàn thiện

- [ ] Trang `/settings` (thông tin Leader, đổi password)
- [ ] Rà soát accessibility toàn bộ trang (label, focus, keyboard, contrast)
- [ ] Rà soát Swagger: mọi endpoint có schema + example
- [ ] Đo lại 3 chỉ tiêu UX: < 30s nắm tình hình, < 15s capture, 5–10 phút cập nhật ngày
- [ ] Seed dữ liệu demo để kiểm thử end-to-end

---

## Definition of Done cho mỗi task

- [ ] Đã Inspect code hiện có trước khi sửa
- [ ] Slice hoàn chỉnh DB → Shared Types → API → UI
- [ ] `pnpm typecheck` pass, không có `any`
- [ ] `pnpm lint` pass
- [ ] `pnpm build` pass
- [ ] Migration chạy được, Prisma client generate thành công
- [ ] Thử luồng thật trên UI hoặc Swagger
- [ ] Tick `- [x]` trong file này

---

## Out of Scope (không làm ở MVP)

```text
Multi-tenant organizations · Complex RBAC · Member login
Chat · Comments · Mentions · Real-time collaboration
Mobile app · Microservices · Kafka · Kubernetes
Workflow engine · AI agent · Vector database · Automatic forecasting
HRM · CRM · Payroll · Attendance
```

## Sau MVP (backlog dài hạn)

- [ ] Analytics: progress trend, weekly completion rate, overdue trend, milestone delay, project velocity, member allocation, incident frequency, risk trend, decision outcome
- [ ] ECharts cho biểu đồ analytics
- [ ] Reminder định kỳ (daily / weekly / monthly) + scheduled summary
- [ ] Shortcut `Ctrl/Cmd + K` cho quick create và search
- [ ] Context Builder + LLM integration (AI nhận structured context, không truy vấn raw DB)
- [ ] Decision support output: Observation → Evidence → Options (Benefit/Cost/Risk) → Leader Decision

---

## Success Criteria (kiểm tra khi đóng MVP)

- [ ] Leader mở hệ thống mỗi ngày làm việc
- [ ] Hiểu trạng thái dự án trong vòng 30 giây
- [ ] Capture một note/task dưới 15 giây
- [ ] Weekly review không phải dựng lại lịch sử bằng tay
- [ ] Follow-up quan trọng không bị bỏ quên
- [ ] Lesson learned tìm lại và tái sử dụng được
- [ ] Dữ liệu lịch sử dự án hữu ích cho quyết định sau này
