"use client";

import { getStatusLabel, getNextStatus } from "@/lib/utils";
import { createClient } from "@/lib/supabase/client";
import { useState } from "react";

export default function TaskCard({ task, canEdit, isAdmin, onStatusChange, onDelete }) {
  const [updating, setUpdating] = useState(false);
  const supabase = createClient();

  async function handleStatusToggle() {
    if (!canEdit) return;
    setUpdating(true);
    const newStatus = getNextStatus(task.status);

    const { error } = await supabase
      .from("tasks")
      .update({ status: newStatus, updated_at: new Date().toISOString() })
      .eq("id", task.id);

    if (!error && onStatusChange) {
      onStatusChange(task.id, newStatus);
    }
    setUpdating(false);
  }

  async function handleDelete() {
    if (!confirm("Delete this task?")) return;
    const { error } = await supabase.from("tasks").delete().eq("id", task.id);
    if (!error && onDelete) onDelete(task.id);
  }

  return (
    <div className={`task-card ${task.is_deliverable ? "deliverable" : ""} animate-in`}>
      {isAdmin && (
        <div className="task-card-actions">
          <button className="btn-icon" onClick={handleDelete} title="Delete task">
            ✕
          </button>
        </div>
      )}

      <div className="task-card-title">{task.title}</div>

      {task.description && (
        <div className="task-card-desc">{task.description}</div>
      )}

      <div className="task-card-footer">
        <button
          className={`status-badge ${task.status}`}
          onClick={handleStatusToggle}
          disabled={!canEdit || updating}
          title={canEdit ? "Click to change status" : "Only assigned member or admin can change"}
        >
          <span className={`status-dot ${task.status}`} />
          {updating ? "..." : getStatusLabel(task.status)}
        </button>
      </div>

      {task.is_deliverable && task.deliverable_text && (
        <div className="deliverable-tag">
          Deliverable: {task.deliverable_text}
        </div>
      )}
    </div>
  );
}
