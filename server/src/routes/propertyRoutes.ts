import express from "express";
import {
  getProperties,
  getProperty,
  createProperty,
  deleteProperty,
  updateProperty,
  getLeaseByPropertyId,
  getCurrentMonthPaymentStatusByProperty,
} from "../controllers/propertyControllers";
import {
  getCurrentLeaseByProperty,
  getLeaseHistoryByProperty,
  getPaymentHistoryByProperty,
  getCurrentMonthPaymentStatus,
  getPreviousTenantsForProperty,
  getPropertyLeaseSummary,
} from "../controllers/leaseControllers";
import multer from "multer";
import { authMiddleware } from "../middleware/authMiddleware";
import route from "./tenantRoutes";

const storage = multer.memoryStorage();
const upload = multer({ storage: storage });

const router = express.Router();

router.get("/", getProperties);
router.get("/:id", getProperty);
router.post(
  "/",
  authMiddleware(["manager"]),
  upload.array("photos"),
  createProperty
);
router.delete("/:id", authMiddleware(["manager"]), deleteProperty);
router.put(
  "/:id",
  authMiddleware(["manager"]),
  upload.array("photos"),
  updateProperty
);

// Manager property tab endpoints
router.get(
  "/:propertyId/current-lease",
  authMiddleware(["manager", "tenant"]),
  getCurrentLeaseByProperty
);

router.get(
  "/:propertyId/lease-history",
  authMiddleware(["manager"]),
  getLeaseHistoryByProperty
);

router.get(
  "/:propertyId/payment-history",
  authMiddleware(["manager"]),
  getPaymentHistoryByProperty
);

router.get(
  "/:propertyId/previous-tenants",
  authMiddleware(["manager"]),
  getPreviousTenantsForProperty
);

router.get(
  "/:propertyId/summary",
  authMiddleware(["manager"]),
  getPropertyLeaseSummary
);

router.get(
  "/lease/:leaseId/payment-status",
  authMiddleware(["manager", "tenant"]),
  getCurrentMonthPaymentStatus
);

route.get(
  ":propertyId/leases",
  authMiddleware(["manager", "tenant"]),
  getLeaseByPropertyId
);

// Tenant specific routes
router.get(
  "/:propertyId/payments",
  authMiddleware(["manager", "tenant"]),
  getPaymentHistoryByProperty
);

router.get(
  "/:propertyId/current-month-payment",
  authMiddleware(["manager", "tenant"]),
  getCurrentMonthPaymentStatusByProperty
);

router.get(
  "/:propertyId/tenant-lease",
  authMiddleware(["tenant"]),
  getCurrentLeaseByProperty
);

export default router;
