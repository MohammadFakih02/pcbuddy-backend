-- CreateTable
CREATE TABLE "PrebuiltPC" (
    "id" SERIAL NOT NULL,
    "engineerId" INTEGER NOT NULL,
    "cpuId" INTEGER,
    "gpuId" INTEGER,
    "memoryId" INTEGER,
    "motherboardId" INTEGER,
    "powerSupplyId" INTEGER,
    "storageId" INTEGER,
    "storageId2" INTEGER,
    "caseId" INTEGER,
    "totalPrice" DOUBLE PRECISION DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "rating" DOUBLE PRECISION,

    CONSTRAINT "PrebuiltPC_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "PrebuiltPC" ADD CONSTRAINT "PrebuiltPC_engineerId_fkey" FOREIGN KEY ("engineerId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PrebuiltPC" ADD CONSTRAINT "PrebuiltPC_cpuId_fkey" FOREIGN KEY ("cpuId") REFERENCES "Cpu"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PrebuiltPC" ADD CONSTRAINT "PrebuiltPC_gpuId_fkey" FOREIGN KEY ("gpuId") REFERENCES "Gpu"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PrebuiltPC" ADD CONSTRAINT "PrebuiltPC_memoryId_fkey" FOREIGN KEY ("memoryId") REFERENCES "Memory"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PrebuiltPC" ADD CONSTRAINT "PrebuiltPC_motherboardId_fkey" FOREIGN KEY ("motherboardId") REFERENCES "Motherboard"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PrebuiltPC" ADD CONSTRAINT "PrebuiltPC_powerSupplyId_fkey" FOREIGN KEY ("powerSupplyId") REFERENCES "PowerSupply"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PrebuiltPC" ADD CONSTRAINT "PrebuiltPC_storageId_fkey" FOREIGN KEY ("storageId") REFERENCES "Storage"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PrebuiltPC" ADD CONSTRAINT "PrebuiltPC_storageId2_fkey" FOREIGN KEY ("storageId2") REFERENCES "Storage"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PrebuiltPC" ADD CONSTRAINT "PrebuiltPC_caseId_fkey" FOREIGN KEY ("caseId") REFERENCES "Case"("id") ON DELETE SET NULL ON UPDATE CASCADE;
