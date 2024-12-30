/*
  Warnings:

  - You are about to drop the column `specsNumber` on the `Memory` table. All the data in the column will be lost.
  - You are about to drop the column `specsNumber` on the `PowerSupply` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "Memory" DROP COLUMN "specsNumber";

-- AlterTable
ALTER TABLE "PowerSupply" DROP COLUMN "specsNumber";
