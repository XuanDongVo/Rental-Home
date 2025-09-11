import express from "express";
import {
  getTerminationPolicies,
  getTerminationPolicy,
  createTerminationPolicy,
  updateTerminationPolicy,
  deleteTerminationPolicy,
  calculateTerminationPenalty,
} from "../controllers/terminationPolicyControllers";
import { authMiddleware } from "../middleware/authMiddleware";

const router = express.Router();

// Get termination policies for a property
router.get("/", getTerminationPolicies);

// Get specific termination policy
router.get("/:id", getTerminationPolicy);

// Create new termination policy (managers only)
router.post("/", authMiddleware(["manager"]), createTerminationPolicy);

// Update termination policy (managers only)
router.put("/:id", authMiddleware(["manager"]), updateTerminationPolicy);

// Delete termination policy (managers only)
router.delete("/:id", authMiddleware(["manager"]), deleteTerminationPolicy);

// Calculate termination penalty
router.post("/calculate", calculateTerminationPenalty);

export default router;
