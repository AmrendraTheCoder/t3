"use client";

import Link from "next/link";
import { calculateProgress, formatDate } from "@/lib/utils";

export default function ProjectCard({ project, tasks, memberCount }) {
  const progress = calculateProgress(tasks);

  return (
    <Link href={`/project/${project.id}`}>
      <div className="project-card">
        <div className="project-card-name">{project.name}</div>
        {project.description && (
          <div className="project-card-desc">{project.description}</div>
        )}

        <div className="project-card-meta">
          {project.kickoff_date && (
            <span>Start: {formatDate(project.kickoff_date)}</span>
          )}
          {project.target_date && (
            <span>Target: {formatDate(project.target_date)}</span>
          )}
          <span>{memberCount} member{memberCount !== 1 ? "s" : ""}</span>
        </div>

        <div className="project-card-progress">
          <div className="progress-bar">
            <div
              className="progress-bar-fill"
              style={{ width: `${progress}%` }}
            />
          </div>
          <div className="progress-label">{progress}% complete · {tasks.length} tasks</div>
        </div>
      </div>
    </Link>
  );
}
