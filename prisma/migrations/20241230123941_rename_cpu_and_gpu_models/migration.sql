/*
  Warnings:

  - You are about to drop the `CPU` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `GPU` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE "PersonalPC" DROP CONSTRAINT "PersonalPC_cpuId_fkey";

-- DropForeignKey
ALTER TABLE "PersonalPC" DROP CONSTRAINT "PersonalPC_gpuId_fkey";

-- DropTable
DROP TABLE "CPU";

-- DropTable
DROP TABLE "GPU";

-- CreateTable
CREATE TABLE "Cpu" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "imageUrl" TEXT,
    "productUrl" TEXT,
    "price" DOUBLE PRECISION,
    "manufacturer" TEXT,
    "series" TEXT,
    "microarchitecture" TEXT,
    "socket" TEXT,
    "coreCount" INTEGER,
    "performanceCoreClock" DOUBLE PRECISION,
    "performanceCoreBoostClock" DOUBLE PRECISION,
    "efficiencyCoreClock" DOUBLE PRECISION,
    "efficiencyCoreBoostClock" DOUBLE PRECISION,
    "l2Cache" TEXT,
    "l3Cache" TEXT,
    "tdp" INTEGER,
    "integratedGraphics" TEXT,
    "maxSupportedMemory" TEXT,
    "includesCooler" BOOLEAN,
    "simultaneousMultithreading" BOOLEAN,

    CONSTRAINT "Cpu_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Gpu" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "imageUrl" TEXT,
    "productUrl" TEXT,
    "price" DOUBLE PRECISION,
    "manufacturer" TEXT,
    "chipset" TEXT,
    "memory" TEXT,
    "memoryType" TEXT,
    "coreClock" DOUBLE PRECISION,
    "boostClock" DOUBLE PRECISION,
    "effectiveMemoryClock" DOUBLE PRECISION,
    "color" TEXT,
    "frameSync" TEXT,
    "length" INTEGER,
    "tdp" INTEGER,
    "caseExpansionSlotWidth" INTEGER,
    "totalSlotWidth" INTEGER,
    "externalPower" TEXT,

    CONSTRAINT "Gpu_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "PersonalPC" ADD CONSTRAINT "PersonalPC_cpuId_fkey" FOREIGN KEY ("cpuId") REFERENCES "Cpu"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PersonalPC" ADD CONSTRAINT "PersonalPC_gpuId_fkey" FOREIGN KEY ("gpuId") REFERENCES "Gpu"("id") ON DELETE SET NULL ON UPDATE CASCADE;
