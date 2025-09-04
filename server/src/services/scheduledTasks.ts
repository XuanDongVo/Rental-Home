import cron from "node-cron";
import * as paymentService from "./paymentService";
import { NotificationService } from "./NotificationService";
import { PrismaClient, PaymentStatus, LeaseStatus } from "@prisma/client";

const prisma = new PrismaClient();
const notificationService = new NotificationService();

// Check overdue payments daily at 9 AM
export const scheduleOverduePaymentCheck = () => {
  cron.schedule("0 9 * * *", async () => {
    try {
      console.log("Running daily overdue payment check...");
      const overduePayments = await paymentService.checkOverduePayments();
      console.log(
        `Found and processed ${overduePayments.length} overdue payments`
      );
    } catch (error) {
      console.error("Error in scheduled overdue payment check:", error);
    }
  });
};

// Send payment reminders 3 days before due date at 10 AM
export const schedulePaymentReminders = () => {
  cron.schedule("0 10 * * *", async () => {
    try {
      console.log("Sending payment reminders...");

      const threeDaysFromNow = new Date();
      threeDaysFromNow.setDate(threeDaysFromNow.getDate() + 3);

      // Get payments due in 3 days
      const upcomingPayments = await prisma.payment.findMany({
        where: {
          dueDate: {
            gte: new Date(
              threeDaysFromNow.getFullYear(),
              threeDaysFromNow.getMonth(),
              threeDaysFromNow.getDate()
            ),
            lt: new Date(
              threeDaysFromNow.getFullYear(),
              threeDaysFromNow.getMonth(),
              threeDaysFromNow.getDate() + 1
            ),
          },
          paymentStatus: PaymentStatus.Pending,
        },
        include: {
          lease: {
            include: {
              tenant: true,
              property: true,
            },
          },
        },
      });

      for (const payment of upcomingPayments) {
        await notificationService.notifyPaymentDue(
          payment.leaseId,
          payment.amountDue,
          payment.dueDate,
          payment.lease.tenantCognitoId
        );
      }

      console.log(`Sent ${upcomingPayments.length} payment reminders`);
    } catch (error) {
      console.error("Error in scheduled payment reminders:", error);
    }
  });
};

// Create next month's payments on the 25th of each month at 8 AM
export const scheduleMonthlyPaymentCreation = () => {
  cron.schedule("0 8 25 * *", async () => {
    try {
      console.log("Creating next month's payments...");

      const activeLeases = await prisma.lease.findMany({
        where: {
          endDate: {
            gt: new Date(), // Only active leases
          },
        },
      });

      let paymentsCreated = 0;
      for (const lease of activeLeases) {
        try {
          const payment = await paymentService.createNextMonthPayment(lease.id);
          if (payment) {
            paymentsCreated++;
          }
        } catch (error) {
          console.error(`Error creating payment for lease ${lease.id}:`, error);
        }
      }

      console.log(`Created ${paymentsCreated} new payments for next month`);
    } catch (error) {
      console.error("Error in scheduled monthly payment creation:", error);
    }
  });
};

// Initialize all scheduled tasks
export const initializeScheduledTasks = () => {
  console.log("Initializing scheduled tasks...");

  scheduleOverduePaymentCheck();
  schedulePaymentReminders();
  scheduleMonthlyPaymentCreation();

  console.log("Scheduled tasks initialized:");
  console.log("- Daily overdue check at 9:00 AM");
  console.log("- Payment reminders at 10:00 AM");
  console.log("- Monthly payment creation on 25th at 8:00 AM");
};
