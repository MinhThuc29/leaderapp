# spec.md — LeaderOS: Yêu cầu kỹ thuật & Data Model

> Trích xuất từ `plan.md`. Đây là nguồn sự thật về nghiệp vụ và dữ liệu khi implement.
> Quy tắc làm việc: xem `CLAUDE.md`. Tiến độ: xem `backlog.md`.

---

## 1. Product Vision

LeaderOS là **hệ thống quản lý cá nhân và hỗ trợ ra quyết định dành cho một Leader**.

```text
Primary user:  1 Leader
Managed team:  ~19 members
Mục tiêu:      giúp Leader capture thông tin, quản lý việc/dự án,
               học từ kinh nghiệm, và ra quyết định tốt hơn trong tương lai.
```

Không phải: team collaboration tool · Jira clone · generic to-do app.

Leader là người dùng hoạt động duy nhất ở phiên bản đầu.

Hệ thống giúp Leader quản lý: công việc hằng ngày · reminder · follow-up · dự án · tiến độ dự án · thành viên dự án · kế hoạch tuần · milestone · note · lesson learned · learning topic · risk · incident · decision.

Định hướng dài hạn:

```text
Capture → Organize → Execute → Track → Review → Learn → Analyze → Decide
```

### Câu hỏi cốt lõi hệ thống phải trả lời nhanh

```text
Hôm nay tôi cần làm gì?
Việc gì cần tôi chú ý?
Dự án nào đang tiến triển tốt?
Dự án nào đang gặp rủi ro?
Việc gì đang bị blocked?
Ai đang tham gia dự án nào?
Tuần này cần hoàn thành gì?
Tôi cần follow up việc gì?
Tôi đã học được gì?
Tôi cần ghi nhớ gì cho các dự án sau?
Tôi đã ra những quyết định nào và chúng có hiệu quả không?
```

---

## 2. Core Principles

### 2.1 Single-user first

```text
User   = Leader
Member = người do Leader quản lý

User != Member
```

Member **không cần account**, không đăng nhập. Nguyên tắc này giữ phiên bản đầu đơn giản nhưng vẫn cho phép mở rộng multi-user sau.

### 2.2 Fast daily usage

Hệ thống phải đủ nhanh để dùng mỗi ngày.

```text
Target: thời gian cập nhật hằng ngày 5–10 phút.
```

Thiết kế theo: quick create · inline editing · tối thiểu field bắt buộc · one-click status update · search nhanh · dashboard rõ ràng · tránh form dài.

### 2.3 History first

Dữ liệu quản trị quan trọng phải giữ lịch sử thay đổi: project progress · weekly result · milestone status · task status · risk status · decision outcome.

Dữ liệu lịch sử là nền tảng cho analytics và AI sau này.

### 2.4 AI later, data first

```text
Structured Data → Reliable Calculations → Analytics → AI Summary
→ AI Analysis → AI Recommendations → Scenario / Forecast
```

AI hỗ trợ quyết định, **không thay thế Leader**.

---

## 3. Data Model — Core Database Entities

`plan.md` §27 liệt kê **21 bảng** (con số 19 trong đề bài là số *thành viên team*, không phải số entity). Toàn bộ 21 bảng được đặc tả dưới đây.

Quy ước chung áp dụng cho mọi bảng nghiệp vụ:

```text
id           UUID/CUID (PK)
created_at   timestamp
updated_at   timestamp
deleted_at   timestamp, nullable  (soft delete cho bản ghi lịch sử quan trọng)
owner_id     FK → users.id        (Leader sở hữu bản ghi)
```

### Bảng tổng quan

| # | Entity | Vai trò | Giữ history |
|---|---|---|---|
| 1 | `users` | Account Leader (người đăng nhập duy nhất) | — |
| 2 | `members` | Thành viên do Leader quản lý, không login | — |
| 3 | `projects` | Dự án | qua snapshots |
| 4 | `project_members` | Bảng nối project ↔ member | có (joined/left) |
| 5 | `project_progress_snapshots` | Lịch sử tiến độ dự án | ✅ |
| 6 | `milestones` | Mốc dự án | — |
| 7 | `tasks` | Công việc | qua status history |
| 8 | `task_status_history` | Lịch sử đổi trạng thái task | ✅ |
| 9 | `weekly_plans` | Kế hoạch tuần theo dự án | — |
| 10 | `weekly_plan_tasks` | Bảng nối weekly plan ↔ task | — |
| 11 | `weekly_reviews` | Kết quả review tuần | ✅ |
| 12 | `notes` | Ghi chú (gồm Quick Note) | — |
| 13 | `tags` | Từ khoá dùng chung | — |
| 14 | `note_tags` | Bảng nối note ↔ tag | — |
| 15 | `lessons_learned` | Bài học kinh nghiệm | — |
| 16 | `learning_items` | Danh sách cần học | — |
| 17 | `follow_ups` | Việc đang chờ người/bên khác | — |
| 18 | `reminders` | Nhắc việc | — |
| 19 | `risks` | Rủi ro dự án | — |
| 20 | `incidents` | Sự cố | — |
| 21 | `decisions` | Sổ quyết định quản trị | ✅ (review) |

