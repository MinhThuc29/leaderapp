-- CreateEnum
CREATE TYPE "WeeklyPlanStatus" AS ENUM ('DRAFT', 'ACTIVE', 'COMPLETED');

-- AlterTable
ALTER TABLE "weekly_plans" ADD COLUMN     "status" "WeeklyPlanStatus" NOT NULL DEFAULT 'ACTIVE';

-- AlterTable
ALTER TABLE "weekly_reviews" ADD COLUMN     "achievements" TEXT,
ADD COLUMN     "challenges" TEXT,
ADD COLUMN     "improvements" TEXT;
