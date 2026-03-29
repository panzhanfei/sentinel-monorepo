-- CreateTable
CREATE TABLE "RevokedAllowance" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "tokenAddress" TEXT NOT NULL,
    "spenderAddress" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "RevokedAllowance_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "RevokedAllowance_userId_tokenAddress_spenderAddress_key"
ON "RevokedAllowance"("userId", "tokenAddress", "spenderAddress");

-- CreateIndex
CREATE INDEX "RevokedAllowance_userId_createdAt_idx"
ON "RevokedAllowance"("userId", "createdAt");

-- AddForeignKey
ALTER TABLE "RevokedAllowance"
ADD CONSTRAINT "RevokedAllowance_userId_fkey"
FOREIGN KEY ("userId") REFERENCES "User"("id")
ON DELETE CASCADE ON UPDATE CASCADE;