---

### 3.1 `users`

Account của Leader. MVP chỉ tồn tại **một** bản ghi.

| Field | Type | Ghi chú |
|---|---|---|
| `id` | UUID/CUID | PK |
| `email` | string | unique, dùng để login |
| `password_hash` | string | bcrypt/argon2, không lưu plaintext |
| `name` | string | tên hiển thị |
| `created_at` / `updated_at` | timestamp | |

Quan hệ: là `owner` của gần như toàn bộ bảng nghiệp vụ. **Không liên quan FK "là member"**.

### 3.2 `members`

Thành viên Leader quản lý. Không có credential.

| Field | Type | Ghi chú |
|---|---|---|
| `id` | UUID/CUID | PK |
| `name` | string | bắt buộc |
| `nickname` | string? | tên gọi ngắn |
| `role` | string | ví dụ: Backend, CNC Integration, Frontend, QA |
| `level` | string? | ví dụ: Junior / Mid / Senior |
| `active` | boolean | default `true` |
| `notes` | text? | ghi chú của Leader về member |

Quan hệ: `project_members[]`, `tasks[]` (assignee tham chiếu), `risks[]` (owner), `notes[]` (related_member).

### 3.3 `projects`

| Field | Type | Ghi chú |
|---|---|---|
| `id` | UUID/CUID | PK |
| `name` | string | bắt buộc |
| `code` | string | mã ngắn, unique |
| `description` | text? | |
| `status` | enum `ProjectStatus` | xem §4 |
| `progress_mode` | enum `ProgressMode` | `MANUAL` \| `AUTO` |
| `manual_progress` | int 0–100 | dùng khi `progress_mode = MANUAL` |
| `start_date` | date? | |
| `target_date` | date? | deadline |
| `completed_date` | date? | set khi `COMPLETED` |
| `priority` | enum `Priority` | |
| `health_status` | enum `HealthStatus` | `GREEN` \| `YELLOW` \| `RED` |
| `leader_note` | text? | nhận định riêng của Leader |

Quan hệ: `project_members[]`, `milestones[]`, `tasks[]`, `weekly_plans[]`, `risks[]`, `incidents[]`, `notes[]`, `lessons_learned[]`, `decisions[]`, `follow_ups[]`, `project_progress_snapshots[]`.

Dự án `COMPLETED` vẫn **searchable**, hiển thị có thể gạch ngang (strikethrough).

### 3.4 `project_members`

| Field | Type | Ghi chú |
|---|---|---|
| `project_id` | FK → projects | |
| `member_id` | FK → members | |
| `project_role` | string | vai trò trong dự án cụ thể |
| `allocation_percent` | int? | optional, 0–100 |
| `joined_at` | date | |
| `left_at` | date? | null = đang tham gia |

Unique: `(project_id, member_id, joined_at)`.

### 3.5 `project_progress_snapshots`

Lưu lịch sử tiến độ để vẽ trend sau này.

| Field | Type | Ghi chú |
|---|---|---|
| `project_id` | FK → projects | |
| `progress` | int 0–100 | giá trị tại thời điểm chụp |
| `mode` | enum `ProgressMode` | manual hay auto |
| `health_status` | enum `HealthStatus` | trạng thái kèm theo |
| `note` | text? | lý do thay đổi |
| `captured_at` | timestamp | |

### 3.6 `milestones`

| Field | Type | Ghi chú |
|---|---|---|
| `project_id` | FK → projects | |
| `title` | string | ví dụ: Requirement Freeze, UAT, Go Live |
| `description` | text? | |
| `status` | enum `MilestoneStatus` | |
| `target_date` | date | |
| `completed_date` | date? | |
| `progress` | int 0–100 | |
| `order` | int | thứ tự hiển thị |

### 3.7 `tasks`

| Field | Type | Ghi chú |
|---|---|---|
| `title` | string | bắt buộc |
| `description` | text? | |
| `priority` | enum `Priority` | |
| `status` | enum `TaskStatus` | |
| `due_date` | date? | |
| `due_time` | time? | |
| `project_id` | FK → projects? | related_project |
| `member_id` | FK → members? | related_member |
| `weight` | int | default `1`, dùng cho auto progress |
| `completed_at` | timestamp? | |

Quan hệ: `task_status_history[]`, `reminders[]`, `weekly_plan_tasks[]`, `tags` (qua tagging).

