"use client";

import Header from "@/components/Header";
import EmailComposer from "@/components/EmailComposer";
import { getInitials, calculateProgress } from "@/lib/utils";

export default function AdminClient({ user, profile, project, members, weeks, tasks, emailLogs }) {
  const totalTasks = tasks.length;
  const doneTasks = tasks.filter((t) => t.status === "done").length;
  const inProgressTasks = tasks.filter((t) => t.status === "in_progress").length;
  const todoTasks = tasks.filter((t) => t.status === "todo").length;
  const overallProgress = calculateProgress(tasks);

  // Per-member stats
  const memberStats = members.map((m) => {
    const memberTasks = tasks.filter((t) => t.assigned_to === m.user_id);
    return {
      ...m,
      total: memberTasks.length,
      done: memberTasks.filter((t) => t.status === "done").length,
      progress: calculateProgress(memberTasks),
    };
  });

  // Per-week stats
  const weekStats = weeks.map((w) => {
    const weekTasks = tasks.filter((t) => t.week_id === w.id);
    return {
      ...w,
      total: weekTasks.length,
      done: weekTasks.filter((t) => t.status === "done").length,
      progress: calculateProgress(weekTasks),
    };
  });

  return (
    <>
      <Header project={project} user={user} userProfile={profile} />

      <main className="page-container">
        <div className="page-header">
          <h1 className="page-title">Dashboard</h1>
          <p className="page-subtitle">Admin overview for {project.name}</p>
        </div>

        {/* Stats Grid */}
        <div className="stats-grid">
          <div className="stat-card">
            <div className="stat-card-label">Total Tasks</div>
            <div className="stat-card-value">{totalTasks}</div>
            <div className="stat-card-sub">{weeks.length} weeks, {members.length} members</div>
          </div>

          <div className="stat-card">
            <div className="stat-card-label">Completed</div>
            <div className="stat-card-value" style={{ color: "var(--success)" }}>
              {doneTasks}
            </div>
            <div className="stat-card-sub">{overallProgress}% done</div>
          </div>

          <div className="stat-card">
            <div className="stat-card-label">In Progress</div>
            <div className="stat-card-value" style={{ color: "var(--warning)" }}>
              {inProgressTasks}
            </div>
            <div className="stat-card-sub">Active right now</div>
          </div>

          <div className="stat-card">
            <div className="stat-card-label">To Do</div>
            <div className="stat-card-value" style={{ color: "var(--text-secondary)" }}>
              {todoTasks}
            </div>
            <div className="stat-card-sub">Pending tasks</div>
          </div>
        </div>

        {/* Progress Bar */}
        <div className="admin-section">
          <div style={{ marginBottom: "16px" }}>
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "8px" }}>
              <span className="text-sm text-muted">Overall Progress</span>
              <span className="text-sm font-semibold">{overallProgress}%</span>
            </div>
            <div className="progress-bar" style={{ height: "8px" }}>
              <div
                className="progress-bar-fill"
                style={{ width: `${overallProgress}%` }}
              />
            </div>
          </div>
        </div>

        {/* Per-Member Progress */}
        <div className="admin-section">
          <div className="admin-section-title">Team Progress</div>
          {memberStats.map((m) => (
            <div key={m.user_id} className="member-progress-row">
              <div className="member-progress-label">
                <div
                  className="avatar avatar-sm"
                  style={{ background: m.profiles?.avatar_color || "#8ab4f8" }}
                >
                  {getInitials(m.profiles?.full_name)}
                </div>
                {m.profiles?.full_name}
              </div>
              <div className="member-progress-bar">
                <div
                  className="member-progress-fill"
                  style={{
                    width: `${m.progress}%`,
                    background:
                      m.progress >= 75
                        ? "var(--success)"
                        : m.progress >= 40
                        ? "var(--warning)"
                        : "var(--error)",
                  }}
                />
              </div>
              <div className="member-progress-pct">{m.progress}%</div>
              <div className="text-sm text-muted" style={{ width: "80px", textAlign: "right" }}>
                {m.done}/{m.total} tasks
              </div>
            </div>
          ))}
        </div>

        {/* Per-Week Grid */}
        <div className="admin-section">
          <div className="admin-section-title">Weekly Breakdown</div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(180px, 1fr))", gap: "12px" }}>
            {weekStats.map((w) => (
              <div key={w.id} className="card" style={{ textAlign: "center" }}>
                <div className="text-sm font-semibold" style={{ marginBottom: "4px" }}>
                  Week {w.week_number}
                </div>
                <div className="text-sm text-muted" style={{ marginBottom: "10px" }}>
                  {w.title}
                </div>
                <div
                  style={{
                    fontSize: "24px",
                    fontWeight: 500,
                    fontFamily: "var(--font-display)",
                    color:
                      w.progress >= 75
                        ? "var(--success)"
                        : w.progress >= 40
                        ? "var(--warning)"
                        : "var(--text-secondary)",
                  }}
                >
                  {w.progress}%
                </div>
                <div className="text-sm text-muted">
                  {w.done}/{w.total} tasks
                </div>
                <div className="progress-bar" style={{ height: "3px", marginTop: "8px" }}>
                  <div
                    className="progress-bar-fill"
                    style={{
                      width: `${w.progress}%`,
                      background:
                        w.progress >= 75
                          ? "var(--success)"
                          : w.progress >= 40
                          ? "var(--warning)"
                          : "var(--error)",
                    }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Email Composer */}
        <div className="admin-section">
          <div className="admin-section-title">Notifications</div>
          <EmailComposer
            members={members}
            projectName={project.name}
          />

          {emailLogs.length > 0 && (
            <div style={{ marginTop: "24px" }}>
              <div className="text-sm text-muted" style={{ marginBottom: "12px" }}>
                Recent emails
              </div>
              {emailLogs.map((log) => (
                <div
                  key={log.id}
                  className="settings-list-item"
                  style={{ fontSize: "13px" }}
                >
                  <div>
                    <span style={{ fontWeight: 500 }}>{log.subject}</span>
                    <span className="text-muted"> — {log.sent_to}</span>
                  </div>
                  <div className="text-muted">
                    {new Date(log.sent_at).toLocaleDateString()}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </main>
    </>
  );
}
