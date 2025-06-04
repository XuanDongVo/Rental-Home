import { Router } from "express";
import { authMiddleware } from "../middleware/authMiddleware";
import {
  createApplication,
  listApplications,
  updateApplicationStatus,
} from "../controllers/applicationControllers";

const route = Router();

route.post("/", authMiddleware(["tenant"]), createApplication);
route.put("/:id/status", authMiddleware(["manager"]), updateApplicationStatus);
route.get("/", authMiddleware(["manager", "tenant"]), listApplications);

export default route;
