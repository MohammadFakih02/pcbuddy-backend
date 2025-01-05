/*
  Warnings:

  - You are about to drop the column `preferences` on the `User` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "PersonalPC" ADD COLUMN     "addToProfile" BOOLEAN NOT NULL DEFAULT false;

-- AlterTable
ALTER TABLE "User" DROP COLUMN "preferences";
