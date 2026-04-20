"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

export default function CreateProjectModal({ onClose, onCreated }) {
  const [mode, setMode] = useState("smart"); // "smart" or "manual"
  const router = useRouter();

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" onClick={(e) => e.stopPropagation()} style={{ maxWidth: "620px" }}>
        <div className="modal-header">
          <h2 className="modal-title">New Project</h2>
          <button className="btn-icon" onClick={onClose}>✕</button>
        </div>

        {/* Tabs */}
        <div style={{ padding: "0 24px", display: "flex", gap: "0", borderBottom: "1px solid var(--outline)" }}>
          <button
            onClick={() => setMode("smart")}
            style={{
              padding: "12px 16px",
              fontSize: "14px",
              fontWeight: 500,
              fontFamily: "var(--font-display)",
              color: mode === "smart" ? "var(--primary)" : "var(--text-secondary)",
              borderBottom: mode === "smart" ? "2px solid var(--primary)" : "2px solid transparent",
              marginBottom: "-1px",
              background: "none",
              border: "none",
              borderBottomStyle: "solid",
              borderBottomWidth: "2px",
              borderBottomColor: mode === "smart" ? "var(--primary)" : "transparent",
              cursor: "pointer",
            }}
          >
            Smart Create
          </button>
          <button
            onClick={() => setMode("manual")}
            style={{
              padding: "12px 16px",
              fontSize: "14px",
              fontWeight: 500,
              fontFamily: "var(--font-display)",
              color: mode === "manual" ? "var(--primary)" : "var(--text-secondary)",
              borderBottom: "none",
              marginBottom: "-1px",
              background: "none",
              border: "none",
              borderBottomStyle: "solid",
              borderBottomWidth: "2px",
              borderBottomColor: mode === "manual" ? "var(--primary)" : "transparent",
              cursor: "pointer",
            }}
          >
            Manual
          </button>
        </div>

        {mode === "smart" ? (
          <SmartCreateForm onClose={onClose} onCreated={onCreated} router={router} />
        ) : (
          <ManualCreateForm onClose={onClose} onCreated={onCreated} />
        )}
      </div>
    </div>
  );
}

// ============ SMART CREATE ============

