import { useState } from "react";
import { SOURCES, STATUSES } from "./api.js";

const emptyForm = {
  name: "",
  email: "",
  phone: "",
  company: "",
  source: "Website",
  status: "New",
};

function validate(form) {
  const errors = {};
  if (!form.name.trim()) errors.name = "Name is required.";
  if (!form.email.trim()) {
    errors.email = "Email is required.";
  } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email.trim())) {
    errors.email = "Email is not valid.";
  }
  const digits = form.phone.replace(/[^0-9]/g, "");
  if (form.phone && !/^[0-9+()\- ]+$/.test(form.phone)) {
    errors.phone = "Phone can only contain digits, spaces, +, - and brackets.";
  } else if (form.phone && digits.length < 7) {
    errors.phone = "Phone must have at least 7 digits.";
  }
  return errors;
}

export default function LeadForm({ editing, onSave, onCancel, saving }) {
  const [form, setForm] = useState(editing || emptyForm);
  const [errors, setErrors] = useState({});
  const [serverError, setServerError] = useState("");

  function change(e) {
    setForm({ ...form, [e.target.name]: e.target.value });
  }

  async function submit(e) {
    e.preventDefault();
    const found = validate(form);
    setErrors(found);
    if (Object.keys(found).length) return;
    setServerError("");
    try {
      await onSave(form);
    } catch (err) {
      setServerError(err.message);
    }
  }

  return (
    <form className="card form" onSubmit={submit}>
      <h2>{editing ? "Edit lead" : "Add a lead"}</h2>
      {serverError && <p className="error">{serverError}</p>}

      <label>
        Name *
        <input name="name" value={form.name} onChange={change} placeholder="Asha Verma" />
        {errors.name && <span className="field-error">{errors.name}</span>}
      </label>

      <label>
        Email *
        <input name="email" value={form.email} onChange={change} placeholder="asha@example.com" />
        {errors.email && <span className="field-error">{errors.email}</span>}
      </label>

      <label>
        Phone
        <input name="phone" value={form.phone} onChange={change} placeholder="+91 98765 43210" />
        {errors.phone && <span className="field-error">{errors.phone}</span>}
      </label>

      <label>
        Company
        <input name="company" value={form.company} onChange={change} placeholder="Acme Corp" />
      </label>

      <label>
        Source
        <select name="source" value={form.source} onChange={change}>
          {SOURCES.map((s) => (
            <option key={s} value={s}>{s}</option>
          ))}
        </select>
      </label>

      <label>
        Status
        <select name="status" value={form.status} onChange={change}>
          {STATUSES.map((s) => (
            <option key={s} value={s}>{s}</option>
          ))}
        </select>
      </label>

      <div className="form-actions">
        <button type="submit" disabled={saving}>
          {saving ? "Saving..." : editing ? "Save changes" : "Add lead"}
        </button>
        {editing && (
          <button type="button" className="secondary" onClick={onCancel}>
            Cancel
          </button>
        )}
      </div>
    </form>
  );
}
