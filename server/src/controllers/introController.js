import { Intro, DEFAULT_INTRO } from "../models/Intro.js";

/**
 * Flatten a plain object into MongoDB dot-paths so partial updates merge
 * into nested sub-documents instead of replacing them.
 * Arrays are kept as-is (a new array replaces the old one).
 *
 * { hero: { title: "X" } }  ->  { "hero.title": "X" }
 */
function toDotPaths(input, prefix = "", out = {}) {
  for (const [key, value] of Object.entries(input)) {
    if (key === "_id" || key === "__v" || key === "key") continue;
    const path = prefix ? `${prefix}.${key}` : key;
    const isPlainObject =
      value !== null && typeof value === "object" && !Array.isArray(value) &&
      !(value instanceof Date);

    if (isPlainObject) {
      toDotPaths(value, path, out);
    } else {
      out[path] = value;
    }
  }
  return out;
}

/** GET /api/intro — content for the intro/landing page. */
export async function getIntro(_req, res) {
  try {
    const intro = await Intro.findOne({ key: "intro" }).lean();
    return res.json({
      source: intro ? "database" : "defaults",
      data: intro ?? DEFAULT_INTRO,
    });
  } catch (_error) {
    return res.json({ source: "defaults", data: DEFAULT_INTRO });
  }
}

/** PUT /api/intro — update the intro content (admin editing, deep merge). */
export async function updateIntro(req, res) {
  try {
    const updates = toDotPaths(req.body ?? {});
    if (Object.keys(updates).length === 0) {
      return res.status(400).json({ error: "Nothing to update" });
    }

    const intro = await Intro.findOneAndUpdate(
      { key: "intro" },
      { $set: updates },
      { new: true, upsert: true, runValidators: true }
    );
    return res.json({ source: "database", data: intro });
  } catch (error) {
    return res.status(400).json({ error: error.message });
  }
}
