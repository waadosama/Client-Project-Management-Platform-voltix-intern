import { Router } from "express";
import { getIntro, updateIntro } from "../controllers/introController.js";
import { requireAuth, requireRole } from "../middleware/auth.js";

const router = Router();

router.get("/intro", getIntro); // public — landing page copy
router.put("/intro", requireAuth, requireRole("admin"), updateIntro); // admin only

export default router;
