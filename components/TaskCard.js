"use client";

import { getStatusLabel, getNextStatus } from "@/lib/utils";
import { createClient } from "@/lib/supabase/client";

export default function TaskCard({ task, canEdit, isAdmin, onStatusChange, onDelete }) {
  const supabase = createClient();

  function handleStatusToggle() {
    if (!canEdit) return;
    const newStatus = getNextStatus(task.status);

    // Optimistic: update UI immediately
    if (onStatusChange) onStatusChange(task.id, newStatus);

    // Fire DB update in background (no await)
    supabase
      .from("tasks")
      .update({ status: newStatus, updated_at: new Date().toISOString() })
      .eq("id", task.id)
      .then(({ error }) => {
        if (error) {
          // Revert on failure
          if (onStatusChange) onStatusChange(task.id, task.status);
        }
      });
  }

  function handleDelete() {
    if (!confirm("Delete this task?")) return;

    // Optimistic: remove from UI immediately
    if (onDelete) onDelete(task.id);

    // Fire DB delete in background
    supabase
      .from("tasks")
      .delete()
      .eq("id", task.id)
      .then(({ error }) => {
        if (error) console.error("Delete failed:", error);
      });
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
          disabled={!canEdit}
          title={canEdit ? "Click to change status" : "Only assigned member or admin can change"}
        >
          <span className={`status-dot ${task.status}`} />
          {getStatusLabel(task.status)}
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
