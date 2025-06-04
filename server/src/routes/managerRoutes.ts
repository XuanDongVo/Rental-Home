import express from "express";

import {
  getManager,
  createManager,
  updateManager,
  getManagerProperties,
} from "./../controllers/managerControllers";

const route = express.Router();

route.get("/:cognitoId", getManager);
route.put("/:cognitoId", updateManager);
route.get("/:cognitoId/properties", getManagerProperties);
route.post("/", createManager);

export default route;
