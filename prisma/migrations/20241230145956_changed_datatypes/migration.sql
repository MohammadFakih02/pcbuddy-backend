/*
  Warnings:

  - The `capacity` column on the `Storage` table would be dropped and recreated. This will lead to data loss if there is data in the column.

*/
-- AlterTable
ALTER TABLE "Case" ALTER COLUMN "maxVideoCardLength" SET DATA TYPE DOUBLE PRECISION;

-- AlterTable
ALTER TABLE "Cpu" ALTER COLUMN "maxSupportedMemory" SET DATA TYPE DOUBLE PRECISION;

-- AlterTable
ALTER TABLE "Gpu" ALTER COLUMN "coreClock" SET DATA TYPE TEXT,
ALTER COLUMN "boostClock" SET DATA TYPE TEXT,
ALTER COLUMN "effectiveMemoryClock" SET DATA TYPE TEXT,
ALTER COLUMN "length" SET DATA TYPE DOUBLE PRECISION,
ALTER COLUMN "memory" SET DATA TYPE DOUBLE PRECISION;

-- AlterTable
ALTER TABLE "Memory" ALTER COLUMN "modules" SET DATA TYPE TEXT;

-- AlterTable
ALTER TABLE "Motherboard" ALTER COLUMN "m2Slots" SET DATA TYPE TEXT,
ALTER COLUMN "onboardEthernet" SET DATA TYPE TEXT,
ALTER COLUMN "wirelessNetworking" SET DATA TYPE TEXT;

-- AlterTable
ALTER TABLE "PowerSupply" ALTER COLUMN "length" SET DATA TYPE DOUBLE PRECISION;

-- AlterTable
ALTER TABLE "Storage" DROP COLUMN "capacity",
ADD COLUMN     "capacity" DOUBLE PRECISION;
