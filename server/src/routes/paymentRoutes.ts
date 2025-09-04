import { Router } from "express";
import * as paymentControllers from "../controllers/paymentControllers";
import { authMiddleware } from "../middleware/authMiddleware";

const router = Router();

// Record a payment
router.post(
  "/:id/record",
  authMiddleware(["manager", "tenant"]),
  paymentControllers.recordPayment
);

// Get payments by lease
router.get(
  "/lease/:leaseId",
  authMiddleware(["manager", "tenant"]),
  paymentControllers.getPaymentsByLease
);

// Get payments by property
router.get(
  "/property/:propertyId",
  authMiddleware(["manager", "tenant"]),
  paymentControllers.getPaymentsByProperty
);

// Get current month payment status for a lease
router.get(
  "/lease/:leaseId/current-status",
  authMiddleware(["manager", "tenant"]),
  paymentControllers.getCurrentMonthPaymentStatus
);

// Check and update overdue payments (admin/cron endpoint)
router.post(
  "/check-overdue",
  authMiddleware(["manager"]),
  paymentControllers.checkOverduePayments
);

// Get overdue payments for user
router.get(
  "/overdue",
  authMiddleware(["tenant"]),
  paymentControllers.getOverduePayments
);

export default router;
