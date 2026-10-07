import mongoose from "mongoose";
import { Project } from "../models/Project.js";
import { Client } from "../models/Client.js";
import { User } from "../models/User.js";

/** Fields a client is allowed to send on create/update. */
const UPDATABLE = [
  "name",
  "description",
  "client",
  "teamMembers",
  "status",
  "progress",
  "budget",
  "dueDate",
];

const POPULATE = [
  { path: "client", select: "name contactName email" },
  { path: "teamMembers", select: "name email role" },
];

const isId = (value) => mongoose.Types.ObjectId.isValid(value);

/** Only the owner or an admin may change a project. */
function canManage(project, user) {
  return user.role === "admin" || String(project.owner) === String(user._id);
}

/** Owner, assigned team member or admin may see it at all. */
function canView(project, user) {
  if (user.role === "admin" || String(project.owner) === String(user._id)) return true;
  return (project.teamMembers ?? []).some((id) => String(id) === String(user._id));
}

/** Resolve `Project.client` (ObjectId) → 400 when missing/unknown. */
async function resolveClient(client) {
  if (!client || !isId(client)) {
    return { error: "A valid client is required" };
  }
  const found = await Client.findById(client).select("_id").lean();
  if (!found) return { error: "The selected client no longer exists" };
  return { value: found._id };
}

/** Resolve `Project.teamMembers` (ObjectId[]) → 400 when a member is unknown. */
async function resolveTeamMembers(teamMembers) {
  if (teamMembers === undefined) return { value: undefined };
  if (!Array.isArray(teamMembers)) return { error: "Team members must be a list" };

  const ids = [...new Set(teamMembers.map(String))];
  if (ids.some((id) => !isId(id))) return { error: "Invalid team member id" };

  const found = await User.find({ _id: { $in: ids }, isActive: true })
    .select("_id")
    .lean();
  if (found.length !== ids.length) {
    return { error: "One or more team members do not exist" };
  }
  return { value: ids };
}

/**
 * Loads a project and applies the access rules:
 *  - not visible to the caller → 404 (never leaks existence)
 *  - visible but not manageable (a team member) → 403
 */
async function loadForChange(req, res) {
  const project = await Project.findById(req.params.id);
  if (!project || !canView(project, req.user)) {
    res.status(404).json({ error: "Project not found" });
    return null;
  }
  if (!canManage(project, req.user)) {
    res.status(403).json({ error: "You do not have permission to do that" });
    return null;
  }
  return project;
}

/** GET /api/projects — projects the caller owns, is assigned to, or (admin) all of them. */
export async function listProjects(req, res) {
  try {
    const filter =
      req.user.role === "admin"
        ? {}
        : { $or: [{ owner: req.user._id }, { teamMembers: req.user._id }] };

    const projects = await Project.find(filter)
      .populate(POPULATE)
      .sort({ updatedAt: -1 })
      .lean();

    return res.json({ data: projects, count: projects.length });
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
}

/** GET /api/projects/:id — one project, if the caller may see it. */
export async function getProject(req, res) {
  try {
    if (!isId(req.params.id)) {
      return res.status(404).json({ error: "Project not found" });
    }
    const project = await Project.findById(req.params.id);
    if (!project || !canView(project, req.user)) {
      return res.status(404).json({ error: "Project not found" });
    }
    await project.populate(POPULATE);
    return res.json({ data: project });
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
}

/** POST /api/projects — create a project owned by the caller. */
export async function createProject(req, res) {
  try {
    const body = req.body ?? {};
    const name = typeof body.name === "string" ? body.name.trim() : "";
    if (!name) return res.status(400).json({ error: "Project name is required" });

    const client = await resolveClient(body.client);
    if (client.error) return res.status(400).json({ error: client.error });

    const team = await resolveTeamMembers(body.teamMembers);
    if (team.error) return res.status(400).json({ error: team.error });

    const project = await Project.create({
      owner: req.user._id,
      name,
      description: body.description ?? "",
      client: client.value,
      teamMembers: team.value ?? [],
      status: body.status,
      progress: body.progress,
      budget: body.budget,
      dueDate: body.dueDate || undefined,
    });

    await project.populate(POPULATE);
    return res.status(201).json({ data: project });
  } catch (error) {
    return res.status(400).json({ error: error.message });
  }
}

/** PUT /api/projects/:id — update project information (owner or admin only). */
export async function updateProject(req, res) {
  try {
    const project = await loadForChange(req, res);
    if (!project) return;

    const body = req.body ?? {};
    const changes = {};
    for (const key of UPDATABLE) {
      if (body[key] !== undefined) changes[key] = body[key];
    }

    if (changes.name !== undefined) {
      changes.name = typeof changes.name === "string" ? changes.name.trim() : "";
      if (!changes.name) return res.status(400).json({ error: "Project name is required" });
    }

    if (changes.client !== undefined) {
      const client = await resolveClient(changes.client);
      if (client.error) return res.status(400).json({ error: client.error });
      changes.client = client.value;
    }

    if (changes.teamMembers !== undefined) {
      const team = await resolveTeamMembers(changes.teamMembers);
      if (team.error) return res.status(400).json({ error: team.error });
      changes.teamMembers = team.value;
    }

    if (changes.dueDate !== undefined && !changes.dueDate) changes.dueDate = null;

    Object.assign(project, changes);
    await project.save();
    await project.populate(POPULATE);

    return res.json({ data: project });
  } catch (error) {
    return res.status(400).json({ error: error.message });
  }
}

/** DELETE /api/projects/:id — remove a project (owner or admin only). */
export async function deleteProject(req, res) {
  try {
    const project = await loadForChange(req, res);
    if (!project) return;

    await project.deleteOne();
    return res.json({ message: "Project deleted", data: { _id: req.params.id } });
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
}
