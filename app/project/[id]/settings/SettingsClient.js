"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Header from "@/components/Header";
import AddMemberModal from "@/components/AddMemberModal";
import AddWeekModal from "@/components/AddWeekModal";
import { createClient } from "@/lib/supabase/client";
import { getInitials } from "@/lib/utils";

export default function SettingsClient({ user, profile, project, initialMembers, initialWeeks }) {
  const [projectData, setProjectData] = useState(project);
  const [members, setMembers] = useState(initialMembers);
  const [weeks, setWeeks] = useState(initialWeeks);
  const [showAddMember, setShowAddMember] = useState(false);
  const [showAddWeek, setShowAddWeek] = useState(false);
  const [saving, setSaving] = useState(false);
  const router = useRouter();
  const supabase = createClient();

  async function handleSaveProject(e) {
    e.preventDefault();
    setSaving(true);
    await supabase
      .from("projects")
      .update({
        name: projectData.name,
        description: projectData.description,
        kickoff_date: projectData.kickoff_date || null,
        target_date: projectData.target_date || null,
      })
      .eq("id", project.id);
    setSaving(false);
  }

  async function handleRemoveMember(memberId, userId) {
    if (!confirm("Remove this member from the project?")) return;
    await supabase.from("project_members").delete().eq("id", memberId);
    setMembers((prev) => prev.filter((m) => m.id !== memberId));
  }

  async function handleDeleteWeek(weekId) {
    if (!confirm("Delete this week and all its tasks?")) return;
    await supabase.from("weeks").delete().eq("id", weekId);
    setWeeks((prev) => prev.filter((w) => w.id !== weekId));
  }

  async function handleDeleteProject() {
    if (!confirm("Delete this entire project? This cannot be undone.")) return;
    if (!confirm("Are you really sure? All tasks and data will be lost.")) return;
    await supabase.from("projects").delete().eq("id", project.id);
    router.push("/");
  }

  return (
    <>
      <Header project={project} user={user} userProfile={profile} />

      <main className="page-container" style={{ maxWidth: "800px" }}>
        <div className="page-header">
          <h1 className="page-title">Settings</h1>
          <p className="page-subtitle">{project.name}</p>
        </div>

        {/* Project Details */}
        <div className="settings-section">
          <div className="settings-section-title">Project Details</div>
          <form onSubmit={handleSaveProject} style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
            <div className="form-group">
              <label className="form-label">Project Name</label>
              <input
                type="text"
                value={projectData.name}
                onChange={(e) => setProjectData({ ...projectData, name: e.target.value })}
              />
            </div>

            <div className="form-group">
              <label className="form-label">Description</label>
              <textarea
                value={projectData.description || ""}
                onChange={(e) => setProjectData({ ...projectData, description: e.target.value })}
                rows={3}
              />
            </div>

            <div className="form-row">
              <div className="form-group">
                <label className="form-label">Kickoff Date</label>
                <input
                  type="date"
                  value={projectData.kickoff_date || ""}
                  onChange={(e) => setProjectData({ ...projectData, kickoff_date: e.target.value })}
                />
              </div>
              <div className="form-group">
                <label className="form-label">Target Date</label>
                <input
                  type="date"
                  value={projectData.target_date || ""}
                  onChange={(e) => setProjectData({ ...projectData, target_date: e.target.value })}
                />
              </div>
            </div>

            <button type="submit" className="btn btn-primary" disabled={saving} style={{ alignSelf: "flex-start" }}>
              {saving ? <span className="spinner" /> : "Save Changes"}
            </button>
          </form>
        </div>

        {/* Members */}
        <div className="settings-section">
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <div className="settings-section-title" style={{ marginBottom: 0 }}>
              Team Members ({members.length})
            </div>
            <button className="btn btn-secondary btn-sm" onClick={() => setShowAddMember(true)}>
              + Add Member
            </button>
          </div>

          <div style={{ marginTop: "12px" }}>
            {members.map((m) => (
              <div key={m.id} className="settings-list-item">
                <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                  <div
                    className="avatar avatar-sm"
                    style={{ background: m.profiles?.avatar_color || "#8ab4f8" }}
                  >
                    {getInitials(m.profiles?.full_name)}
                  </div>
                  <div>
                    <div style={{ fontSize: "14px", fontWeight: 500 }}>
                      {m.profiles?.full_name}
                    </div>
                    <div className="text-sm text-muted">
                      {m.role_title} · {m.profiles?.email}
                    </div>
                  </div>
                </div>
                {m.user_id !== user.id && (
                  <button
                    className="btn btn-ghost btn-sm"
                    onClick={() => handleRemoveMember(m.id, m.user_id)}
                    style={{ color: "var(--error)" }}
                  >
                    Remove
                  </button>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Weeks */}
        <div className="settings-section">
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <div className="settings-section-title" style={{ marginBottom: 0 }}>
              Weeks ({weeks.length})
            </div>
            <button className="btn btn-secondary btn-sm" onClick={() => setShowAddWeek(true)}>
              + Add Week
            </button>
          </div>

          <div style={{ marginTop: "12px" }}>
            {weeks.map((w) => (
              <div key={w.id} className="settings-list-item">
                <div>
                  <div style={{ fontSize: "14px", fontWeight: 500 }}>
                    Week {w.week_number}: {w.title}
                  </div>
                  <div className="text-sm text-muted">
                    {w.date_range}
                    {w.theme && ` · ${w.theme}`}
                  </div>
                </div>
                <button
                  className="btn btn-ghost btn-sm"
                  onClick={() => handleDeleteWeek(w.id)}
                  style={{ color: "var(--error)" }}
                >
                  Delete
                </button>
              </div>
            ))}
          </div>
        </div>

        {/* Danger Zone */}
        <div className="settings-section" style={{ borderColor: "rgba(242, 139, 130, 0.3)" }}>
          <div className="settings-section-title" style={{ color: "var(--error)" }}>
            Danger Zone
          </div>
          <p className="text-sm text-muted" style={{ marginBottom: "16px" }}>
            Permanently delete this project and all associated data (members, weeks, tasks).
          </p>
          <button className="btn btn-danger" onClick={handleDeleteProject}>
            Delete Project
          </button>
        </div>

        {/* Modals */}
        {showAddMember && (
          <AddMemberModal
            projectId={project.id}
            existingMemberIds={members.map((m) => m.user_id)}
            onClose={() => setShowAddMember(false)}
            onAdded={(m) => {
              setMembers((prev) => [...prev, m]);
              setShowAddMember(false);
            }}
          />
        )}

        {showAddWeek && (
          <AddWeekModal
            projectId={project.id}
            existingWeeks={weeks}
            onClose={() => setShowAddWeek(false)}
            onAdded={(w) => {
              setWeeks((prev) => [...prev, w].sort((a, b) => a.week_number - b.week_number));
              setShowAddWeek(false);
            }}
          />
        )}
      </main>
    </>
  );
}
