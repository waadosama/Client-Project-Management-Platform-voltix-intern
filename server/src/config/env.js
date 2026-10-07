import dotenv from "dotenv";
import { fileURLToPath } from "node:url";

/**
 * Loads `server/.env` regardless of the directory the process was started from.
 *
 * `import "dotenv/config"` only looks at `process.cwd()`, so starting the API as
 * `node index.js` from `server/src` (or from an editor's terminal) silently
 * skipped the file — `JWT_SECRET` stayed undefined, login threw and every
 * request answered 500 "Login failed".
 *
 * Precedence: a `.env` in the current directory wins (it is loaded first and
 * dotenv never overwrites variables that are already set), then `server/.env`.
 */
const serverEnv = fileURLToPath(new URL("../../.env", import.meta.url));

dotenv.config(); // .env next to where the process was started (optional)
dotenv.config({ path: serverEnv }); // server/.env (the project's config)

export { serverEnv };