### 3.8 `task_status_history`

| Field | Type | Ghi chú |
|---|---|---|
| `task_id` | FK → tasks | |
| `from_status` | enum `TaskStatus`? | null nếu là lần tạo |
| `to_status` | enum `TaskStatus` | |
| `note` | text? | |
| `changed_at` | timestamp | |

### 3.9 `weekly_plans`

| Field | Type | Ghi chú |
|---|---|---|
| `project_id` | FK → projects | |
| `week_number` | int | ví dụ 39 |
| `year` | int | |
| `goal` | text | mục tiêu tuần |
| `start_date` / `end_date` | date | |

Unique: `(project_id, year, week_number)`.

### 3.10 `weekly_plan_tasks`

| Field | Type | Ghi chú |
|---|---|---|
| `weekly_plan_id` | FK → weekly_plans | |
| `task_id` | FK → tasks | |
| `planned_status` | enum `TaskStatus`? | trạng thái kỳ vọng cuối tuần |
| `result_status` | enum `TaskStatus`? | trạng thái thực tế |
| `carried_over` | boolean | task bị đẩy sang tuần sau |

### 3.11 `weekly_reviews`

| Field | Type | Ghi chú |
|---|---|---|
| `weekly_plan_id` | FK → weekly_plans | 1–1 |
| `planned` | int | số task đã plan |
| `completed` | int | số task hoàn thành |
| `blocked` | int | số task bị blocked |
| `carried_over` | int | số task chuyển tiếp |
| `completion_rate` | decimal | `completed / planned` |
| `summary` | text | nhận định của Leader |
| `reviewed_at` | timestamp | |

### 3.12 `notes`

| Field | Type | Ghi chú |
|---|---|---|
| `title` | string | Quick Note có thể để trống → sinh từ content |
| `content` | text | bắt buộc |
| `type` | enum `NoteType` | |
| `project_id` | FK → projects? | related_project |
| `member_id` | FK → members? | related_member |
| `is_pinned` | boolean | default `false` |
| `source` | enum? | `QUICK` \| `NORMAL` — phục vụ luồng Quick Note |
| `converted_to` | string? | ghi lại đã convert thành Task/Lesson/... |

Quan hệ: `note_tags[]`.

### 3.13 `tags` / 3.14 `note_tags`

`tags`: `id`, `name` (unique), `color?`.

`note_tags`: `note_id` FK, `tag_id` FK, unique `(note_id, tag_id)`.

Tag cũng có thể dùng cho `tasks` và `lessons_learned` (bảng nối tương ứng khi cần).

### 3.15 `lessons_learned`

Tách biệt với `notes`.

| Field | Type | Ghi chú |
|---|---|---|
| `title` | string | |
| `project_id` | FK → projects? | optional |
| `incident_id` | FK → incidents? | optional, khi convert từ incident |
| `situation` | text | hoàn cảnh |
| `problem` | text | vấn đề gặp phải |
| `root_cause` | text | nguyên nhân gốc |
| `lesson` | text | bài học |
| `future_action` | text | hành động áp dụng cho dự án sau |

AI tương lai phải truy hồi được lesson liên quan tới dự án tương tự.

### 3.16 `learning_items`

| Field | Type | Ghi chú |
|---|---|---|
| `title` | string | |
| `description` | text? | |
| `priority` | enum `Priority` | |
| `status` | enum `LearningStatus` | |
| `target_date` | date? | optional |
| `resource_url` | string? | optional |
| `notes` | text? | |

### 3.17 `follow_ups`

Khác task thường: dùng khi **đang chờ người/bên khác**.

| Field | Type | Ghi chú |
|---|---|---|
| `title` | string | |
| `waiting_for` | string | customer / supplier / member / technical confirm / quotation |
| `follow_up_date` | date | ngày cần hỏi lại |
| `status` | enum `FollowUpStatus` | |
| `project_id` | FK → projects? | |
| `note` | text? | |

### 3.18 `reminders`

Nhắc việc, có thể gắn vào nhiều loại đối tượng.

| Field | Type | Ghi chú |
|---|---|---|
| `title` | string | |
| `remind_at` | timestamp | MVP: one-time |
| `recurrence` | enum? | MVP `NONE`; tương lai `DAILY` \| `WEEKLY` \| `MONTHLY` |
| `entity_type` | enum | `TASK` \| `FOLLOW_UP` \| `PROJECT` \| `MILESTONE` \| `LEARNING` \| `DECISION_REVIEW` |
| `entity_id` | UUID? | polymorphic reference |
| `is_done` | boolean | |

### 3.19 `risks`

