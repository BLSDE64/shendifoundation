// netlify/functions/timeline.mjs
//
// Public GET: anyone can read the current list of timeline entries.
// POST / PUT / DELETE: require a matching x-admin-key header, checked
// against the ADMIN_KEY environment variable you set in the Netlify
// dashboard (Project configuration > Environment variables).
//
// Data is stored as a single JSON array in Netlify Blobs (store "timeline",
// key "entries") -- no external database needed.

import { getStore } from "@netlify/blobs";

const STORE_NAME = "timeline";
const KEY = "entries";

function json(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}

function isAuthorized(req) {
  const provided = req.headers.get("x-admin-key") || "";
  const expected = process.env.ADMIN_KEY || "";
  return expected.length > 0 && provided === expected;
}

function makeId() {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 8);
}

export default async (req, context) => {
  const store = getStore(STORE_NAME);

  // ---- Public read ----
  if (req.method === "GET") {
    const entries = (await store.get(KEY, { type: "json" })) || [];
    entries.sort((a, b) => new Date(a.date) - new Date(b.date));
    return json(entries);
  }

  // ---- Everything below changes data, so it requires the admin key ----
  if (!isAuthorized(req)) {
    return json({ error: "Unauthorized" }, 401);
  }

  const entries = (await store.get(KEY, { type: "json" })) || [];

  if (req.method === "POST") {
    let body;
    try {
      body = await req.json();
    } catch {
      return json({ error: "Invalid JSON body" }, 400);
    }
    const entry = {
      id: makeId(),
      date: body.date || "",
      time: body.time || "",
      location: body.location || "",
      description: body.description || "",
      image: body.image || "",
      createdAt: new Date().toISOString(),
    };
    entries.push(entry);
    await store.setJSON(KEY, entries);
    return json(entry, 201);
  }

  if (req.method === "PUT") {
    let body;
    try {
      body = await req.json();
    } catch {
      return json({ error: "Invalid JSON body" }, 400);
    }
    const idx = entries.findIndex((e) => e.id === body.id);
    if (idx === -1) return json({ error: "Not found" }, 404);
    entries[idx] = { ...entries[idx], ...body };
    await store.setJSON(KEY, entries);
    return json(entries[idx]);
  }

  if (req.method === "DELETE") {
    let body;
    try {
      body = await req.json();
    } catch {
      return json({ error: "Invalid JSON body" }, 400);
    }
    const next = entries.filter((e) => e.id !== body.id);
    await store.setJSON(KEY, next);
    return json({ ok: true });
  }

  return json({ error: "Method not allowed" }, 405);
};
