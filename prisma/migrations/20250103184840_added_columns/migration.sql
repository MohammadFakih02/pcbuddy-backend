-- CreateEnum
CREATE TYPE "BuildStatus" AS ENUM ('COMPLETED', 'IN_PROGRESS', 'SAVED');

-- DropIndex
DROP INDEX "PersonalPC_userId_key";

-- AlterTable
ALTER TABLE "Case" ADD COLUMN     "usageCount" INTEGER DEFAULT 0;

-- AlterTable
ALTER TABLE "Cpu" ADD COLUMN     "usageCount" INTEGER DEFAULT 0;

-- AlterTable
ALTER TABLE "Gpu" ADD COLUMN     "usageCount" INTEGER DEFAULT 0;

-- AlterTable
ALTER TABLE "Memory" ADD COLUMN     "usageCount" INTEGER DEFAULT 0;

-- AlterTable
ALTER TABLE "Motherboard" ADD COLUMN     "usageCount" INTEGER DEFAULT 0;

-- AlterTable
ALTER TABLE "PersonalPC" ADD COLUMN     "buildDate" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "buildName" TEXT,
ADD COLUMN     "buildStatus" "BuildStatus" NOT NULL DEFAULT 'COMPLETED',
ADD COLUMN     "usageCount" INTEGER DEFAULT 0,
ALTER COLUMN "cpuId" DROP DEFAULT,
ALTER COLUMN "gpuId" DROP DEFAULT,
ALTER COLUMN "memoryId" DROP DEFAULT,
ALTER COLUMN "motherboardId" DROP DEFAULT,
ALTER COLUMN "powerSupplyId" DROP DEFAULT,
ALTER COLUMN "storageId" DROP DEFAULT,
ALTER COLUMN "caseId" DROP DEFAULT;

-- AlterTable
ALTER TABLE "PowerSupply" ADD COLUMN     "usageCount" INTEGER DEFAULT 0;

-- AlterTable
ALTER TABLE "Storage" ADD COLUMN     "usageCount" INTEGER DEFAULT 0;

-- AlterTable
ALTER TABLE "User" ADD COLUMN     "bio" TEXT,
ADD COLUMN     "lastLogin" TIMESTAMP(3),
ADD COLUMN     "name" TEXT;

-- CreateTable
CREATE TABLE "AdminLog" (
    "id" SERIAL NOT NULL,
    "action" TEXT NOT NULL,
    "adminId" INTEGER NOT NULL,
    "userId" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AdminLog_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "AdminLog" ADD CONSTRAINT "AdminLog_adminId_fkey" FOREIGN KEY ("adminId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AdminLog" ADD CONSTRAINT "AdminLog_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
