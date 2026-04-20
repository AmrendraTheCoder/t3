"use client";

import PersonColumn from "./PersonColumn";

export default function WeekView({ week, members, tasks, currentUserId, isAdmin, onStatusChange, onDelete, onAddTask, memberFilter }) {
  const filteredMembers = memberFilter === "all"
    ? members
    : members.filter((m) => m.user_id === memberFilter);

  return (
    <div>
      <div className="week-header">
        <div className="week-title">
          {week.date_range && <>{week.date_range} · </>}
          <span>{week.title || `Week ${week.week_number}`}</span>
        </div>
      </div>

      <div className="week-columns">
        {filteredMembers.map((member) => {
          const memberTasks = tasks.filter(
            (t) => t.assigned_to === member.user_id
          );
          return (
            <PersonColumn
              key={member.user_id}
              member={member}
              tasks={memberTasks}
              currentUserId={currentUserId}
              isAdmin={isAdmin}
              onStatusChange={onStatusChange}
              onDelete={onDelete}
              onAddTask={onAddTask}
            />
          );
        })}
      </div>
    </div>
  );
}
