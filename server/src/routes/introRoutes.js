import { Router } from "express";
import { getIntro, updateIntro } from "../controllers/introController.js";

const router = Router();

router.get("/intro", getIntro);
router.put("/intro", updateIntro);

export default router;
