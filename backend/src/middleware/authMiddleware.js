import jwt from "jsonwebtoken";
import User from "../models/User.js";
import { memoryStore, useInMemoryDb } from "../config/db.js";

export const protect = async (req, res, next) => {
  let token = null;

  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith("Bearer ")
  ) {
    token = req.headers.authorization.split(" ")[1];
  }

  if (!token) {
    return res.status(401).json({ message: "Not authorized, no token" });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    if (useInMemoryDb) {
      const user = memoryStore.users.find((u) => u.id === decoded.id);
      if (!user) {
        return res.status(401).json({ message: "User not found for token" });
      }
      // Shape it similarly to a Mongoose document used elsewhere
      req.user = { ...user };
    } else {
      req.user = await User.findById(decoded.id).select("-password");
      if (!req.user) {
        return res.status(401).json({ message: "User not found for token" });
      }
    }

    next();
  } catch (error) {
    console.error(error);
    res.status(401).json({ message: "Not authorized, token failed" });
  }
};

export const adminOnly = (req, res, next) => {
  if (req.user && req.user.role === "admin") {
    return next();
  }
  return res.status(403).json({ message: "Admin access only" });
};

