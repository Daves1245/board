-- AlterTable
ALTER TABLE "Feature" ADD COLUMN     "implementationStartedAt" TIMESTAMP(3),
ADD COLUMN     "status" TEXT NOT NULL DEFAULT 'pending';

-- CreateIndex
CREATE INDEX "Feature_status_idx" ON "Feature"("status");
