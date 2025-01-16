-- AlterTable
ALTER TABLE "AdminLog" ADD COLUMN     "details" TEXT;

-- AlterTable
ALTER TABLE "Chat" ADD COLUMN     "reported" BOOLEAN NOT NULL DEFAULT false;
