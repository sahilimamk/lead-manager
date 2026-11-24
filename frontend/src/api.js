const BASE = import.meta.env.VITE_API_URL || "http://localhost:4000/api";

async function request(path, options) {
  const res = await fetch(BASE + path, {
    headers: { "Content-Type": "application/json" },
    ...options,
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error((data.errors && data.errors.join(" ")) || "Request failed.");
  }
  return data;
}

export const api = {
  listLeads: (params) => {
    const query = new URLSearchParams(params).toString();
    return request("/leads?" + query);
  },
  getStats: () => request("/leads/stats"),
  createLead: (lead) => request("/leads", { method: "POST", body: JSON.stringify(lead) }),
  updateLead: (id, lead) =>
    request("/leads/" + id, { method: "PUT", body: JSON.stringify(lead) }),
  deleteLead: (id) => request("/leads/" + id, { method: "DELETE" }),
};

export const SOURCES = ["Website", "Referral", "LinkedIn", "Cold Call", "Email", "Other"];
export const STATUSES = ["New", "Contacted", "Qualified", "Lost"];