| Field | Type | Ghi chú |
|---|---|---|
| `project_id` | FK → projects | |
| `title` | string | |
| `description` | text? | |
| `severity` | enum `Severity` | |
| `probability` | enum `Probability` | `LOW` \| `MEDIUM` \| `HIGH` |
| `status` | enum `RiskStatus` | |
| `owner_member_id` | FK → members? | optional |
| `mitigation` | text | phương án giảm thiểu |
| `due_date` | date? | |

### 3.20 `incidents`

Luồng xử lý:

```text
Problem → Investigation → Root Cause → Solution → Prevention → Lesson Learned
```

| Field | Type | Ghi chú |
|---|---|---|
| `project_id` | FK → projects | |
| `title` | string | |
| `description` | text | |
| `severity` | enum `Severity` | |
| `status` | enum `IncidentStatus` | |
| `detected_at` | timestamp | |
| `resolved_at` | timestamp? | |
| `root_cause` | text? | |
| `solution` | text? | |
| `prevention` | text? | |

Action nghiệp vụ: **Convert Incident → Lesson Learned** (tạo `lessons_learned` với `incident_id` trỏ về).

### 3.21 `decisions`

| Field | Type | Ghi chú |
|---|---|---|
| `title` | string | |
| `project_id` | FK → projects? | optional |
| `context` | text | bối cảnh |
| `options_considered` | text | các phương án đã cân nhắc |
| `decision` | text | quyết định |
| `reason` | text | lý do |
| `expected_result` | text | kỳ vọng |
| `actual_result` | text? | điền khi review |
| `decision_date` | date | |
| `review_date` | date? | ngày cần đánh giá lại |
| `status` | enum `DecisionStatus` | |

---

## 4. Enums

```text
ProjectStatus     PLANNING · ACTIVE · ON_HOLD · AT_RISK · COMPLETED · CANCELLED
ProgressMode      MANUAL · AUTO
HealthStatus      GREEN · YELLOW · RED
Priority          LOW · MEDIUM · HIGH · CRITICAL
TaskStatus        TODO · DOING · WAITING · DONE · CANCELLED
MilestoneStatus   NOT_STARTED · IN_PROGRESS · BLOCKED · COMPLETED · CANCELLED
FollowUpStatus    WAITING · RESOLVED · CANCELLED
NoteType          WORK · IDEA · TECHNICAL · MEETING · GENERAL
LearningStatus    BACKLOG · LEARNING · PAUSED · COMPLETED
Severity          LOW · MEDIUM · HIGH · CRITICAL
Probability       LOW · MEDIUM · HIGH
RiskStatus        OPEN · MONITORING · MITIGATED · CLOSED
IncidentStatus    OPEN · INVESTIGATING · RESOLVED · CLOSED
DecisionStatus    DECIDED · REVIEW_PENDING · REVIEWED
ReminderEntity    TASK · FOLLOW_UP · PROJECT · MILESTONE · LEARNING · DECISION_REVIEW
```

---

## 5. Database Design Rules

1. Dùng **UUID/CUID** cho ID.
2. Bảng nghiệp vụ có `created_at`, `updated_at`.
3. **Giữ history** ở nơi analytics tương lai có thể cần.
4. Dùng **enum** cho status ổn định.
5. **Không** nhân bản số liệu tổng đã tính được cho dashboard, trừ khi cần cho performance.
6. Ưu tiên **soft-delete** cho bản ghi lịch sử quan trọng.
7. Không tạo "điểm số" không giải thích được từ dữ liệu thô.

---

## 6. Business Modules

Navigation tổng thể:

```text
Dashboard

My Work            Projects           Team
├── Today          ├── Active         ├── Members
├── Tasks          ├── Completed      └── Workload
├── Follow-ups     └── Weekly Plans
└── Reminders

Knowledge          Management         Settings
├── Notes          ├── Risks
├── Lessons        ├── Incidents
└── Learning       └── Decisions
```

---

### 6.1 Module: Dashboard

Dashboard là **management cockpit**. Mục tiêu: hiểu tình hình tổng thể trong **< 30 giây**.

Phải hiển thị: tasks today · overdue tasks · follow-ups today · reminders · active projects · at-risk projects · upcoming milestones · weekly progress · recent notes · recent lessons · items requiring attention.

Layout tham chiếu:

```text
┌────────────────────────────────────────────────────────────┐
│ LeaderOS                                                   │
├─────────────────────────────┬──────────────────────────────┤
│ MY DAY                      │ PROJECT STATUS               │
│ Tasks: 7                    │ Active: 7                    │
│ Overdue: 2                  │ At Risk: 2                   │
│ Follow-ups: 3               │ Open Incidents: 1            │
├─────────────────────────────┼──────────────────────────────┤
│ PROJECTS                    │ NEED ATTENTION               │
│ MES A        82%            │ CNC protocol blocked         │
│ AI Vision    65%            │ AI workload high             │
│ Tool Mgmt    95%            │ Acceptance not planned       │
├─────────────────────────────┼──────────────────────────────┤
│ THIS WEEK                   │ RECENT KNOWLEDGE             │
│ Planned: 31                 │ CNC test lesson              │
│ Completed: 24               │ FOCAS technical note         │
│ Blocked: 4                  │ System Design learning       │
└─────────────────────────────┴──────────────────────────────┘
```

