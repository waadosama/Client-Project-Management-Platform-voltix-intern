import { Router } from "express";
import { login, logout, me, createUser } from "../controllers/authController.js";
import { requireAuth, requireRole } from "../middleware/auth.js";

const router = Router();

router.post("/login", login);
router.get("/me", requireAuth, me);
router.post("/logout", requireAuth, logout);
router.post("/users", requireAuth, requireRole("admin"), createUser);

export default router;
