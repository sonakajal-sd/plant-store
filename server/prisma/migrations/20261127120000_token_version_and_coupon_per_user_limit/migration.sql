-- AlterTable
ALTER TABLE "Coupon" ADD COLUMN     "perUserLimit" INTEGER;

-- AlterTable
ALTER TABLE "User" ADD COLUMN     "tokenVersion" INTEGER NOT NULL DEFAULT 0;

