-- CreateTable
CREATE TABLE "DynamicQuestionSet" (
    "id" SERIAL NOT NULL,
    "resumeId" INTEGER NOT NULL,
    "questions" JSONB NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "DynamicQuestionSet_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "DynamicQuestionSet" ADD CONSTRAINT "DynamicQuestionSet_resumeId_fkey" FOREIGN KEY ("resumeId") REFERENCES "Resume"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