Toàn bộ số liệu do backend tính, trả về trong một request `GET /api/v1/dashboard`.

---

### 6.2 Module: My Work

#### Today

Hiển thị: top priorities · due today · overdue · follow-ups · reminders · completed today · Quick Note.

#### Tasks

Field: `title`, `description`, `priority`, `status`, `due_date`, `due_time`, `related_project`, `related_member`, `reminder`, `tags`.

```text
Status:    TODO · DOING · WAITING · DONE · CANCELLED
Priority:  LOW · MEDIUM · HIGH · CRITICAL
```

Mọi lần đổi status ghi vào `task_status_history`. Hỗ trợ one-click status update và inline edit.

#### Follow-ups

Follow-up **khác** task thường. Dùng cho: chờ khách hàng · chờ nhà cung cấp · chờ thành viên · chờ xác nhận kỹ thuật · chờ báo giá.

Field: `title`, `waiting_for`, `follow_up_date`, `status`, `related_project`, `note`.

```text
Status: WAITING · RESOLVED · CANCELLED
```

#### Reminders

Gắn được vào: Task · Follow-up · Project · Milestone · Learning item · Decision review.

MVP: **one-time reminder**. Tương lai: daily / weekly / monthly / scheduled summary.

#### Quick Note (global action)

```text
+ Quick Note
```

Ban đầu chỉ cần **text**. Sau khi lưu có thể convert thành: Task · Follow-up · Lesson Learned · Learning Item · Technical Note · Idea.

```text
Nguyên tắc: Capture first, organize later.
```

#### Global Quick Create

```text
+ New  →  Task · Note · Follow-up · Project · Lesson · Learning Item
```

Tương lai: shortcut `Ctrl/Cmd + K`.

---

### 6.3 Module: Projects

#### Project list

Hiển thị: tên · status · progress · deadline · members · health indicator.

```text
Status: PLANNING · ACTIVE · ON_HOLD · AT_RISK · COMPLETED · CANCELLED
```

Dự án hoàn thành vẫn searchable, hiển thị gạch ngang.

#### Project detail — tabs

```text
Overview · Weekly · Milestones · Tasks · Members · Risks
Incidents · Notes · Lessons · Decisions · History
```

#### Project Progress — hai chế độ

**Manual**: Leader tự set `0–100%`.

**Automatic**:

```text
sum(weight of DONE tasks)
------------------------- x 100
sum(weight of active tasks)
```

Task weight cho phép phân biệt mức độ quan trọng:

```text
Database design       2
API implementation    4
UI styling            1
Machine integration   5
```

Mọi thay đổi progress ghi vào `project_progress_snapshots`.

#### Project Members

Member **không đăng nhập**. Quan hệ project–member gồm: `project`, `member`, `project_role`, `allocation_percent` (optional), `joined_at`, `left_at`.

```text
MES Factory A
Thành      Backend
Lộc        CNC Integration
Linh       Frontend
Thư        QA
```

#### Milestones

Ví dụ: Requirement Freeze · Architecture Completed · Development Completed · Integration Test · UAT · Go Live.

```text
Status: NOT_STARTED · IN_PROGRESS · BLOCKED · COMPLETED · CANCELLED
```

#### Weekly Plan

Mỗi dự án có thể có kế hoạch tuần.

```text
Week 39
Goal: Complete Production Tracking Module
Tasks:
  ✅ Work Order API
  ✅ Database
  ⏳ Dashboard
  ⚠ CNC Integration
```

Weekly review lưu: `planned`, `completed`, `blocked`, `carried_over`, `completion_rate`, `summary`. Lịch sử review tuần là dữ liệu quan trọng cho phân tích sau này.

#### Team Workload

Dựa trên `project_members.allocation_percent` và số task đang mở của mỗi member. Dùng để phát hiện member quá tải.

---

### 6.4 Module: Knowledge Base

#### Notes

```text
Type: WORK · IDEA · TECHNICAL · MEETING · GENERAL
```

Field: `title`, `content`, `type`, `related_project`, `related_member`, `tags`, `is_pinned`, `created_at`, `updated_at`.

#### Lessons Learned

Cấu trúc bắt buộc theo 5 phần: `situation` → `problem` → `root_cause` → `lesson` → `future_action`. Liên kết optional tới project và incident.

