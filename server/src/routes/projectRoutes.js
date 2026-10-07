import { Router } from "express";
import {
  listProjects,
  getProject,
  createProject,
  updateProject,
  deleteProject,
} from "../controllers/projectController.js";
import { requireAuth } from "../middleware/auth.js";

const router = Router();

router.use(requireAuth); // everything below needs a valid token

router.get("/", listProjects);
router.post("/", createProject);
router.get("/:id", getProject);
router.put("/:id", updateProject);
router.delete("/:id", deleteProject);

export default router;
