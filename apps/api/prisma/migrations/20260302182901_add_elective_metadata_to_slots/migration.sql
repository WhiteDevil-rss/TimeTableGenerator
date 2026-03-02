-- AlterTable
ALTER TABLE "timetable_slots" ADD COLUMN     "basketId" TEXT,
ADD COLUMN     "isElective" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "optionId" TEXT;
