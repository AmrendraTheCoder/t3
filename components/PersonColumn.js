"use client";

import { getInitials } from "@/lib/utils";
import TaskCard from "./TaskCard";

export default function PersonColumn({ member, tasks, currentUserId, isAdmin, onStatusChange, onDelete, onAddTask }) {
  const profile = member.profiles || {};
  const canEditAny = isAdmin;
  const isOwnColumn = member.user_id === currentUserId;

  return (
    <div className="person-column">
      <div className="person-column-header">
        <div
          className="avatar"
          style={{ background: profile.avatar_color || "#8B6F47" }}
        >
          {getInitials(profile.full_name)}
        </div>
        <div>
          <div className="person-column-name">{profile.full_name || "Unknown"}</div>
          <div className="person-column-role">{member.role_title}</div>
        </div>
      </div>

      <div className="person-column-tasks">
        {tasks.map((task) => (
          <TaskCard
            key={task.id}
            task={task}
            canEdit={canEditAny || isOwnColumn}
            isAdmin={isAdmin}
            onStatusChange={onStatusChange}
            onDelete={onDelete}
          />
        ))}

        {isAdmin && (
          <button
            className="add-task-btn"
            onClick={() => onAddTask(member.user_id)}
          >
            + Add Task
          </button>
        )}

        {tasks.length === 0 && !isAdmin && (
          <div style={{ padding: "20px", textAlign: "center", color: "var(--text-muted)", fontSize: "13px" }}>
            No tasks this week
          </div>
        )}
      </div>
    </div>
  );
}
