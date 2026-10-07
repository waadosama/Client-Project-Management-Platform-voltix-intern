import { Client } from "../models/Client.js";

/** GET /api/clients — the client directory (used to assign a project to a client). */
export async function listClients(_req, res) {
  try {
    const clients = await Client.find().sort({ name: 1 }).lean();
    return res.json({ data: clients, count: clients.length });
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
}

/** POST /api/clients — create a client the current user can assign projects to. */
export async function createClient(req, res) {
  try {
    const { name, contactName, email, phone, notes } = req.body ?? {};
    if (!name || !String(name).trim()) {
      return res.status(400).json({ error: "Client name is required" });
    }

    const exists = await Client.findOne({
      normalizedName: String(name).trim().toLowerCase(),
    });
    if (exists) {
      return res.status(409).json({ error: "A client with that name already exists" });
    }

    const client = await Client.create({
      name: String(name).trim(),
      contactName,
      email,
      phone,
      notes,
      createdBy: req.user._id,
    });

    return res.status(201).json({ data: client });
  } catch (error) {
    // 11000 = raced another create with the same name
    if (error?.code === 11000) {
      return res.status(409).json({ error: "A client with that name already exists" });
    }
    return res.status(400).json({ error: error.message });
  }
}
