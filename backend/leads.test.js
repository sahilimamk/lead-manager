const fs = require("fs");
const request = require("supertest");

process.env.LEAD_DB = require("path").join(__dirname, "test-leads.db");
const app = require("./server");

afterAll(() => {
  try {
    fs.unlinkSync(process.env.LEAD_DB);
  } catch (e) {}
});

const goodLead = {
  name: "Asha Verma",
  email: "asha@example.com",
  phone: "+91 98765 43210",
  company: "Acme Corp",
  source: "Website",
  status: "New",
};

describe("Lead Manager API", () => {
  test("creates a lead", async () => {
    const res = await request(app).post("/api/leads").send(goodLead);
    expect(res.status).toBe(201);
    expect(res.body.id).toBeDefined();
    expect(res.body.name).toBe("Asha Verma");
  });

  test("rejects a lead with a bad email", async () => {
    const res = await request(app)
      .post("/api/leads")
      .send({ ...goodLead, email: "not-an-email" });
    expect(res.status).toBe(400);
    expect(res.body.errors.length).toBeGreaterThan(0);
  });

  test("rejects a lead with no name", async () => {
    const res = await request(app).post("/api/leads").send({ ...goodLead, name: "" });
    expect(res.status).toBe(400);
  });

  test("lists leads and searches by name", async () => {
    await request(app).post("/api/leads").send({ ...goodLead, name: "Rohan Mehta", email: "rohan@example.com" });
    const all = await request(app).get("/api/leads");
    expect(all.status).toBe(200);
    expect(all.body.total).toBeGreaterThanOrEqual(2);

    const found = await request(app).get("/api/leads?search=Rohan");
    expect(found.body.leads.length).toBe(1);
    expect(found.body.leads[0].name).toBe("Rohan Mehta");
  });

  test("filters by status and returns stats", async () => {
    const filtered = await request(app).get("/api/leads?status=New");
    expect(filtered.status).toBe(200);
    expect(filtered.body.leads.every((l) => l.status === "New")).toBe(true);

    const stats = await request(app).get("/api/leads/stats");
    expect(stats.status).toBe(200);
    expect(stats.body.total).toBeGreaterThanOrEqual(2);
    expect(stats.body.byStatus.New).toBeGreaterThanOrEqual(2);
  });

  test("updates a lead status", async () => {
    const created = await request(app).post("/api/leads").send(goodLead);
    const res = await request(app)
      .put("/api/leads/" + created.body.id)
      .send({ ...goodLead, status: "Qualified" });
    expect(res.status).toBe(200);
    expect(res.body.status).toBe("Qualified");
  });

  test("deletes a lead", async () => {
    const created = await request(app).post("/api/leads").send(goodLead);
    const res = await request(app).delete("/api/leads/" + created.body.id);
    expect(res.status).toBe(200);
    const gone = await request(app).get("/api/leads/" + created.body.id);
    expect(gone.status).toBe(404);
  });

  test("returns 404 for a missing lead", async () => {
    const res = await request(app).get("/api/leads/999999");
    expect(res.status).toBe(404);
  });
});
