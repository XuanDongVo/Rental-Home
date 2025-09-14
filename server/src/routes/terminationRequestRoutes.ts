import express from "express";
import {
  createTerminationRequest,
  getManagerTerminationRequests,
  getTenantTerminationRequests,
  getTerminationRequest,
  updateTerminationRequest,
  deleteTerminationRequest,
  getTerminationRequestDetails,
} from "../controllers/terminationRequestController";
import { authMiddleware } from "../middleware/authMiddleware";

const router = express.Router();

// Create termination request (tenants only)
router.post("/", authMiddleware(["tenant"]), createTerminationRequest);

// Get termination requests for manager
router.get(
  "/manager",
  authMiddleware(["manager"]),
  getManagerTerminationRequests
);

// Get termination requests for tenant
router.get("/tenant", authMiddleware(["tenant"]), getTenantTerminationRequests);

// Get specific termination request
router.get("/:id", getTerminationRequest);

// Get termination request details
router.get("/:id/details", getTerminationRequestDetails);

// Update termination request (managers only)
router.put("/:id", authMiddleware(["manager"]), updateTerminationRequest);

// Update termination request status (approve/reject)
router.put(
  "/:id/status",
  authMiddleware(["manager"]),
  updateTerminationRequest
);

// Delete termination request
router.delete("/:id", deleteTerminationRequest);

export default router;
