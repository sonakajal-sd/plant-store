-- CreateEnum
CREATE TYPE "PaymentMethod" AS ENUM ('COD', 'ONLINE');

-- CreateEnum
CREATE TYPE "PaymentStatus" AS ENUM ('PENDING', 'PAID', 'FAILED', 'REFUNDED');

-- CreateEnum
CREATE TYPE "CouponType" AS ENUM ('PERCENT', 'FLAT');

-- AlterEnum
ALTER TYPE "OrderStatus" ADD VALUE 'Cancelled';

-- AlterTable
-- (Edited by hand) subtotal and deliveryFee start at 0 so existing orders don't break...
ALTER TABLE "Order" ADD COLUMN     "couponCode" TEXT,
ADD COLUMN     "deliveryFee" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "discount" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "paymentMethod" "PaymentMethod" NOT NULL DEFAULT 'COD',
ADD COLUMN     "paymentStatus" "PaymentStatus" NOT NULL DEFAULT 'PENDING',
ADD COLUMN     "razorpayOrderId" TEXT,
ADD COLUMN     "razorpayPaymentId" TEXT,
ADD COLUMN     "subtotal" INTEGER NOT NULL DEFAULT 0;

-- ...then we work out the real values for existing orders:
-- subtotal = sum of (price × quantity) of its items, deliveryFee = total - subtotal
UPDATE "Order" o SET
  "subtotal" = COALESCE((SELECT SUM(i."price" * i."quantity") FROM "OrderItem" i WHERE i."orderId" = o."id"), 0),
  "deliveryFee" = o."total" - COALESCE((SELECT SUM(i."price" * i."quantity") FROM "OrderItem" i WHERE i."orderId" = o."id"), 0);

-- New orders must always send these, so remove the temporary defaults
ALTER TABLE "Order" ALTER COLUMN "subtotal" DROP DEFAULT,
ALTER COLUMN "deliveryFee" DROP DEFAULT;

-- AlterTable
-- (Edited by hand) Add the new columns first, keeping "care" for a moment...
ALTER TABLE "Product" ADD COLUMN     "description" TEXT NOT NULL DEFAULT '',
ADD COLUMN     "imageUrl" TEXT,
ADD COLUMN     "isActive" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN     "light" TEXT NOT NULL DEFAULT 'Indirect light',
ADD COLUMN     "petSafe" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "water" TEXT NOT NULL DEFAULT 'Water weekly';

-- ...copy "Low light · Water weekly" into light = "Low light", water = "Water weekly".
-- A light value we don't allow (e.g. "Shade") becomes "Indirect light".
UPDATE "Product" SET
  "light" = CASE
    WHEN split_part("care", ' · ', 1) IN ('Low light', 'Indirect light', 'Bright light', 'Full sun')
      THEN split_part("care", ' · ', 1)
    ELSE 'Indirect light'
  END,
  "water" = CASE
    WHEN split_part("care", ' · ', 2) <> '' THEN split_part("care", ' · ', 2)
    ELSE 'Water weekly'
  END;

-- Now "care" is no longer needed, and light/water must always be given
ALTER TABLE "Product" DROP COLUMN "care",
ALTER COLUMN "light" DROP DEFAULT,
ALTER COLUMN "water" DROP DEFAULT;

-- CreateTable
CREATE TABLE "Coupon" (
    "id" SERIAL NOT NULL,
    "code" TEXT NOT NULL,
    "type" "CouponType" NOT NULL,
    "value" INTEGER NOT NULL,
    "minOrder" INTEGER NOT NULL DEFAULT 0,
    "maxDiscount" INTEGER,
    "expiresAt" TIMESTAMP(3),
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "usageLimit" INTEGER,
    "usedCount" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Coupon_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Review" (
    "id" SERIAL NOT NULL,
    "userId" INTEGER NOT NULL,
    "productId" INTEGER NOT NULL,
    "rating" INTEGER NOT NULL,
    "comment" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Review_pkey" PRIMARY KEY ("id"),
    -- (Edited by hand) the database itself refuses ratings outside 1–5
    CONSTRAINT "Review_rating_check" CHECK ("rating" BETWEEN 1 AND 5)
);

-- CreateTable
CREATE TABLE "WishlistItem" (
    "id" SERIAL NOT NULL,
    "userId" INTEGER NOT NULL,
    "productId" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "WishlistItem_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PasswordResetToken" (
    "id" SERIAL NOT NULL,
    "userId" INTEGER NOT NULL,
    "tokenHash" TEXT NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "usedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "PasswordResetToken_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Coupon_code_key" ON "Coupon"("code");

-- CreateIndex
CREATE UNIQUE INDEX "Review_userId_productId_key" ON "Review"("userId", "productId");

-- CreateIndex
CREATE UNIQUE INDEX "WishlistItem_userId_productId_key" ON "WishlistItem"("userId", "productId");

-- CreateIndex
CREATE UNIQUE INDEX "PasswordResetToken_tokenHash_key" ON "PasswordResetToken"("tokenHash");

-- AddForeignKey
ALTER TABLE "Review" ADD CONSTRAINT "Review_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Review" ADD CONSTRAINT "Review_productId_fkey" FOREIGN KEY ("productId") REFERENCES "Product"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WishlistItem" ADD CONSTRAINT "WishlistItem_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WishlistItem" ADD CONSTRAINT "WishlistItem_productId_fkey" FOREIGN KEY ("productId") REFERENCES "Product"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PasswordResetToken" ADD CONSTRAINT "PasswordResetToken_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

