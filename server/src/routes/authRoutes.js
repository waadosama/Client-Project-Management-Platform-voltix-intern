import { Router } from "express";
import {
  login,
  logout,
  me,
  register,
  createUser,
  listUsers,
} from "../controllers/authController.js";
import { requireAuth, requireRole } from "../middleware/auth.js";

const router = Router();

router.post("/login", login);
router.post("/register", register); // public self-signup → always a member account
router.get("/me", requireAuth, me);
router.post("/logout", requireAuth, logout);
router.get("/users", requireAuth, listUsers); // team directory (for assignments)
router.post("/users", requireAuth, requireRole("admin"), createUser);

export default router;
