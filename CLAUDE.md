# CLAUDE.md — Quy định làm việc cho AI Coding Agent (LeaderOS)

> File này là **hợp đồng làm việc** giữa AI Agent và dự án LeaderOS.
> Nguồn sự thật về nghiệp vụ: `plan.md` → `spec.md`. Nguồn sự thật về tiến độ: `backlog.md`.
> Khi xung đột: `plan.md` > `spec.md` > `CLAUDE.md` > suy đoán của Agent.

---

## 1. Bối cảnh dự án

LeaderOS là **hệ điều hành quản trị cá nhân cho một Engineering Leader**.

```text
Không phải: Jira clone, team collaboration tool, generic to-do app.
Là: hệ thống capture thông tin → quản lý việc/dự án → học từ kinh nghiệm → ra quyết định tốt hơn.
```

Triết lý xuyên suốt, mọi tính năng phải phục vụ chuỗi này:

```text
Capture → Organize → Execute → Track → Review → Learn → Analyze → Decide
```

---

## 2. Quy trình bắt buộc: Vibe Coding Kỷ Luật

Mỗi task đi qua **4 bước, không được bỏ bước nào**.

### Bước 1 — INSPECT (bắt buộc trước khi sửa bất cứ thứ gì)

Trước khi viết hoặc sửa một dòng code:

- [ ] Đọc `spec.md` phần liên quan đến module đang làm.
- [ ] Đọc `backlog.md` để xác định task hiện tại thuộc Phase nào.
- [ ] Đọc code hiện có: schema Prisma, module NestJS, component/route Next.js liên quan.
- [ ] Tìm pattern đã tồn tại trong repo (naming, DTO, service, error handling, folder layout) và **bám theo pattern đó**.
- [ ] Xác nhận file/hàm/field cần sửa **thực sự tồn tại** — không sửa theo ký ức hay giả định.

```text
CẤM: tạo file mới khi đã có file cùng chức năng.
CẤM: viết lại từ đầu module đang chạy được.
CẤM: đoán tên field/model — luôn mở schema ra đọc.
```

### Bước 2 — PLAN

- Nêu ngắn gọn: sẽ sửa file nào, thêm gì, thứ tự thực hiện.
- Nếu task chạm > 3 file hoặc đổi schema DB → trình bày plan trước, chờ xác nhận.
- Nếu yêu cầu của user mâu thuẫn với `spec.md` → **nói ra sự mâu thuẫn**, không tự ý chọn bên.

### Bước 3 — IMPLEMENT

- Làm đúng phạm vi task. Không thêm feature, không thêm abstraction, không "dọn dẹp" code ngoài phạm vi.
- Edit tối thiểu (surgical edit), không rewrite cả file để đổi vài dòng.
- Commit theo từng slice hoàn chỉnh, không commit code nửa vời.

### Bước 4 — VERIFY

- [ ] `pnpm typecheck` pass (0 error).
- [ ] `pnpm lint` pass.
- [ ] Build pass: `pnpm build` cho app bị ảnh hưởng.
- [ ] Prisma: `prisma migrate dev` chạy được, `prisma generate` thành công.
- [ ] Test API bằng Swagger hoặc request thực tế trước khi báo hoàn thành.
- Báo cáo trung thực: test fail thì nói fail kèm output; bước nào bỏ qua thì nói rõ đã bỏ qua.

```text
CẤM: báo "đã xong" khi chưa chạy typecheck/build.
```

---

## 3. Quy tắc Single-user (quan trọng nhất về mặt domain)

```text
User   = Leader (người duy nhất đăng nhập hệ thống)
Member = thành viên do Leader quản lý (KHÔNG có account, KHÔNG đăng nhập)

User != Member
```

Hệ quả bắt buộc khi code:

- `users` và `members` là **hai bảng hoàn toàn tách biệt**. Không FK từ `members` sang `users` theo nghĩa "member là một user".
- `members` **không có** `password`, `email_login`, `last_login`, `role_permission`.
- Mọi bản ghi nghiệp vụ được tạo bởi Leader → `owner_id` / `created_by` trỏ về `users.id`.
- Mọi bản ghi gán cho người thực thi → `member_id` trỏ về `members.id`.
- MVP: **1 account Leader duy nhất**, email + password, session qua HttpOnly cookie.
- MVP: **không** RBAC phức tạp, **không** multi-tenant, **không** member login, **không** invite flow.

