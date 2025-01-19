-- AlterTable
ALTER TABLE "PersonalPC" ADD COLUMN     "storageId2" INTEGER;

-- AddForeignKey
ALTER TABLE "PersonalPC" ADD CONSTRAINT "PersonalPC_storageId2_fkey" FOREIGN KEY ("storageId2") REFERENCES "Storage"("id") ON DELETE SET NULL ON UPDATE CASCADE;
