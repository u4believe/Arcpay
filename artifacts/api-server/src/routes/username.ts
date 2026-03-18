import { Router, type IRouter } from "express";
import fs from "fs";
import path from "path";

const router: IRouter = Router();

const DATA_FILE = path.join(process.cwd(), "data/usernames.json");

interface UsernameStore {
  byAddress: Record<string, string>;  // address.toLowerCase() → username
  byUsername: Record<string, string>; // username.toLowerCase() → address
}

function readStore(): UsernameStore {
  try {
    const raw = fs.readFileSync(DATA_FILE, "utf8");
    const parsed = JSON.parse(raw);
    return {
      byAddress: parsed.byAddress ?? {},
      byUsername: parsed.byUsername ?? {},
    };
  } catch {
    return { byAddress: {}, byUsername: {} };
  }
}

function writeStore(store: UsernameStore) {
  fs.mkdirSync(path.dirname(DATA_FILE), { recursive: true });
  fs.writeFileSync(DATA_FILE, JSON.stringify(store, null, 2), "utf8");
}

const USERNAME_RE = /^[a-zA-Z0-9_-]{3,20}$/;

// GET /api/username/check/:username — is it available?
router.get("/username/check/:username", (req, res) => {
  const { username } = req.params;
  if (!USERNAME_RE.test(username)) {
    res.json({ available: false, reason: "Invalid format (3–20 chars, letters/numbers/_/-)" });
    return;
  }
  const store = readStore();
  const taken = !!store.byUsername[username.toLowerCase()];
  res.json({ available: !taken });
});

// GET /api/username/:address — get username for address
router.get("/username/:address", (req, res) => {
  const address = req.params.address.toLowerCase();
  const store = readStore();
  const username = store.byAddress[address];
  if (!username) {
    res.status(404).json({ error: "No username for this address" });
    return;
  }
  res.json({ address, username });
});

// POST /api/username — claim username { address, username }
router.post("/username", (req, res) => {
  const { address, username } = req.body as { address?: string; username?: string };

  if (!address || typeof address !== "string") {
    res.status(400).json({ error: "address is required" });
    return;
  }
  if (!username || typeof username !== "string") {
    res.status(400).json({ error: "username is required" });
    return;
  }
  if (!USERNAME_RE.test(username)) {
    res.status(400).json({ error: "Invalid username (3–20 chars, letters/numbers/_/-)" });
    return;
  }

  const addrKey = address.toLowerCase();
  const userKey = username.toLowerCase();

  const store = readStore();

  // Already has a username — permanent, cannot change
  if (store.byAddress[addrKey]) {
    res.status(409).json({ error: "This wallet already has a username and it cannot be changed.", username: store.byAddress[addrKey] });
    return;
  }

  // Username already taken
  if (store.byUsername[userKey]) {
    res.status(409).json({ error: "Username already taken" });
    return;
  }

  store.byAddress[addrKey] = username;
  store.byUsername[userKey] = addrKey;
  writeStore(store);

  res.status(201).json({ address, username });
});

export default router;
