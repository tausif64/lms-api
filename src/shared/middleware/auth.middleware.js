import { auth } from "../../lib/auth.js";
import prisma from "../../config/db.js";

// Checks if a user is logged in
export const isAuthenticated = async (req, res, next) => {
  try {
    const session = await auth.getSession({ headers: req.headers });
    if (!session?.user) {
      return res
        .status(401)
        .json({ message: "Unauthorized: No active session" });
    }

    // Attach the full user profile from the DB to the request object
    req.user = await prisma.user.findUnique({ where: { id: session.user.id } });
    if (!req.user) {
      return res.status(401).json({ message: "Unauthorized: User not found" });
    }

    next();
  } catch (error) {
    return res.status(401).json({ message: "Unauthorized: Invalid session" });
  }
};

// Checks for a specific role
export const hasRole = (role) => async (req, res, next) => {
  const userWithRoles = await prisma.user.findUnique({
    where: { id: req.user.id },
    include: { student: true, instructor: true, admin: true },
  });

  if (userWithRoles && userWithRoles[role]) {
    next();
  } else {
    res.status(403).json({ message: `Forbidden: Requires ${role} role` });
  }
};
