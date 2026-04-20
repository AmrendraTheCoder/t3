"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Header, { MemberFilter } from "@/components/Header";
import WeekSelector from "@/components/WeekSelector";
import WeekView from "@/components/WeekView";
import AddTaskModal from "@/components/AddTaskModal";
import AddWeekModal from "@/components/AddWeekModal";
import EmptyState from "@/components/EmptyState";
import { formatDate } from "@/lib/utils";

export default function ProjectClient({ user, profile, project, initialMembers, initialWeeks, initialTasks }) {
  const [members] = useState(initialMembers);
  const [weeks, setWeeks] = useState(initialWeeks);
  const [tasks, setTasks] = useState(initialTasks);
  const [activeWeek, setActiveWeek] = useState(initialWeeks[0]?.id || null);
  const [memberFilter, setMemberFilter] = useState("all");
  const [showAddTask, setShowAddTask] = useState(false);
  const [addTaskAssignee, setAddTaskAssignee] = useState("");
  const [showAddWeek, setShowAddWeek] = useState(false);

  const router = useRouter();
  const isAdmin = profile?.role === "admin";
  const currentWeek = weeks.find((w) => w.id === activeWeek);
  const weekTasks = tasks.filter((t) => t.week_id === activeWeek);

  function handleStatusChange(taskId, newStatus) {
    setTasks((prev) =>
      prev.map((t) => (t.id === taskId ? { ...t, status: newStatus } : t))
    );
  }

  function handleDeleteTask(taskId) {
    setTasks((prev) => prev.filter((t) => t.id !== taskId));
  }

  function handleAddTask(assignedTo) {
    setAddTaskAssignee(assignedTo);
    setShowAddTask(true);
  }

  function handleTaskAdded(newTask) {
    setTasks((prev) => [...prev, newTask]);
  }

  function handleWeekAdded(newWeek) {
    setWeeks((prev) => [...prev, newWeek].sort((a, b) => a.week_number - b.week_number));
    setActiveWeek(newWeek.id);
  }

  return (
    <>
      <Header
        project={project}
        members={members}
        user={user}
        userProfile={profile}
      />

      <main className="page-container">
        {/* Project Info */}
        <div className="page-header">
          <h1 className="page-title">{project.name}</h1>
          <p className="page-subtitle">
            {project.kickoff_date && `Kickoff: ${formatDate(project.kickoff_date)}`}
            {project.kickoff_date && project.target_date && " · "}
            {project.target_date && `Target: ${formatDate(project.target_date)}`}
            {(project.kickoff_date || project.target_date) && " · "}
            {members.length} member{members.length !== 1 ? "s" : ""}
          </p>
        </div>

        {/* Member Filter */}
        <MemberFilter
          members={members}
          currentFilter={memberFilter}
          onFilterChange={setMemberFilter}
        />

        {/* Week Selector */}
        <div style={{ display: "flex", alignItems: "center", gap: "12px", marginBottom: "24px" }}>
          <div style={{ flex: 1 }}>
            <WeekSelector
              weeks={weeks}
              activeWeek={activeWeek}
              onSelect={setActiveWeek}
            />
          </div>
          {isAdmin && (
            <button className="btn btn-secondary btn-sm" onClick={() => setShowAddWeek(true)}>
              + Week
            </button>
          )}
        </div>

        {/* Week Content */}
        {!currentWeek ? (
          <EmptyState
            title="No weeks yet"
            text={
              isAdmin
                ? "Add your first week to start organizing tasks."
                : "No weeks have been created for this project yet."
            }
            action={
              isAdmin && (
                <button className="btn btn-primary" onClick={() => setShowAddWeek(true)}>
                  Add First Week
                </button>
              )
            }
          />
        ) : (
          <WeekView
            week={currentWeek}
            members={members}
            tasks={weekTasks}
            currentUserId={user.id}
            isAdmin={isAdmin}
            onStatusChange={handleStatusChange}
            onDelete={handleDeleteTask}
            onAddTask={handleAddTask}
            memberFilter={memberFilter}
          />
        )}

        {/* Modals */}
        {showAddTask && (
          <AddTaskModal
            weekId={activeWeek}
            assignedTo={addTaskAssignee}
            members={members}
            onClose={() => setShowAddTask(false)}
            onAdded={handleTaskAdded}
          />
        )}

        {showAddWeek && (
          <AddWeekModal
            projectId={project.id}
            existingWeeks={weeks}
            onClose={() => setShowAddWeek(false)}
            onAdded={handleWeekAdded}
          />
        )}
      </main>
    </>
  );
}
