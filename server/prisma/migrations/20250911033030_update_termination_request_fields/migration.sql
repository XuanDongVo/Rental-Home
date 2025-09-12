/*
  Warnings:

  - You are about to drop the `TerminationRequest` table. If the table is not empty, all the data it contains will be lost.

*/
-- AlterEnum
-- This migration adds more than one value to an enum.
-- With PostgreSQL versions 11 and earlier, this is not possible
-- in a single migration. This can be worked around by creating
-- multiple migrations, each migration adding only one value to
-- the enum.


ALTER TYPE "NotificationType" ADD VALUE 'TerminationRequest';
ALTER TYPE "NotificationType" ADD VALUE 'TerminationResponse';

-- DropForeignKey
ALTER TABLE "TerminationRequest" DROP CONSTRAINT "TerminationRequest_leaseId_fkey";

-- DropForeignKey
ALTER TABLE "TerminationRequest" DROP CONSTRAINT "TerminationRequest_managerCognitoId_fkey";

-- DropForeignKey
ALTER TABLE "TerminationRequest" DROP CONSTRAINT "TerminationRequest_tenantCognitoId_fkey";

-- AlterTable
ALTER TABLE "Payment" ADD COLUMN     "description" TEXT;

-- DropTable
DROP TABLE "TerminationRequest";

-- CreateTable
CREATE TABLE "termination_requests" (
    "id" TEXT NOT NULL,
    "leaseId" INTEGER NOT NULL,
    "reason" TEXT NOT NULL,
    "requestedDate" TIMESTAMP(3) NOT NULL,
    "requestedEndDate" TIMESTAMP(3),
    "status" "TerminationRequestStatus" NOT NULL DEFAULT 'Pending',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "managerId" INTEGER,
    "managerNote" TEXT,
    "penaltyAmount" DOUBLE PRECISION,
    "calculatedPenalty" DOUBLE PRECISION,
    "finalPenalty" DOUBLE PRECISION,
    "noticeProvided" INTEGER,
    "estimatedPenaltyFee" DOUBLE PRECISION,
    "isEarlyTermination" BOOLEAN,
    "approvedEndDate" TIMESTAMP(3),
    "tenantCognitoId" TEXT,
    "managerCognitoId" TEXT,
    "managerResponse" TEXT,
    "responseDate" TIMESTAMP(3),
    "finalPenaltyFee" DOUBLE PRECISION,

    CONSTRAINT "termination_requests_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "termination_policies" (
    "id" TEXT NOT NULL,
    "propertyId" INTEGER NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "minimumNoticedays" INTEGER NOT NULL DEFAULT 30,
    "penaltyRules" JSONB NOT NULL,
    "allowWaiverConditions" JSONB,
    "gracePeriodDays" INTEGER DEFAULT 60,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "createdById" INTEGER NOT NULL,

    CONSTRAINT "termination_policies_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "termination_requests" ADD CONSTRAINT "termination_requests_leaseId_fkey" FOREIGN KEY ("leaseId") REFERENCES "Lease"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "termination_requests" ADD CONSTRAINT "termination_requests_managerId_fkey" FOREIGN KEY ("managerId") REFERENCES "Manager"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "termination_policies" ADD CONSTRAINT "termination_policies_propertyId_fkey" FOREIGN KEY ("propertyId") REFERENCES "Property"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "termination_policies" ADD CONSTRAINT "termination_policies_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "Manager"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
