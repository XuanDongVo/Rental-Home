-- CreateEnum
CREATE TYPE "LeaseStatus" AS ENUM ('Active', 'Terminated', 'Expired', 'PendingTermination');

-- CreateEnum
CREATE TYPE "TerminationRequestStatus" AS ENUM ('Pending', 'Approved', 'Rejected');

-- AlterTable
ALTER TABLE "Lease" ADD COLUMN     "status" "LeaseStatus" NOT NULL DEFAULT 'Active',
ADD COLUMN     "terminationDate" TIMESTAMP(3),
ADD COLUMN     "terminationReason" TEXT;

-- AlterTable
ALTER TABLE "Payment" ALTER COLUMN "amountPaid" SET DEFAULT 0,
ALTER COLUMN "paymentDate" DROP NOT NULL,
ALTER COLUMN "paymentStatus" SET DEFAULT 'Pending';

-- CreateTable
CREATE TABLE "TerminationRequest" (
    "id" SERIAL NOT NULL,
    "reason" TEXT NOT NULL,
    "requestDate" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "status" "TerminationRequestStatus" NOT NULL DEFAULT 'Pending',
    "managerResponse" TEXT,
    "responseDate" TIMESTAMP(3),
    "leaseId" INTEGER NOT NULL,
    "tenantCognitoId" TEXT NOT NULL,
    "managerCognitoId" TEXT,

    CONSTRAINT "TerminationRequest_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "TerminationRequest" ADD CONSTRAINT "TerminationRequest_leaseId_fkey" FOREIGN KEY ("leaseId") REFERENCES "Lease"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TerminationRequest" ADD CONSTRAINT "TerminationRequest_tenantCognitoId_fkey" FOREIGN KEY ("tenantCognitoId") REFERENCES "Tenant"("cognitoId") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TerminationRequest" ADD CONSTRAINT "TerminationRequest_managerCognitoId_fkey" FOREIGN KEY ("managerCognitoId") REFERENCES "Manager"("cognitoId") ON DELETE SET NULL ON UPDATE CASCADE;
