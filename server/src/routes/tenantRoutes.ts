import express from "express";

import {
  getTenant,
  createTenant,
  updateTenant,
  getCurrentResidences,
  addFavoriteProperty,
  removeFavoriteProperty,
} from "./../controllers/tenantControllers";

const route = express.Router();

route.get("/:cognitoId", getTenant);
route.put("/:cognitoId", updateTenant);
route.post("/", createTenant);
route.get("/:cognitoId/current-residences", getCurrentResidences);
route.post("/:cognitoId/favorites/:propertyId", addFavoriteProperty);
route.delete("/:cognitoId/favorites/:propertyId", removeFavoriteProperty);

export default route;