function SmartCreateForm({ onClose, onCreated, router }) {
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [goals, setGoals] = useState("");
  const [kickoff, setKickoff] = useState("");
  const [weekCount, setWeekCount] = useState(6);
  const [roles, setRoles] = useState([
    { title: "", name: "" },
  ]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [progress, setProgress] = useState("");

  function addRole() {
    setRoles((prev) => [...prev, { title: "", name: "" }]);
  }

  function removeRole(index) {
    setRoles((prev) => prev.filter((_, i) => i !== index));
  }

  function updateRole(index, field, value) {
    setRoles((prev) =>
      prev.map((r, i) => (i === index ? { ...r, [field]: value } : r))
    );
  }

  async function handleSubmit(e) {
    e.preventDefault();
    if (!name.trim() || !description.trim() || roles.length === 0) return;

    const validRoles = roles.filter((r) => r.title.trim());
    if (validRoles.length === 0) {
      setError("Add at least one role.");
      return;
    }

    setLoading(true);
    setError("");
    setProgress("Generating plan with AI...");

    try {
      const res = await fetch("/api/generate-plan", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: name.trim(),
          description: description.trim(),
          goals: goals.trim(),
          roles: validRoles,
          weekCount,
          kickoffDate: kickoff || null,
        }),
      });

      const data = await res.json();

      if (!res.ok) throw new Error(data.error || "Failed to generate plan");

      setProgress(`Created ${data.weeksCreated} weeks with ${data.tasksCreated} tasks`);

      setTimeout(() => {
        onClose();
        router.push(`/project/${data.projectId}`);
        router.refresh();
      }, 800);
    } catch (err) {
      setError(err.message);
      setProgress("");
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit}>
      <div className="modal-body">
        <p className="text-sm text-muted" style={{ marginBottom: "8px" }}>
          Describe your project and team. AI will generate a complete weekly plan with tasks distributed per role.
        </p>

        <div className="form-group">
          <label className="form-label">Project Name *</label>
          <input
            type="text"
            placeholder="e.g. Mobile App Redesign, SaaS Platform v2"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
            autoFocus
          />
        </div>

        <div className="form-group">
          <label className="form-label">Description *</label>
          <textarea
            placeholder="Describe what you're building, the tech stack, key features, and any constraints..."
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={4}
            required
          />
        </div>

        <div className="form-group">
          <label className="form-label">Goals (optional)</label>
          <textarea
            placeholder="Key milestones, MVP features, or deliverables you want by the end..."
            value={goals}
            onChange={(e) => setGoals(e.target.value)}
            rows={2}
          />
        </div>

        <div className="form-row">
          <div className="form-group">
            <label className="form-label">Kickoff Date</label>
            <input
              type="date"
              value={kickoff}
              onChange={(e) => setKickoff(e.target.value)}
            />
          </div>
          <div className="form-group">
            <label className="form-label">Number of Weeks *</label>
            <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
              <input
                type="range"
                min="2"
                max="16"
                value={weekCount}
                onChange={(e) => setWeekCount(parseInt(e.target.value))}
                style={{ flex: 1, padding: "0" }}
              />
              <span style={{ minWidth: "48px", textAlign: "center", fontWeight: 500, fontFamily: "var(--font-display)" }}>
                {weekCount}
              </span>
            </div>
          </div>
        </div>

        {/* Team Roles */}
        <div className="form-group">
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <label className="form-label">Team Roles *</label>
            <button type="button" className="btn btn-ghost btn-sm" onClick={addRole}>
              + Add Role
            </button>
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
            {roles.map((role, i) => (
              <div key={i} style={{ display: "flex", gap: "8px", alignItems: "center" }}>
                <input
                  type="text"
                  placeholder="Role title (e.g. Frontend Dev)"
                  value={role.title}
                  onChange={(e) => updateRole(i, "title", e.target.value)}
                  style={{ flex: 1 }}
                />
                <input
                  type="text"
                  placeholder="Person name (optional)"
                  value={role.name}
                  onChange={(e) => updateRole(i, "name", e.target.value)}
                  style={{ flex: 1 }}
                />
                {roles.length > 1 && (
                  <button
                    type="button"
                    className="btn-icon"
                    onClick={() => removeRole(i)}
                    style={{ flexShrink: 0, width: "28px", height: "28px", fontSize: "14px" }}
                  >
                    ✕
                  </button>
                )}
              </div>
            ))}
          </div>
          <span className="text-sm text-muted" style={{ marginTop: "4px" }}>
            If person name matches a registered user, tasks will be auto-assigned to them.
          </span>
        </div>

        {error && <p className="form-error">{error}</p>}
        {progress && !error && (
          <div style={{
            padding: "12px 16px",
            background: "var(--primary-container)",
            borderRadius: "var(--radius-sm)",
            fontSize: "13px",
            color: "var(--primary)",
            display: "flex",
            alignItems: "center",
            gap: "8px",
          }}>
            {loading && <span className="spinner" style={{ width: "16px", height: "16px", borderWidth: "2px" }} />}
            {progress}
          </div>
        )}
      </div>

      <div className="modal-footer">
        <button type="button" className="btn btn-secondary" onClick={onClose}>
          Cancel
        </button>
        <button type="submit" className="btn btn-primary" disabled={loading}>
          {loading ? "Generating..." : "Generate Plan"}
        </button>
      </div>
    </form>
  );
}

// ============ MANUAL CREATE ============

function ManualCreateForm({ onClose, onCreated }) {
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [kickoff, setKickoff] = useState("");
  const [target, setTarget] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const supabase = createClient();

  async function handleSubmit(e) {
    e.preventDefault();
    if (!name.trim()) return;
    setLoading(true);
    setError("");

    try {
      const { data: { user } } = await supabase.auth.getUser();

      const { data: project, error: projError } = await supabase
        .from("projects")
        .insert({
          name: name.trim(),
          description: description.trim(),
          kickoff_date: kickoff || null,
          target_date: target || null,
          created_by: user.id,
        })
        .select()
        .single();

      if (projError) throw projError;

      await supabase.from("project_members").insert({
        project_id: project.id,
        user_id: user.id,
        role_title: "Admin",
        display_order: 0,
      });

      if (onCreated) onCreated(project);
      onClose();
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit}>
      <div className="modal-body">
        <div className="form-group">
          <label className="form-label">Project Name *</label>
          <input
            type="text"
            placeholder="e.g. Mobile App Redesign"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
            autoFocus
          />
        </div>

        <div className="form-group">
          <label className="form-label">Description</label>
          <textarea
            placeholder="Brief description of the project"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={3}
          />
        </div>

        <div className="form-row">
          <div className="form-group">
            <label className="form-label">Kickoff Date</label>
            <input
              type="date"
              value={kickoff}
              onChange={(e) => setKickoff(e.target.value)}
            />
          </div>
          <div className="form-group">
            <label className="form-label">Target Date</label>
            <input
              type="date"
              value={target}
              onChange={(e) => setTarget(e.target.value)}
            />
          </div>
        </div>

        {error && <p className="form-error">{error}</p>}
      </div>

      <div className="modal-footer">
        <button type="button" className="btn btn-secondary" onClick={onClose}>
          Cancel
        </button>
        <button type="submit" className="btn btn-primary" disabled={loading}>
          {loading ? <span className="spinner" /> : "Create Project"}
        </button>
      </div>
    </form>
  );
}
