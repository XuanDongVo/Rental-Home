-- CreateEnum
CREATE TYPE "NotificationType" AS ENUM ('ApplicationSubmitted', 'ApplicationApproved', 'ApplicationDenied', 'PaymentDue', 'PaymentReceived', 'PaymentOverdue', 'MaintenanceRequest', 'LeaseExpiring', 'NewMessage', 'PropertyUpdated');

-- CreateTable
CREATE TABLE "Notification" (
    "id" SERIAL NOT NULL,
    "type" "NotificationType" NOT NULL,
    "title" TEXT NOT NULL,
    "message" TEXT NOT NULL,
    "data" JSONB,
    "isRead" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "tenantCognitoId" TEXT,
    "managerCognitoId" TEXT,

    CONSTRAINT "Notification_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "NotificationPreference" (
    "id" SERIAL NOT NULL,
    "userCognitoId" TEXT NOT NULL,
    "emailEnabled" BOOLEAN NOT NULL DEFAULT true,
    "pushEnabled" BOOLEAN NOT NULL DEFAULT true,
    "smsEnabled" BOOLEAN NOT NULL DEFAULT false,
    "applicationNotifications" BOOLEAN NOT NULL DEFAULT true,
    "paymentNotifications" BOOLEAN NOT NULL DEFAULT true,
    "maintenanceNotifications" BOOLEAN NOT NULL DEFAULT true,
    "messageNotifications" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "NotificationPreference_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "NotificationPreference_userCognitoId_key" ON "NotificationPreference"("userCognitoId");

-- AddForeignKey
ALTER TABLE "Notification" ADD CONSTRAINT "Notification_tenantCognitoId_fkey" FOREIGN KEY ("tenantCognitoId") REFERENCES "Tenant"("cognitoId") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Notification" ADD CONSTRAINT "Notification_managerCognitoId_fkey" FOREIGN KEY ("managerCognitoId") REFERENCES "Manager"("cognitoId") ON DELETE SET NULL ON UPDATE CASCADE;
