/*
  Warnings:

  - You are about to drop the column `buildDate` on the `PersonalPC` table. All the data in the column will be lost.
  - Added the required column `updatedAt` to the `PersonalPC` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "PersonalPC" DROP COLUMN "buildDate",
ADD COLUMN     "updatedAt" TIMESTAMP(3) NOT NULL;
