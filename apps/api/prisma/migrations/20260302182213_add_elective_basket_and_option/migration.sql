-- CreateTable
CREATE TABLE "elective_baskets" (
    "id" TEXT NOT NULL,
    "departmentId" TEXT NOT NULL,
    "subjectCode" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "semester" INTEGER,
    "program" TEXT,
    "weeklyHrs" INTEGER NOT NULL DEFAULT 2,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "elective_baskets_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "elective_options" (
    "id" TEXT NOT NULL,
    "basketId" TEXT NOT NULL,
    "courseId" TEXT NOT NULL,
    "facultyId" TEXT,
    "enrollmentCount" INTEGER NOT NULL DEFAULT 30,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "elective_options_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "elective_baskets" ADD CONSTRAINT "elective_baskets_departmentId_fkey" FOREIGN KEY ("departmentId") REFERENCES "departments"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "elective_options" ADD CONSTRAINT "elective_options_basketId_fkey" FOREIGN KEY ("basketId") REFERENCES "elective_baskets"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "elective_options" ADD CONSTRAINT "elective_options_courseId_fkey" FOREIGN KEY ("courseId") REFERENCES "courses"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "elective_options" ADD CONSTRAINT "elective_options_facultyId_fkey" FOREIGN KEY ("facultyId") REFERENCES "faculty"("id") ON DELETE SET NULL ON UPDATE CASCADE;
