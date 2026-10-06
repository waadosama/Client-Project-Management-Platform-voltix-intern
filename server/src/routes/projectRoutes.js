import { Router } from "express";
import { listProjects, createProject } from "../controllers/projectController.js";
import { requireAuth } from "../middleware/auth.js";

const router = Router();

router.use(requireAuth); // everything below needs a valid token

router.get("/", listProjects);
router.post("/", createProject);

export default router;
