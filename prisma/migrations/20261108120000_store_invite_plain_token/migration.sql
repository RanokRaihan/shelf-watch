-- Join links now store the plain token (public by design, see docs/auth-flow.md 5).
-- Old rows only have a hash and can't be turned back into a link, so remove them.
-- The invite page creates a new link on its next visit.
DELETE FROM "StoreInvite";

-- DropIndex
DROP INDEX "StoreInvite_tokenHash_key";

-- AlterTable
ALTER TABLE "StoreInvite" DROP COLUMN "tokenHash",
ADD COLUMN     "token" TEXT NOT NULL,
ALTER COLUMN "expiresAt" DROP NOT NULL;

-- CreateIndex
CREATE UNIQUE INDEX "StoreInvite_token_key" ON "StoreInvite"("token");
