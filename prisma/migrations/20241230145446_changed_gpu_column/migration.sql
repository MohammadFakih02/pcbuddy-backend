/*
  Warnings:

  - The `memory` column on the `Gpu` table would be dropped and recreated. This will lead to data loss if there is data in the column.

*/
-- AlterTable
ALTER TABLE "Gpu" DROP COLUMN "memory",
ADD COLUMN     "memory" INTEGER;
