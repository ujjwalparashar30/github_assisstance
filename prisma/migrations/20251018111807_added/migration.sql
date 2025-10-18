/*
  Warnings:

  - You are about to drop the column `userId` on the `Resume` table. All the data in the column will be lost.
  - You are about to drop the `User` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE "public"."Resume" DROP CONSTRAINT "Resume_userId_fkey";

-- AlterTable
ALTER TABLE "Resume" DROP COLUMN "userId",
ADD COLUMN     "guestId" TEXT,
ADD COLUMN     "resumeText" TEXT;

-- DropTable
DROP TABLE "public"."User";
