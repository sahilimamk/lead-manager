import { useEffect, useState } from "react";
import { api, STATUSES } from "./api.js";
import LeadForm from "./LeadForm.jsx";

export default function App() {
  const [leads, setLeads] = useState([]);
  const [stats, setStats] = useState(null);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [sort, setSort] = useState("created_at");
  const [order, setOrder] = useState("desc");
  const [editing, setEditing] = useState(null);
  const [confirmDelete, setConfirmDelete] = useState(null);
  const [apiDown, setApiDown] = useState(false);
  const [message, setMessage] = useState("");
  const [saving, setSaving] = useState(false);

  async function load() {
    try {
      const data = await api.listLeads({
        search,
        status: statusFilter,
        sort,
        order,
        page,
        limit: 10,
      });
      setLeads(data.leads);
      setTotal(data.total);
      setTotalPages(Math.max(1, data.totalPages));
      setApiDown(false);
    } catch (err) {
      setApiDown(true);
    }
    try {
      setStats(await api.getStats());
    } catch (err) {
      setApiDown(true);
    }
  }

  useEffect(() => {
    load();
  }, [search, statusFilter, sort, order, page]);

  function changeSort(field) {
    if (sort === field) {
      setOrder(order === "asc" ? "desc" : "asc");
    } else {
      setSort(field);
      setOrder("asc");
    }
  }

  function sortArrow(field) {
    if (sort !== field) return "";
    return order === "asc" ? " ▲" : " ▼";
  }

  async function saveLead(form) {
    setSaving(true);
    try {
      if (editing) {
        await api.updateLead(editing.id, form);
        setMessage("Lead updated.");
      } else {
        await api.createLead(form);
        setMessage("Lead added.");
      }
      setEditing(null);
      setPage(1);
      await load();
    } finally {
      setSaving(false);
    }
  }

  async function deleteLead(id) {
    await api.deleteLead(id);
    setConfirmDelete(null);
    setMessage("Lead deleted.");
    await load();
  }

  return (
    <main>
      <h1>Lead Manager</h1>
      <p className="subtitle">Capture and track your sales leads in one place.</p>

      {apiDown && (
        <p className="error banner">
          Could not reach the API. Make sure the backend is running on port 4000, then refresh.
        </p>
      )}
      {message && <p className="notice">{message}</p>}

      {stats && (
        <section className="stats">
          <div className="stat-card">
            <strong>{stats.total}</strong>
            <span>Total leads</span>
          </div>
          {STATUSES.map((s) => (
            <div className="stat-card" key={s}>
              <strong>{stats.byStatus[s] || 0}</strong>
              <span>{s}</span>
            </div>
          ))}
        </section>
      )}

      <LeadForm
        editing={editing}
        onSave={saveLead}
        onCancel={() => setEditing(null)}
        saving={saving}
      />

      <section className="card">
        <div className="toolbar">
          <input
            type="search"
            placeholder="Search by name, company or email..."
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(1);
            }}
          />
          <select
            value={statusFilter}
            onChange={(e) => {
              setStatusFilter(e.target.value);
              setPage(1);
            }}
          >
            <option value="">All statuses</option>
            {STATUSES.map((s) => (
              <option key={s} value={s}>{s}</option>
            ))}
          </select>
        </div>

        {leads.length === 0 ? (
          <p className="empty">No leads yet. Add your first lead above.</p>
        ) : (
          <>
            <table>
              <thead>
                <tr>
                  <th>
                    <button className="sort" onClick={() => changeSort("name")}>
                      Name{sortArrow("name")}
                    </button>
                  </th>
                  <th>Email</th>
                  <th>Phone</th>
                  <th>
                    <button className="sort" onClick={() => changeSort("company")}>
                      Company{sortArrow("company")}
                    </button>
                  </th>
                  <th>Source</th>
                  <th>Status</th>
                  <th>
                    <button className="sort" onClick={() => changeSort("created_at")}>
                      Added{sortArrow("created_at")}
                    </button>
                  </th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {leads.map((lead) => (
                  <tr key={lead.id}>
                    <td>{lead.name}</td>
                    <td>{lead.email}</td>
                    <td>{lead.phone || "-"}</td>
                    <td>{lead.company || "-"}</td>
                    <td>{lead.source}</td>
                    <td>
                      <span className={"badge " + lead.status.toLowerCase()}>{lead.status}</span>
                    </td>
                    <td>{new Date(lead.created_at).toLocaleDateString()}</td>
                    <td className="actions">
                      <button className="secondary" onClick={() => setEditing(lead)}>
                        Edit
                      </button>
                      {confirmDelete === lead.id ? (
                        <>
                          <button className="danger" onClick={() => deleteLead(lead.id)}>
                            Sure?
                          </button>
                          <button className="secondary" onClick={() => setConfirmDelete(null)}>
                            No
                          </button>
                        </>
                      ) : (
                        <button className="danger-outline" onClick={() => setConfirmDelete(lead.id)}>
                          Delete
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            <div className="pagination">
              <button disabled={page <= 1} onClick={() => setPage(page - 1)}>
                Previous
              </button>
              <span>
                Page {page} of {totalPages} ({total} leads)
              </span>
              <button disabled={page >= totalPages} onClick={() => setPage(page + 1)}>
                Next
              </button>
            </div>
          </>
        )}
      </section>
    </main>
  );
}
