/*
  Warnings:

  - You are about to drop the column `includesCooler` on the `Cpu` table. All the data in the column will be lost.
  - The `maxSupportedMemory` column on the `Cpu` table would be dropped and recreated. This will lead to data loss if there is data in the column.

*/
-- AlterTable
ALTER TABLE "Cpu" DROP COLUMN "includesCooler",
DROP COLUMN "maxSupportedMemory",
ADD COLUMN     "maxSupportedMemory" INTEGER;
