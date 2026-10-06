import { Project } from "../models/Project.js";

/** GET /api/projects — only the caller's own projects. */
export async function listProjects(req, res) {
  try {
    const projects = await Project.find({ owner: req.user._id })
      .sort({ updatedAt: -1 })
      .lean();
    return res.json({ data: projects, count: projects.length });
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
}

/** POST /api/projects — create a project owned by the caller. */
export async function createProject(req, res) {
  try {
    const { name, client, status, progress, budget, dueDate } = req.body ?? {};
    if (!name || !client) {
      return res.status(400).json({ error: "Project name and client are required" });
    }

    const project = await Project.create({
      owner: req.user._id,
      name,
      client,
      status,
      progress,
      budget,
      dueDate,
    });

    return res.status(201).json({ data: project });
  } catch (error) {
    return res.status(400).json({ error: error.message });
  }
}