```text
CẤM: thêm bảng roles/permissions/organizations trong MVP.
CẤM: dùng member_id ở chỗ đáng lẽ là user_id và ngược lại.
```

Khi mở rộng sau này (multi-user), thiết kế hiện tại phải cho phép thêm mà **không phá** dữ liệu cũ — nên luôn tách `owner_id` rõ ràng ngay từ đầu.

---

## 4. Quy tắc Vertical Slice

Mỗi feature được hoàn thành **theo chiều dọc, đúng thứ tự**:

```text
1. DATABASE   → Prisma schema + migration + enum + seed (nếu cần)
2. SHARED     → types/enum dùng chung trong packages/shared-types
3. API        → NestJS module: DTO (Zod/class-validator) → Service → Controller → Swagger
4. FRONTEND   → API client (TanStack Query) → Form (React Hook Form + Zod) → UI (shadcn/ui)
5. VERIFY     → typecheck + build + thử luồng thật trên UI
```

Nguyên tắc:

- Không làm UI trước khi API trả dữ liệu thật. **Không mock data để "cho có UI"**.
- Không tạo API endpoint trước khi schema DB đã migrate.
- Hoàn thành 1 slice chạy được end-to-end rồi mới sang slice kế tiếp.
- Không làm song song nhiều feature nửa vời.

```text
ĐÚNG:  Members: schema → migration → API CRUD → trang /members hoạt động → xong.
SAI:   dựng 12 trang UI rỗng trước, rồi mới nghĩ tới database.
```

---

## 5. Quy tắc TypeScript & chất lượng code

### Strict TypeScript, tuyệt đối không `any`

```text
CẤM: any
CẤM: as any
CẤM: @ts-ignore, @ts-expect-error (trừ khi có comment giải thích + link issue)
CẤM: ép kiểu bừa để làm tắt lỗi compile
```

Thay thế hợp lệ: `unknown` + type guard, generic, discriminated union, Zod `infer`.

`tsconfig` bắt buộc bật:

```text
strict: true
noUncheckedIndexedAccess: true
noImplicitOverride: true
exactOptionalPropertyTypes: true
```

### Nguyên tắc khác

- **Validate ở biên**: mọi input từ client đi qua Zod/DTO validation trước khi tới service.
- **Type dùng chung** (enum status, DTO response) đặt ở `packages/shared-types`, không copy-paste giữa web và api.
- **Không business logic trong controller** — controller chỉ nhận/trả; logic nằm ở service.
- **Không raw SQL** khi Prisma làm được; nếu buộc phải dùng, có comment lý do.
- **Không secret trong code** — dùng `.env`, không commit `.env`.
- Tên bảng/column: `snake_case`. Tên model Prisma: `PascalCase`. Biến/hàm TS: `camelCase`.
- Enum status dùng `UPPER_SNAKE_CASE`, khớp đúng giá trị đã định nghĩa trong `spec.md`.

---

## 6. Cấu trúc Monorepo tiêu chuẩn

Quản lý bằng **pnpm workspaces**. Không đổi layout này mà không cập nhật `CLAUDE.md`.

```text
leader-os/
│
├── apps/
│   ├── web/                    # Next.js (App Router) + TypeScript
│   │   ├── src/app/            # routes: /login /dashboard /today /tasks ...
│   │   ├── src/components/     # ui/ (shadcn) + feature components
│   │   ├── src/lib/            # api client, query client, utils
│   │   └── src/features/       # tổ chức theo domain, không theo loại file
│   │
│   └── api/                    # NestJS + TypeScript + REST + Swagger
│       ├── src/modules/        # auth, members, projects, tasks, ...
│       ├── src/common/         # guards, filters, interceptors, pipes
│       ├── prisma/schema.prisma
│       └── prisma/migrations/
│
├── packages/
│   └── shared-types/           # enum + DTO type dùng chung web ↔ api
│
├── docs/
│   ├── architecture.md
│   ├── database.md
│   └── analytics.md
│
├── plan.md                     # bản thiết kế gốc (read-only reference)
├── spec.md                     # yêu cầu kỹ thuật + data model
├── backlog.md                  # tiến độ theo Phase
├── CLAUDE.md
├── README.md
├── docker-compose.yml          # PostgreSQL
└── pnpm-workspace.yaml
```

