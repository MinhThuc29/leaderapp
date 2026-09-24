-- CreateEnum
CREATE TYPE "ProjectStatus" AS ENUM ('PLANNING', 'ACTIVE', 'ON_HOLD', 'AT_RISK', 'COMPLETED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "ProgressMode" AS ENUM ('MANUAL', 'AUTO');

-- CreateEnum
CREATE TYPE "HealthStatus" AS ENUM ('GREEN', 'YELLOW', 'RED');

-- CreateEnum
CREATE TYPE "Priority" AS ENUM ('LOW', 'MEDIUM', 'HIGH', 'CRITICAL');

-- CreateEnum
CREATE TYPE "TaskStatus" AS ENUM ('TODO', 'DOING', 'WAITING', 'DONE', 'CANCELLED');

-- CreateEnum
CREATE TYPE "MilestoneStatus" AS ENUM ('NOT_STARTED', 'IN_PROGRESS', 'BLOCKED', 'COMPLETED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "FollowUpStatus" AS ENUM ('WAITING', 'RESOLVED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "NoteType" AS ENUM ('WORK', 'IDEA', 'TECHNICAL', 'MEETING', 'GENERAL');

-- CreateEnum
CREATE TYPE "LearningStatus" AS ENUM ('BACKLOG', 'LEARNING', 'PAUSED', 'COMPLETED');

-- CreateEnum
CREATE TYPE "Severity" AS ENUM ('LOW', 'MEDIUM', 'HIGH', 'CRITICAL');

-- CreateEnum
CREATE TYPE "Probability" AS ENUM ('LOW', 'MEDIUM', 'HIGH');

-- CreateEnum
CREATE TYPE "RiskStatus" AS ENUM ('OPEN', 'MONITORING', 'MITIGATED', 'CLOSED');

-- CreateEnum
CREATE TYPE "IncidentStatus" AS ENUM ('OPEN', 'INVESTIGATING', 'RESOLVED', 'CLOSED');

-- CreateEnum
CREATE TYPE "DecisionStatus" AS ENUM ('DECIDED', 'REVIEW_PENDING', 'REVIEWED');

-- CreateEnum
CREATE TYPE "ReminderEntity" AS ENUM ('TASK', 'FOLLOW_UP', 'PROJECT', 'MILESTONE', 'LEARNING', 'DECISION_REVIEW');

-- CreateTable
CREATE TABLE "system_health" (
    "id" UUID NOT NULL,
    "key" TEXT NOT NULL,
    "value" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "deleted_at" TIMESTAMP(3),

    CONSTRAINT "system_health_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "system_health_key_key" ON "system_health"("key");
