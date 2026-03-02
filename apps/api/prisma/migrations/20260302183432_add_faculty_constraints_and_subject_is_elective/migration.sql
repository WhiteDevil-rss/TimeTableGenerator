-- AlterTable
ALTER TABLE "courses" ADD COLUMN     "isElective" BOOLEAN NOT NULL DEFAULT false;

-- AlterTable
ALTER TABLE "faculty" ADD COLUMN     "availability" JSONB,
ADD COLUMN     "maxHrsPerDay" INTEGER NOT NULL DEFAULT 6,
ADD COLUMN     "maxHrsPerWeek" INTEGER NOT NULL DEFAULT 30;
