const SOURCES = ["Website", "Referral", "LinkedIn", "Cold Call", "Email", "Other"];
const STATUSES = ["New", "Contacted", "Qualified", "Lost"];

function validateLead(body) {
  const errors = [];
  const name = (body.name || "").trim();
  const email = (body.email || "").trim();
  const phone = (body.phone || "").trim();
  const company = (body.company || "").trim();
  const source = body.source || "";
  const status = body.status || "";

  if (!name) errors.push("Name is required.");
  if (!email) {
    errors.push("Email is required.");
  } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    errors.push("Email is not valid.");
  }
  if (phone && !/^[0-9+()\- ]+$/.test(phone)) {
    errors.push("Phone can only contain digits, spaces, +, - and brackets.");
  } else if (phone && phone.replace(/[^0-9]/g, "").length < 7) {
    errors.push("Phone must have at least 7 digits.");
  }
  if (source && !SOURCES.includes(source)) {
    errors.push("Source must be one of: " + SOURCES.join(", ") + ".");
  }
  if (!status) {
    errors.push("Status is required.");
  } else if (!STATUSES.includes(status)) {
    errors.push("Status must be one of: " + STATUSES.join(", ") + ".");
  }

  return {
    errors,
    lead: { name, email, phone, company, source: source || "Other", status },
  };
}

module.exports = { validateLead, SOURCES, STATUSES };