```text
Project:        MES Factory A
Problem:        CNC integration delayed 8 days.
Root Cause:     FOCAS connection was tested too late.
Lesson:         Validate CNC connectivity during project setup.
Future Action:  Add Machine Connectivity Test to Week 1.
```

#### Learning List

Những thứ Leader muốn học.

```text
Status: BACKLOG · LEARNING · PAUSED · COMPLETED
```

#### Global Search

Tìm được: Projects · Tasks · Members · Notes · Lessons Learned · Learning items · Decisions.

MVP: full-text search trên PostgreSQL. AI search thêm sau.

---

### 6.5 Module: Management

#### Risks

Field: `project`, `title`, `description`, `severity`, `probability`, `status`, `owner_member` (optional), `mitigation`, `due_date`.

```text
Severity: LOW · MEDIUM · HIGH · CRITICAL
Status:   OPEN · MONITORING · MITIGATED · CLOSED
```

#### Incidents

```text
Problem → Investigation → Root Cause → Solution → Prevention → Lesson Learned
```

Field: `project`, `title`, `description`, `severity`, `status`, `detected_at`, `resolved_at`, `root_cause`, `solution`, `prevention`.

Action: **Convert Incident → Lesson Learned**.

#### Decision Journal

Mục đích: lưu các quyết định quản trị quan trọng và **đánh giá lại xem chúng có hiệu quả không**.

```text
Status: DECIDED · REVIEW_PENDING · REVIEWED
```

```text
Decision:  Move Thành from Project B to Project A
Reason:    Project A integration risk
Expected:  Recover milestone by 10 Oct
Actual:    Project A recovered / Project B delayed 2 days
```

Khi tới `review_date`, decision chuyển sang `REVIEW_PENDING` và xuất hiện trong Need Attention.

---

### 6.6 Module: Rule-Based Need Attention Engine

Phiên bản đầu dùng **rule-based logic, không AI**. Mỗi cảnh báo **phải giải thích được lý do**.

| Rule | Điều kiện | Mức | Reason hiển thị |
|---|---|---|---|
| R1 | `task.overdue > 0` | attention | "N task đã quá hạn" |
| R2 | `milestone` quá `target_date` mà chưa `COMPLETED` | attention | "Milestone X quá hạn" |
| R3 | `project.target_date - today <= 14 days` **AND** `progress < 70%` | warning | "Còn N ngày, tiến độ chỉ X%" |
| R4 | tồn tại risk `severity = CRITICAL`, status `OPEN`/`MONITORING` | warning | "Risk critical chưa xử lý" |
| R5 | `follow_up.follow_up_date <= today` và status `WAITING` | attention | "Follow-up đến hạn" |
| R6 | số task blocked của project `>= 3` | warning | "N task đang blocked" |

Logic gốc từ `plan.md` §21:

```text
IF task overdue > 0                                  → attention item
IF milestone overdue                                 → attention item
IF project deadline <= 14 days AND progress < 70%    → warning
IF critical risk exists                              → warning
IF follow_up_date <= today                           → attention item
IF blocked tasks >= 3                                → warning
```

Output contract mỗi attention item:

```text
{ level, entity_type, entity_id, title, reason, rule_code, detected_at }
```

#### Project Health — logic minh bạch

Bốn chiều đánh giá: **Schedule · Execution · Risk · Blockers**.

```text
GREEN
- không có milestone quá hạn
- blocked tasks < 2
- không có risk high/critical

YELLOW
- chậm nhẹ
- blocked tasks 2–3
- tồn tại high risk

RED
- milestone critical quá hạn
- blocked tasks >= 4
- risk critical chưa được giải quyết
```

```text
Không tạo điểm số bí ẩn mà không giải thích được.
```

Toàn bộ phép tính health và attention do **backend service** thực hiện, không tính ở frontend.

---

## 7. API Specification

### Quy chuẩn chung

```text
Base path:      /api/v1
Style:          REST, JSON
Docs:           Swagger / OpenAPI (bắt buộc, mọi endpoint có schema + example)
Auth:           HttpOnly cookie session (single Leader account)
Validation:     Zod / class-validator ở biên, reject sớm với 400
Naming:         resource dạng số nhiều, kebab-case (/follow-ups, /weekly-plans)
Method:         GET (đọc) · POST (tạo) · PATCH (sửa một phần) · DELETE (soft delete)
```

Response envelope:

```json
{ "data": {}, "meta": { "page": 1, "pageSize": 20, "total": 0 } }
```

Error format:

```json
{ "error": { "code": "VALIDATION_ERROR", "message": "...", "details": [] } }
```

