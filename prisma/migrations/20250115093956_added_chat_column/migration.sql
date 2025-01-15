-- CreateEnum
CREATE TYPE "ChatStatus" AS ENUM ('ACTIVE', 'CLOSED');

-- AlterTable
ALTER TABLE "Chat" ADD COLUMN     "status" "ChatStatus" NOT NULL DEFAULT 'ACTIVE';
