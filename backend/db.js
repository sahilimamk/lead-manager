const path = require("path");
const { DatabaseSync } = require("node:sqlite");

const dbPath = process.env.LEAD_DB || path.join(__dirname, "leads.db");
const db = new DatabaseSync(dbPath);

db.exec(`
  CREATE TABLE IF NOT EXISTS leads (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    email TEXT NOT NULL,
    phone TEXT,
    company TEXT,
    source TEXT,
    status TEXT NOT NULL CHECK(status IN ('New', 'Contacted', 'Qualified', 'Lost')),
    created_at TEXT NOT NULL,
    updated_at TEXT NOT NULL
  );
  CREATE INDEX IF NOT EXISTS idx_leads_status ON leads (status);
  CREATE INDEX IF NOT EXISTS idx_leads_name ON leads (name);
`);

module.exports = db;
