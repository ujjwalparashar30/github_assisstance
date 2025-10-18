/*
  Warnings:

  - Made the column `guestId` on table `Resume` required. This step will fail if there are existing NULL values in that column.

*/
-- AlterTable
ALTER TABLE "Resume" ALTER COLUMN "guestId" SET NOT NULL;
