-- AlterTable
ALTER TABLE "PowerSupply" ADD COLUMN     "atx4PinConnectors" INTEGER,
ADD COLUMN     "eps8PinConnectors" INTEGER,
ADD COLUMN     "length" INTEGER,
ADD COLUMN     "manufacturer" TEXT,
ADD COLUMN     "molex4PinConnectors" INTEGER,
ADD COLUMN     "partNumber" TEXT,
ADD COLUMN     "pcie12PinConnectors" INTEGER,
ADD COLUMN     "pcie12Plus4Pin12VHPWRConnectors" INTEGER,
ADD COLUMN     "pcie6PinConnectors" INTEGER,
ADD COLUMN     "pcie6Plus2PinConnectors" INTEGER,
ADD COLUMN     "pcie8PinConnectors" INTEGER,
ADD COLUMN     "sataConnectors" INTEGER,
ADD COLUMN     "specsNumber" TEXT;
