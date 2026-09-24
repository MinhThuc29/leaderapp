# LeaderOS

Hệ điều hành quản trị cá nhân cho Engineering Leader.

## Cấu trúc Monorepo

- `apps/web`: Next.js (App Router), TypeScript, Tailwind CSS, shadcn/ui
- `apps/api`: NestJS, TypeScript, REST API, Swagger/OpenAPI, Prisma ORM
- `packages/shared-types`: Các types, DTOs, Enums dùng chung giữa web và api

## Yêu cầu môi trường

- Node.js >= 20
- pnpm >= 9 (khuyên dùng `pnpm.cmd` trên Windows PowerShell nếu có script restriction)
- Docker & Docker Compose

## Khởi chạy nhanh môi trường Local

### 1. Cài đặt dependencies
```bash
pnpm install
```

### 2. Thiết lập cơ sở dữ liệu (PostgreSQL)
```bash
# Khởi chạy PostgreSQL container
docker compose up -d

# Sinh Prisma Client
pnpm db:generate

# Chạy migration DB
pnpm db:migrate
```

### 3. Khởi chạy toàn bộ hệ thống
```bash
# Chạy đồng thời cả Frontend và Backend
pnpm dev

# Hoặc chạy riêng từng service:
pnpm dev:api   # Backend chạy tại http://localhost:4000 (Swagger docs: http://localhost:4000/api/docs)
pnpm dev:web   # Frontend chạy tại http://localhost:3000
```

## Kiểm tra chất lượng mã nguồn
```bash
pnpm typecheck   # Kiểm tra strict TypeScript (0 errors)
pnpm lint        # Kiểm tra ESLint
pnpm build       # Build toàn bộ dự án
```
