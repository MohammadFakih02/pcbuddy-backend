-- CreateTable
CREATE TABLE "CPU" (
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

    CONSTRAINT "CPU_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Case" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "imageUrl" TEXT,
    "productUrl" TEXT,
    "price" DOUBLE PRECISION,
    "manufacturer" TEXT,
    "partNumber" TEXT,
    "type" TEXT,
    "color" TEXT,
    "powerSupply" TEXT,
    "sidePanel" TEXT,
    "powerSupplyShroud" BOOLEAN,
    "frontPanelUsb" TEXT,
    "motherboardFormFactor" TEXT,
    "maxVideoCardLength" INTEGER,
    "driveBays" TEXT,
    "expansionSlots" TEXT,
    "dimensions" TEXT,

    CONSTRAINT "Case_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "GPU" (
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

    CONSTRAINT "GPU_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Memory" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "imageUrl" TEXT,
    "productUrl" TEXT,
    "price" DOUBLE PRECISION,
    "manufacturer" TEXT,
    "speed" TEXT,
    "formFactor" TEXT,
    "modules" INTEGER,
    "pricePerGb" DOUBLE PRECISION,
    "color" TEXT,
    "firstWordLatency" DOUBLE PRECISION,
    "casLatency" DOUBLE PRECISION,
    "voltage" DOUBLE PRECISION,
    "timing" TEXT,
    "heatSpreader" BOOLEAN,
    "specsNumber" TEXT,

    CONSTRAINT "Memory_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Motherboard" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "imageUrl" TEXT,
    "productUrl" TEXT,
    "price" DOUBLE PRECISION,
    "manufacturer" TEXT,
    "chipset" TEXT,
    "memoryMax" INTEGER,
    "memoryType" TEXT,
    "memorySlots" INTEGER,
    "memorySpeed" TEXT,
    "pcieX16Slots" INTEGER,
    "m2Slots" INTEGER,
    "sata6Gbps" INTEGER,
    "onboardEthernet" BOOLEAN,
    "usb20Headers" INTEGER,
    "usb32Gen1Headers" INTEGER,
    "usb32Gen2Headers" INTEGER,
    "usb32Gen2x2Headers" INTEGER,
    "wirelessNetworking" BOOLEAN,
    "socket" TEXT,
    "formFactor" TEXT,

    CONSTRAINT "Motherboard_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PowerSupply" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "price" DOUBLE PRECISION,
    "type" TEXT,
    "efficiency" TEXT,
    "wattage" INTEGER,
    "modular" BOOLEAN,
    "color" TEXT,

    CONSTRAINT "PowerSupply_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Storage" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "type" TEXT,
    "imageUrl" TEXT,
    "productUrl" TEXT,
    "price" DOUBLE PRECISION,
    "manufacturer" TEXT,
    "capacity" TEXT,
    "cache" TEXT,
    "formFactor" TEXT,

    CONSTRAINT "Storage_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "User" (
    "id" SERIAL NOT NULL,
    "username" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "password" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PersonalPC" (
    "id" SERIAL NOT NULL,
    "userId" INTEGER NOT NULL,
    "cpuId" INTEGER DEFAULT 0,
    "gpuId" INTEGER DEFAULT 0,
    "memoryId" INTEGER DEFAULT 0,
    "motherboardId" INTEGER DEFAULT 0,
    "powerSupplyId" INTEGER DEFAULT 0,
    "storageId" INTEGER DEFAULT 0,
    "caseId" INTEGER DEFAULT 0,
    "totalPrice" DOUBLE PRECISION DEFAULT 0,

    CONSTRAINT "PersonalPC_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_username_key" ON "User"("username");

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE UNIQUE INDEX "PersonalPC_userId_key" ON "PersonalPC"("userId");

-- AddForeignKey
ALTER TABLE "PersonalPC" ADD CONSTRAINT "PersonalPC_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PersonalPC" ADD CONSTRAINT "PersonalPC_cpuId_fkey" FOREIGN KEY ("cpuId") REFERENCES "CPU"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PersonalPC" ADD CONSTRAINT "PersonalPC_gpuId_fkey" FOREIGN KEY ("gpuId") REFERENCES "GPU"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PersonalPC" ADD CONSTRAINT "PersonalPC_memoryId_fkey" FOREIGN KEY ("memoryId") REFERENCES "Memory"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PersonalPC" ADD CONSTRAINT "PersonalPC_motherboardId_fkey" FOREIGN KEY ("motherboardId") REFERENCES "Motherboard"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PersonalPC" ADD CONSTRAINT "PersonalPC_powerSupplyId_fkey" FOREIGN KEY ("powerSupplyId") REFERENCES "PowerSupply"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PersonalPC" ADD CONSTRAINT "PersonalPC_storageId_fkey" FOREIGN KEY ("storageId") REFERENCES "Storage"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PersonalPC" ADD CONSTRAINT "PersonalPC_caseId_fkey" FOREIGN KEY ("caseId") REFERENCES "Case"("id") ON DELETE SET NULL ON UPDATE CASCADE;
