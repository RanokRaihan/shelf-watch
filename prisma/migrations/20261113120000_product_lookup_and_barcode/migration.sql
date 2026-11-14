-- Renames upc -> gtin by drop and re-add, so it refuses to run if product data exists.
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM "Product") OR EXISTS (SELECT 1 FROM "StoreProduct") OR EXISTS (SELECT 1 FROM "PullItem") THEN
    RAISE EXCEPTION 'Product, StoreProduct or PullItem has rows; this migration expects them empty.';
  END IF;
END $$;

-- CreateEnum
CREATE TYPE "BarcodeFormat" AS ENUM ('UPC_A', 'UPC_E', 'EAN_13', 'EAN_8');

-- CreateEnum
CREATE TYPE "LookupStatus" AS ENUM ('FOUND', 'NOT_FOUND', 'FAILED');

-- CreateEnum
CREATE TYPE "ProductSource" AS ENUM ('OPEN_FOOD_FACTS', 'UPCITEMDB');

-- DropForeignKey
ALTER TABLE "PullItem" DROP CONSTRAINT "PullItem_upc_fkey";

-- DropForeignKey
ALTER TABLE "StoreProduct" DROP CONSTRAINT "StoreProduct_upc_fkey";

-- DropIndex
DROP INDEX "StoreProduct_storeId_upc_key";

-- AlterTable
ALTER TABLE "Product" DROP CONSTRAINT "Product_pkey",
DROP COLUMN "fetchedAt",
DROP COLUMN "upc",
ADD COLUMN     "barcodeFormat" "BarcodeFormat" NOT NULL,
ADD COLUMN     "barcodeValue" TEXT NOT NULL,
ADD COLUMN     "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "gtin" TEXT NOT NULL,
ADD COLUMN     "imageUrl" TEXT,
ADD COLUMN     "lookedUpAt" TIMESTAMP(3) NOT NULL,
ADD COLUMN     "lookupStatus" "LookupStatus" NOT NULL,
ADD COLUMN     "size" TEXT,
ADD COLUMN     "sourceData" JSONB,
ADD COLUMN     "updatedAt" TIMESTAMP(3) NOT NULL,
DROP COLUMN "source",
ADD COLUMN     "source" "ProductSource",
ADD CONSTRAINT "Product_pkey" PRIMARY KEY ("gtin");

-- AlterTable
ALTER TABLE "PullItem" DROP COLUMN "upc",
ADD COLUMN     "gtin" TEXT NOT NULL;

-- AlterTable
ALTER TABLE "StoreProduct" DROP COLUMN "upc",
ADD COLUMN     "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "gtin" TEXT NOT NULL,
ADD COLUMN     "lastScannedAt" TIMESTAMP(3),
ADD COLUMN     "leadDays" INTEGER,
ADD COLUMN     "name" TEXT,
ADD COLUMN     "updatedAt" TIMESTAMP(3) NOT NULL;

-- CreateIndex
CREATE INDEX "StoreProduct_storeId_aisle_idx" ON "StoreProduct"("storeId", "aisle");

-- CreateIndex
CREATE UNIQUE INDEX "StoreProduct_storeId_gtin_key" ON "StoreProduct"("storeId", "gtin");

-- AddForeignKey
ALTER TABLE "StoreProduct" ADD CONSTRAINT "StoreProduct_gtin_fkey" FOREIGN KEY ("gtin") REFERENCES "Product"("gtin") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PullItem" ADD CONSTRAINT "PullItem_gtin_fkey" FOREIGN KEY ("gtin") REFERENCES "Product"("gtin") ON DELETE RESTRICT ON UPDATE CASCADE;

