import { Request, Response, NextFunction } from "express";
import jwt, { JwtPayload } from "jsonwebtoken";

interface DecodedToken extends JwtPayload {
  sub: string;
  "custom:role"?: string;
}

declare global {
  namespace Express {
    interface Request {
      user?: {
        id: string;
        role: string;
      };
    }
  }
}

export const authMiddleware = (allowedRoles: string[]) => {
  return (req: Request, res: Response, next: NextFunction): void => {
    // Check for token in Authorization header first, then query parameter for SSE
    let token = req.headers.authorization?.split(" ")[1]; // Bearer token

    if (!token && req.query.token) {
      token = req.query.token as string; // For SSE connections via query parameter
    }

    if (!token) {
      res.status(401).json({ message: "Unauthorized" });
      return;
    }

    try {
      const decoded = jwt.decode(token) as DecodedToken;
      const userRole = decoded["custom:role"] || "";

      console.log("🔍 Auth Debug:", {
        userId: decoded.sub,
        userRole,
        allowedRoles,
        hasRole: !!userRole,
        hasAccess: allowedRoles.includes(userRole.toLowerCase()),
      });

      req.user = {
        id: decoded.sub,
        role: userRole,
      };

      const hasAccess = allowedRoles.includes(userRole.toLowerCase());

      if (!hasAccess) {
        console.log(
          "❌ Access denied for user:",
          decoded.sub,
          "Role:",
          userRole,
          "Required:",
          allowedRoles
        );
        res.status(403).json({ message: "Access deny" });
        return;
      }
    } catch (err) {
      console.error("Failed to decode token:", err);
      res.status(400).json({ message: "Invalid token" });
      return;
    }
    next();
  };
};
