-- AlterTable
ALTER TABLE "Session" ADD COLUMN     "failedPasswordAttempts" INTEGER NOT NULL DEFAULT 0;