Query params chuẩn cho list endpoint: `page`, `pageSize`, `sort`, `order`, `q` (search), cùng các filter theo domain (`status`, `projectId`, `memberId`, `from`, `to`, `priority`, `tag`).

### Endpoint theo module

```text
AUTH
POST   /api/v1/auth/login
POST   /api/v1/auth/logout
GET    /api/v1/auth/me

DASHBOARD
GET    /api/v1/dashboard
GET    /api/v1/dashboard/need-attention

PROJECTS
GET    /api/v1/projects
POST   /api/v1/projects
GET    /api/v1/projects/:id
PATCH  /api/v1/projects/:id
PATCH  /api/v1/projects/:id/progress
POST   /api/v1/projects/:id/complete
GET    /api/v1/projects/:id/history
GET    /api/v1/projects/:id/members
POST   /api/v1/projects/:id/members
PATCH  /api/v1/projects/:id/members/:memberId
DELETE /api/v1/projects/:id/members/:memberId

MEMBERS
GET    /api/v1/members
POST   /api/v1/members
GET    /api/v1/members/:id
PATCH  /api/v1/members/:id
GET    /api/v1/members/workload

MILESTONES
GET    /api/v1/milestones            ?projectId=
POST   /api/v1/milestones
PATCH  /api/v1/milestones/:id

TASKS
GET    /api/v1/tasks                 ?status= &projectId= &dueDate=
POST   /api/v1/tasks
GET    /api/v1/tasks/:id
PATCH  /api/v1/tasks/:id
PATCH  /api/v1/tasks/:id/status
GET    /api/v1/tasks/:id/history
GET    /api/v1/tasks/today

FOLLOW-UPS
GET    /api/v1/follow-ups
POST   /api/v1/follow-ups
PATCH  /api/v1/follow-ups/:id

REMINDERS
GET    /api/v1/reminders
POST   /api/v1/reminders
PATCH  /api/v1/reminders/:id

WEEKLY PLANS
GET    /api/v1/weekly-plans          ?projectId= &year= &week=
POST   /api/v1/weekly-plans
PATCH  /api/v1/weekly-plans/:id
POST   /api/v1/weekly-plans/:id/tasks
POST   /api/v1/weekly-plans/:id/review
GET    /api/v1/weekly-plans/:id/review

NOTES
GET    /api/v1/notes
POST   /api/v1/notes
PATCH  /api/v1/notes/:id
POST   /api/v1/notes/quick
POST   /api/v1/notes/:id/convert

LESSONS
GET    /api/v1/lessons
POST   /api/v1/lessons
PATCH  /api/v1/lessons/:id

LEARNING
GET    /api/v1/learning
POST   /api/v1/learning
PATCH  /api/v1/learning/:id

RISKS
GET    /api/v1/risks                 ?projectId= &severity=
POST   /api/v1/risks
PATCH  /api/v1/risks/:id

INCIDENTS
GET    /api/v1/incidents
POST   /api/v1/incidents
PATCH  /api/v1/incidents/:id
POST   /api/v1/incidents/:id/convert-to-lesson

DECISIONS
GET    /api/v1/decisions
POST   /api/v1/decisions
PATCH  /api/v1/decisions/:id
POST   /api/v1/decisions/:id/review

SEARCH
GET    /api/v1/search                ?q= &types=
```

### Backend modules

```text
auth · users · members · projects · milestones · tasks · weekly-plans
notes · lessons · learning · follow-ups · reminders · risks · incidents
decisions · dashboard · analytics · common
```

---

## 8. UX / UI Principles

### Design goals

```text
Professional · Fast scanning · Desktop-first · Minimal distraction · Management-oriented
```

### Nên dùng

- Left sidebar điều hướng, top action bar
- Compact table cho danh sách
- Status chip theo enum, màu nhất quán toàn hệ thống
- Progress bar cho project / milestone
- Inline editing tại chỗ
- Drawer / modal cho quick create

### Tránh

```text
Gradient thừa · Glassmorphism · Quá nhiều animation
Card quá to · Chart trang trí không mang thông tin
```

### Ràng buộc hiệu năng trải nghiệm

| Chỉ tiêu | Mục tiêu |
|---|---|
| Hiểu tình hình tổng thể | < 30 giây |
| Capture một note/task | < 15 giây |
| Cập nhật hằng ngày | 5–10 phút |

### Accessibility

Label đầy đủ cho mọi input · focus state rõ ràng · điều hướng được bằng keyboard · contrast đạt chuẩn · không truyền tải thông tin chỉ bằng màu (status chip luôn kèm text).

### MVP Pages

```text
/login
/dashboard
/today
/tasks
/follow-ups
/projects
/projects/[id]
/members
/notes
/lessons
/learning
/settings
```

---

## 9. Technology Stack