Backend modules (đúng danh sách trong `plan.md` §26):

```text
auth · users · members · projects · milestones · tasks · weekly-plans
notes · lessons · learning · follow-ups · reminders · risks · incidents
decisions · dashboard · analytics · common
```

---

## 7. Tech stack đã chốt — không tự ý thay thế

| Lớp | Công nghệ |
|---|---|
| Frontend | Next.js, TypeScript, Tailwind CSS, shadcn/ui, React Hook Form, Zod, TanStack Query |
| Backend | NestJS, TypeScript, REST API, Swagger/OpenAPI |
| Database | PostgreSQL + Prisma |
| Auth | Single Leader account, email + password, HttpOnly cookie/session |
| Package manager | pnpm (workspaces) |
| Charts (sau MVP) | ECharts |

```text
CẤM thêm vào MVP: Redux, GraphQL, tRPC, Kafka, Kubernetes, microservices,
microfrontend, ORM thứ hai, UI library thứ hai, vector database, AI agent.
```

Muốn thêm dependency mới: nêu lý do + pin version cụ thể + chờ xác nhận.

---

## 8. Quy tắc Database khi code

1. ID dùng **UUID/CUID**, không dùng auto-increment int.
2. Mọi bảng nghiệp vụ có `created_at`, `updated_at`.
3. **Giữ history** ở nơi analytics tương lai cần: progress snapshot, task status history, weekly review.
4. Status ổn định → dùng **enum**, không dùng string tự do.
5. **Không** lưu trùng số liệu tổng đã tính được (dashboard totals), trừ khi có lý do performance rõ ràng.
6. Bản ghi lịch sử quan trọng → **soft delete** (`deleted_at`), không hard delete.
7. Mỗi thay đổi schema = một migration có tên mô tả rõ. Không sửa migration đã commit.

---

## 9. Nguyên tắc UI khi code

Mục tiêu: **Professional · Fast scanning · Desktop-first · Minimal distraction · Management-oriented**.

Dùng: left sidebar, top action bar, compact table, status chip, progress bar, inline edit, drawer/modal cho quick create.

```text
TRÁNH: gradient thừa, glassmorphism, animation nhiều, card quá to, chart trang trí.
```

Ràng buộc trải nghiệm phải giữ được:

- Hiểu tình hình tổng thể trong **< 30 giây** khi mở Dashboard.
- Capture một note/task trong **< 15 giây**.
- Cập nhật hằng ngày trong **5–10 phút**.
- Accessibility: label đầy đủ, focus state rõ, keyboard navigable, contrast đạt chuẩn.

---

## 10. AI later, data first

- MVP: **Need My Attention là rule-based**, logic minh bạch, mỗi cảnh báo phải giải thích được lý do.
- Không gọi LLM trong MVP. Không tạo bảng embedding/vector.
- Mọi phép tính (progress, health, completion rate) do backend service tính, không tính ở frontend.
- Không tạo "điểm số bí ẩn" không giải thích được.

---

## 11. Giới hạn của Agent trong repo này

```text
KHÔNG tự ý: drop table, reset database, xoá migration, xoá thư mục,
            force push, đổi git config, commit khi chưa được yêu cầu,
            push trực tiếp lên main/master.
```

- Thao tác không thể hoàn tác hoặc ảnh hưởng dữ liệu → giải thích rủi ro và chờ xác nhận.
- Cập nhật `backlog.md` (tick `- [x]`) ngay khi một task hoàn thành và đã verify.
- Nếu một cách làm đã fail 2 lần: dừng vá vặt, nêu nguyên nhân gốc, đổi hướng tiếp cận.
