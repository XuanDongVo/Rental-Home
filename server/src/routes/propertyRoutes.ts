import express from "express";
import {
  getProperties,
  getProperty,
  createProperty,
  deleteProperty,
  updateProperty,
  getLeaseByPropertyId,
} from "../controllers/propertyControllers";
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

route.get(
  ":propertyId/leases",
  authMiddleware(["manager", "tenant"]),
  getLeaseByPropertyId
);
export default router;