| Lớp | Công nghệ |
|---|---|
| Frontend | Next.js · TypeScript · Tailwind CSS · shadcn/ui · React Hook Form · Zod · TanStack Query |
| Backend | NestJS · TypeScript · REST API · Swagger/OpenAPI |
| Database | PostgreSQL · Prisma |
| Auth (MVP) | 1 Leader account · email + password · HttpOnly cookie/session |
| Monorepo | pnpm workspaces |
| Analytics (sau MVP) | ECharts |

MVP **không** implement permission phức tạp.

### Repository structure

```text
leader-os/
├── apps/
│   ├── web/                # Next.js
│   └── api/                # NestJS
├── packages/
│   └── shared-types/
├── docs/
│   ├── architecture.md
│   ├── database.md
│   └── analytics.md
├── plan.md
├── spec.md
├── backlog.md
├── CLAUDE.md
├── README.md
└── docker-compose.yml
```

---

## 10. Out of Scope cho MVP

```text
Multi-tenant organizations · Complex RBAC · Member login
Chat · Comments · Mentions · Real-time collaboration
Mobile app · Microservices · Kafka · Kubernetes
Workflow engine · AI agent · Vector database · Automatic forecasting
HRM · CRM · Payroll · Attendance
```

---

## 11. Định hướng tương lai (không làm trong MVP)

### Analytics metrics

```text
Project progress trend · Weekly completion rate · Overdue task trend
Blocked task trend · Milestone delay · Project velocity
Member project allocation · Incident frequency · Risk trend
Decision review outcome
```

Analytics được tính bởi backend service.

### AI architecture

```text
PostgreSQL → Domain Services → Calculation Service → Management Metrics
→ Context Builder → LLM → Analysis / Options / Recommendation → Leader Decision
```

AI nhận **structured context**, không truy vấn raw database:

```json
{
  "project": {},
  "metrics": {},
  "risks": [],
  "blocked_tasks": [],
  "milestones": [],
  "recent_incidents": [],
  "relevant_lessons": [],
  "recent_decisions": []
}
```

```text
Tránh: AI → raw database → tự quyết định mọi thứ
```

### Decision support output format

```text
Observation → Evidence → Possible Cause
→ Option A / B / C (Benefit · Cost · Risk)
→ Assumptions → Leader Decision
```

Hệ thống cung cấp **phương án và bằng chứng**. Leader ra quyết định cuối cùng.

---

## 11.2 Internationalization (i18n) & Navigation Top-Bar

Hệ thống LeaderOS hỗ trợ chuyển đổi đa ngôn ngữ cho 4 khu vực:
- `vi`: Tiếng Việt (Mặc định & Fallback)
- `en`: English
- `zh-CN`: 简体中文 (Simplified Chinese)
- `zh-TW`: 繁體中文 (Traditional Chinese)

### Cơ chế Frontend:
- Thư viện: `i18next` + `react-i18next`.
- Chuyển đổi ngôn ngữ tức thì qua React state re-render (không cần reload trang).
- Tự động duy trì lựa chọn ngôn ngữ người dùng qua Cookie (`NEXT_LOCALE`) và `localStorage` (`leaderos_locale`).
- Mọi API request qua `apiClient` tự động truyền kèm header `Accept-Language: <currentLocale>`.

### Cơ chế Backend (NestJS):
- `HttpExceptionFilter` đọc header `Accept-Language` và chuyển đổi thông điệp lỗi sang ngôn ngữ yêu cầu (mã 400, 401, 403, 404, 409, 500 cùng các thông báo xác thực và nghiệp vụ).

### Giao diện Top-Bar Header (Góc trên bên phải):
- Biểu tượng 🔔 Thông báo (hiển thị badge đếm cảnh báo Need Attention Engine / việc quá hạn).
- Biểu tượng ❓ Tài liệu & Hướng dẫn (Docs & Help modal).
- Biểu tượng 💬 Ghi chú nhanh (Quick Note dialog) & Phản hồi.
- Vạch ngăn cách `|`.
- Thẻ tài khoản Leader Profile:
  - Avatar, Badge `Admin`, Email, Team.
  - Menu: ⚙️ Settings, 🌐 Languages (Flyout Sub-menu sang bên trái: 繁體中文, 简体中文, English, Tiếng Việt), ↪️ Logout.

---

## 12. Success Criteria

```text
Leader mở hệ thống mỗi ngày làm việc.
Leader hiểu trạng thái dự án trong vòng 30 giây.
Một note/task được capture trong dưới 15 giây.
Weekly review không phải dựng lại lịch sử bằng tay.
Follow-up quan trọng không bị bỏ quên.
Lesson learned tìm lại và tái sử dụng được.
Dữ liệu lịch sử dự án trở nên hữu ích cho quyết định sau này.
```
