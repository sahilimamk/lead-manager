const express = require("express");
const cors = require("cors");
const db = require("./db");
const { validateLead, SOURCES, STATUSES } = require("./validate");

const app = express();
app.use(cors());
app.use(express.json());

function now() {
  return new Date().toISOString();
}

function findLead(id) {
  return db.prepare("SELECT * FROM leads WHERE id = ?").get(id);
}

// List leads: search, status filter, sorting, pagination
app.get("/api/leads", (req, res) => {
  const search = (req.query.search || "").trim();
  const status = req.query.status || "";
  const sort = ["name", "company", "created_at"].includes(req.query.sort)
    ? req.query.sort
    : "created_at";
  const order = req.query.order === "asc" ? "ASC" : "DESC";
  const page = Math.max(1, parseInt(req.query.page, 10) || 1);
  const limit = Math.min(50, Math.max(1, parseInt(req.query.limit, 10) || 10));
  const offset = (page - 1) * limit;

  const where = [];
  const params = [];
  if (search) {
    where.push("(name LIKE ? OR company LIKE ? OR email LIKE ?)");
    params.push(`%${search}%`, `%${search}%`, `%${search}%`);
  }
  if (status) {
    if (!STATUSES.includes(status)) {
      return res.status(400).json({ errors: ["Unknown status: " + status] });
    }
    where.push("status = ?");
    params.push(status);
  }
  const whereSql = where.length ? "WHERE " + where.join(" AND ") : "";

  const total = db
    .prepare(`SELECT COUNT(*) AS n FROM leads ${whereSql}`)
    .get(...params).n;
  const leads = db
    .prepare(
      `SELECT * FROM leads ${whereSql} ORDER BY ${sort} ${order} LIMIT ? OFFSET ?`
    )
    .all(...params, limit, offset);

  res.json({ leads, total, page, totalPages: Math.ceil(total / limit) });
});

// Dashboard counts per status
app.get("/api/leads/stats", (req, res) => {
  const rows = db
    .prepare("SELECT status, COUNT(*) AS n FROM leads GROUP BY status")
    .all();
  const byStatus = { New: 0, Contacted: 0, Qualified: 0, Lost: 0 };
  let total = 0;
  for (const row of rows) {
    byStatus[row.status] = row.n;
    total += row.n;
  }
  res.json({ total, byStatus });
});

app.get("/api/leads/:id", (req, res) => {
  const lead = findLead(req.params.id);
  if (!lead) return res.status(404).json({ errors: ["Lead not found."] });
  res.json(lead);
});

app.post("/api/leads", (req, res) => {
  const { errors, lead } = validateLead(req.body || {});
  if (errors.length) return res.status(400).json({ errors });

  const result = db
    .prepare(
      `INSERT INTO leads (name, email, phone, company, source, status, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`
    )
    .run(lead.name, lead.email, lead.phone, lead.company, lead.source, lead.status, now(), now());
  res.status(201).json(findLead(result.lastInsertRowid));
});

app.put("/api/leads/:id", (req, res) => {
  const existing = findLead(req.params.id);
  if (!existing) return res.status(404).json({ errors: ["Lead not found."] });

  const { errors, lead } = validateLead(req.body || {});
  if (errors.length) return res.status(400).json({ errors });

  db.prepare(
    `UPDATE leads SET name = ?, email = ?, phone = ?, company = ?, source = ?, status = ?, updated_at = ?
     WHERE id = ?`
  ).run(lead.name, lead.email, lead.phone, lead.company, lead.source, lead.status, now(), req.params.id);
  res.json(findLead(req.params.id));
});

app.delete("/api/leads/:id", (req, res) => {
  const existing = findLead(req.params.id);
  if (!existing) return res.status(404).json({ errors: ["Lead not found."] });
  db.prepare("DELETE FROM leads WHERE id = ?").run(req.params.id);
  res.json({ message: "Lead deleted." });
});

app.get("/api/sources", (req, res) => res.json(SOURCES));

app.use((req, res) => res.status(404).json({ errors: ["Route not found."] }));

app.use((err, req, res, next) => {
  console.error(err);
  res.status(500).json({ errors: ["Something went wrong on the server."] });
});

if (require.main === module) {
  const port = process.env.PORT || 4000;
  app.listen(port, () => console.log("Lead Manager API on http://localhost:" + port));
}

module.exports = app;
