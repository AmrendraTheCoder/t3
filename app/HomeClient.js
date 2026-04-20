"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Header from "@/components/Header";
import ProjectCard from "@/components/ProjectCard";
import CreateProjectModal from "@/components/CreateProjectModal";
import GitHubImportModal from "@/components/GitHubImportModal";
import EmptyState from "@/components/EmptyState";

export default function HomeClient({ user, profile, initialProjects, allTasks }) {
  const [projects, setProjects] = useState(initialProjects);
  const [showCreate, setShowCreate] = useState(false);
  const [showGitHub, setShowGitHub] = useState(false);
  const router = useRouter();
  const isAdmin = profile?.role === "admin";

  function getProjectTasks(projectId) {
    return allTasks.filter((t) => t.weeks?.project_id === projectId);
  }

  function handleCreated(project) {
    setProjects((prev) => [{ ...project, project_members: [{ user_id: user.id }] }, ...prev]);
    router.refresh();
  }

  return (
    <>
      <Header user={user} userProfile={profile} />
      <main className="page-container">
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "32px" }}>
          <div>
            <h1 className="page-title">Projects</h1>
            <p className="page-subtitle">
              {projects.length} project{projects.length !== 1 ? "s" : ""}
              {profile?.role === "admin" && " · Admin"}
            </p>
          </div>
          {isAdmin && (
            <div style={{ display: "flex", gap: "8px" }}>
              {profile?.github_token && (
                <button className="btn btn-secondary" onClick={() => setShowGitHub(true)}>
                  Import from GitHub
                </button>
              )}
              <button className="btn btn-primary" onClick={() => setShowCreate(true)}>
                + New Project
              </button>
            </div>
          )}
        </div>

        {projects.length === 0 ? (
          <EmptyState
            title="No projects yet"
            text={
              isAdmin
                ? "Create your first project to start tracking tasks for your team."
                : "You haven't been added to any projects yet. Ask your admin to add you."
            }
            action={
              isAdmin && (
                <div style={{ display: "flex", gap: "8px", justifyContent: "center" }}>
                  <button className="btn btn-primary" onClick={() => setShowCreate(true)}>
                    Create a Project
                  </button>
                  {profile?.github_token && (
                    <button className="btn btn-secondary" onClick={() => setShowGitHub(true)}>
                      Import from GitHub
                    </button>
                  )}
                </div>
              )
            }
          />
        ) : (
          <div className="projects-grid">
            {projects.map((project) => (
              <ProjectCard
                key={project.id}
                project={project}
                tasks={getProjectTasks(project.id)}
                memberCount={project.project_members?.length || 0}
              />
            ))}
          </div>
        )}

        {showCreate && (
          <CreateProjectModal
            onClose={() => setShowCreate(false)}
            onCreated={handleCreated}
          />
        )}

        {showGitHub && (
          <GitHubImportModal
            onClose={() => setShowGitHub(false)}
          />
        )}
      </main>
    </>
  );
}
