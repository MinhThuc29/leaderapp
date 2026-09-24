-- AlterTable
ALTER TABLE "learning_items" ADD COLUMN     "category" TEXT;

-- CreateTable
CREATE TABLE "lesson_tags" (
    "id" UUID NOT NULL,
    "lesson_id" UUID NOT NULL,
    "tag_id" UUID NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "lesson_tags_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "lesson_tags_lesson_id_tag_id_key" ON "lesson_tags"("lesson_id", "tag_id");

-- AddForeignKey
ALTER TABLE "lesson_tags" ADD CONSTRAINT "lesson_tags_lesson_id_fkey" FOREIGN KEY ("lesson_id") REFERENCES "lessons_learned"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "lesson_tags" ADD CONSTRAINT "lesson_tags_tag_id_fkey" FOREIGN KEY ("tag_id") REFERENCES "tags"("id") ON DELETE CASCADE ON UPDATE CASCADE;
