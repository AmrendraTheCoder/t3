"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";

export default function GitHubImportModal({ onClose }) {
  const [repos, setRepos] = useState([]);
  const [loadingRepos, setLoadingRepos] = useState(true);
  const [repoError, setRepoError] = useState("");
  const [selectedRepo, setSelectedRepo] = useState(null);
  const [weekCount, setWeekCount] = useState(6);
  const [analyzing, setAnalyzing] = useState(false);
  const [analyzeProgress, setAnalyzeProgress] = useState("");
  const [analyzeError, setAnalyzeError] = useState("");
  const [search, setSearch] = useState("");

  const router = useRouter();

  useEffect(() => {
    fetchRepos();
  }, []);

  async function fetchRepos() {
    setLoadingRepos(true);
    setRepoError("");

    try {
      const res = await fetch("/api/github/repos");
      const data = await res.json();

      if (!res.ok) throw new Error(data.error);
      setRepos(data.repos);
    } catch (err) {
      setRepoError(err.message);
    } finally {
      setLoadingRepos(false);
    }
  }

  async function handleAnalyze() {
    if (!selectedRepo) return;
    setAnalyzing(true);
    setAnalyzeError("");
    setAnalyzeProgress("Fetching repository data...");

    try {
      setTimeout(() => setAnalyzeProgress("Analyzing codebase with AI..."), 2000);

      const res = await fetch("/api/github/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          repoFullName: selectedRepo.full_name,
          weekCount,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error);

      setAnalyzeProgress(`Created ${data.weeksCreated} weeks with ${data.tasksCreated} tasks`);

      setTimeout(() => {
        onClose();
        router.push(`/project/${data.projectId}`);
        router.refresh();
      }, 1000);
    } catch (err) {
      setAnalyzeError(err.message);
      setAnalyzeProgress("");
    } finally {
      setAnalyzing(false);
    }
  }

  const filteredRepos = search
    ? repos.filter((r) =>
        r.name.toLowerCase().includes(search.toLowerCase()) ||
        (r.description || "").toLowerCase().includes(search.toLowerCase())
      )
    : repos;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" onClick={(e) => e.stopPropagation()} style={{ maxWidth: "620px" }}>
        <div className="modal-header">
          <h2 className="modal-title">Import from GitHub</h2>
          <button className="btn-icon" onClick={onClose}>✕</button>
        </div>

        <div className="modal-body">
          {/* Error state */}
          {repoError && (
            <div style={{
              padding: "16px",
              background: "var(--error-container)",
              borderRadius: "var(--radius-sm)",
              color: "var(--error)",
              fontSize: "13px",
              lineHeight: 1.5,
            }}>
              {repoError}
            </div>
          )}

          {/* Loading state */}
          {loadingRepos && (
            <div className="loading-container" style={{ minHeight: "200px" }}>
              <span className="spinner" />
            </div>
          )}

          {/* Repo list */}
          {!loadingRepos && !repoError && (
            <>
              <div className="form-group" style={{ marginBottom: "12px" }}>
                <input
                  type="text"
                  placeholder="Search repositories..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                />
              </div>

              <div style={{
                maxHeight: "280px",
                overflowY: "auto",
                border: "1px solid var(--outline)",
                borderRadius: "var(--radius-sm)",
                marginBottom: "16px",
              }}>
                {filteredRepos.length === 0 ? (
                  <div style={{ padding: "24px", textAlign: "center", color: "var(--text-secondary)", fontSize: "13px" }}>
                    No repositories found
                  </div>
                ) : (
                  filteredRepos.map((repo) => (
                    <button
                      key={repo.id}
                      onClick={() => setSelectedRepo(repo)}
                      style={{
                        display: "block",
                        width: "100%",
                        padding: "12px 16px",
                        textAlign: "left",
                        borderBottom: "1px solid var(--outline)",
                        background: selectedRepo?.id === repo.id ? "var(--primary-container)" : "transparent",
                        cursor: "pointer",
                        transition: "background 150ms",
                        border: "none",
                        borderBottom: "1px solid var(--outline)",
                        color: "inherit",
                      }}
                    >
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                        <div>
                          <div style={{ fontSize: "14px", fontWeight: 500, fontFamily: "var(--font-display)" }}>
                            {repo.name}
                            {repo.private && (
                              <span style={{
                                marginLeft: "8px",
                                fontSize: "11px",
                                padding: "1px 6px",
                                borderRadius: "4px",
                                border: "1px solid var(--outline)",
                                color: "var(--text-secondary)",
                              }}>
                                Private
                              </span>
                            )}
                          </div>
                          {repo.description && (
                            <div style={{ fontSize: "12px", color: "var(--text-secondary)", marginTop: "2px" }}>
                              {repo.description.slice(0, 80)}
                            </div>
                          )}
                        </div>
                        <div style={{ display: "flex", alignItems: "center", gap: "8px", flexShrink: 0 }}>
                          {repo.language && (
                            <span style={{ fontSize: "12px", color: "var(--text-secondary)" }}>
                              {repo.language}
                            </span>
                          )}
                          {repo.open_issues_count > 0 && (
                            <span style={{ fontSize: "12px", color: "var(--text-disabled)" }}>
                              {repo.open_issues_count} issues
                            </span>
                          )}
                        </div>
                      </div>
                    </button>
                  ))
                )}
              </div>

              {/* Selected repo details */}
              {selectedRepo && (
                <div style={{
                  padding: "12px 16px",
                  background: "var(--bg-surface-variant)",
                  borderRadius: "var(--radius-sm)",
                  marginBottom: "16px",
                }}>
                  <div style={{ fontSize: "13px", fontWeight: 500 }}>
                    Selected: {selectedRepo.full_name}
                  </div>
                  <div className="text-sm text-muted" style={{ marginTop: "2px" }}>
                    {selectedRepo.description || "No description"}
                  </div>
                </div>
              )}

              <div className="form-group">
                <label className="form-label">Number of Weeks</label>
                <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                  <input
                    type="range"
                    min="2"
                    max="16"
                    value={weekCount}
                    onChange={(e) => setWeekCount(parseInt(e.target.value))}
                    style={{ flex: 1, padding: "0" }}
                  />
                  <span style={{ minWidth: "48px", textAlign: "center", fontWeight: 500, fontFamily: "var(--font-display)" }}>
                    {weekCount}
                  </span>
                </div>
              </div>

              {analyzeError && <p className="form-error">{analyzeError}</p>}
              {analyzeProgress && !analyzeError && (
                <div style={{
                  padding: "12px 16px",
                  background: "var(--primary-container)",
                  borderRadius: "var(--radius-sm)",
                  fontSize: "13px",
                  color: "var(--primary)",
                  display: "flex",
                  alignItems: "center",
                  gap: "8px",
                  marginTop: "12px",
                }}>
                  {analyzing && <span className="spinner" style={{ width: "16px", height: "16px", borderWidth: "2px" }} />}
                  {analyzeProgress}
                </div>
              )}
            </>
          )}
        </div>

        <div className="modal-footer">
          <button type="button" className="btn btn-secondary" onClick={onClose}>
            Cancel
          </button>
          <button
            className="btn btn-primary"
            onClick={handleAnalyze}
            disabled={!selectedRepo || analyzing}
          >
            {analyzing ? "Analyzing..." : "Analyze & Create"}
          </button>
        </div>
      </div>
    </div>
  );
}
