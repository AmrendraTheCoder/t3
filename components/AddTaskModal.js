"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";

export default function AddTaskModal({ weekId, assignedTo, members, onClose, onAdded }) {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [assignee, setAssignee] = useState(assignedTo || "");
  const [isDeliverable, setIsDeliverable] = useState(false);
  const [deliverableText, setDeliverableText] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const supabase = createClient();

  async function handleSubmit(e) {
    e.preventDefault();
    if (!title.trim() || !assignee) return;
    setLoading(true);
    setError("");

    try {
      const { data, error: err } = await supabase
        .from("tasks")
        .insert({
          week_id: weekId,
          assigned_to: assignee,
          title: title.trim(),
          description: description.trim(),
          is_deliverable: isDeliverable,
          deliverable_text: isDeliverable ? deliverableText.trim() : "",
          status: "todo",
        })
        .select()
        .single();

      if (err) throw err;
      if (onAdded) onAdded(data);
      onClose();
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2 className="modal-title">Add Task</h2>
          <button className="btn-icon" onClick={onClose}>✕</button>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="modal-body">
            <div className="form-group">
              <label className="form-label">Task Title *</label>
              <input
                type="text"
                placeholder="e.g. Set up project scaffold"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                required
                autoFocus
              />
            </div>

            <div className="form-group">
              <label className="form-label">Description</label>
              <textarea
                placeholder="Details about this task…"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={3}
              />
            </div>

            <div className="form-group">
              <label className="form-label">Assign To *</label>
              <select value={assignee} onChange={(e) => setAssignee(e.target.value)} required>
                <option value="">Select a member</option>
                {members.map((m) => (
                  <option key={m.user_id} value={m.user_id}>
                    {m.profiles?.full_name || "Unknown"} — {m.role_title}
                  </option>
                ))}
              </select>
            </div>

            <div className="form-group">
              <label style={{ display: "flex", alignItems: "center", gap: "8px", cursor: "pointer" }}>
                <input
                  type="checkbox"
                  checked={isDeliverable}
                  onChange={(e) => setIsDeliverable(e.target.checked)}
                  style={{ width: "auto" }}
                />
                <span className="form-label" style={{ margin: 0 }}>Mark as Deliverable</span>
              </label>
            </div>

            {isDeliverable && (
              <div className="form-group">
                <label className="form-label">Deliverable Description</label>
                <input
                  type="text"
                  placeholder="e.g. Working API returning structured JSON"
                  value={deliverableText}
                  onChange={(e) => setDeliverableText(e.target.value)}
                />
              </div>
            )}

            {error && <p className="form-error">{error}</p>}
          </div>

          <div className="modal-footer">
            <button type="button" className="btn btn-secondary" onClick={onClose}>
              Cancel
            </button>
            <button type="submit" className="btn btn-primary" disabled={loading}>
              {loading ? <span className="spinner" /> : "Add Task"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
