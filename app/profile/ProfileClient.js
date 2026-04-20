"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Header from "@/components/Header";
import { createClient } from "@/lib/supabase/client";
import { getInitials } from "@/lib/utils";

const AVATAR_COLORS = [
  "#8ab4f8", "#81c995", "#fdd663", "#f28b82",
  "#c58af9", "#78d9ec", "#fcad70", "#ff8bcb",
  "#a8c7fa", "#b5e8cc",
];

export default function ProfileClient({ user, profile }) {
  const [fullName, setFullName] = useState(profile?.full_name || "");
  const [avatarColor, setAvatarColor] = useState(profile?.avatar_color || "#8ab4f8");
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [passwordNew, setPasswordNew] = useState("");
  const [passwordMsg, setPasswordMsg] = useState("");
  const [githubToken, setGithubToken] = useState(profile?.github_token || "");
  const [githubSaving, setGithubSaving] = useState(false);
  const [githubSaved, setGithubSaved] = useState(false);
  const router = useRouter();
  const supabase = createClient();

  async function handleSaveProfile(e) {
    e.preventDefault();
    setSaving(true);

    await supabase
      .from("profiles")
      .update({
        full_name: fullName.trim(),
        avatar_color: avatarColor,
      })
      .eq("id", user.id);

    setSaving(false);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  }

  async function handleChangePassword(e) {
    e.preventDefault();
    setPasswordMsg("");

    if (passwordNew.length < 6) {
      setPasswordMsg("Password must be at least 6 characters.");
      return;
    }

    const { error } = await supabase.auth.updateUser({
      password: passwordNew,
    });

    if (error) {
      setPasswordMsg(error.message);
    } else {
      setPasswordMsg("Password updated successfully.");
      setPasswordNew("");
    }
  }

  async function handleSaveGitHub(e) {
    e.preventDefault();
    setGithubSaving(true);

    await supabase
      .from("profiles")
      .update({ github_token: githubToken.trim() || null })
      .eq("id", user.id);

    setGithubSaving(false);
    setGithubSaved(true);
    setTimeout(() => setGithubSaved(false), 2000);
  }

  async function handleSignOut() {
    await supabase.auth.signOut();
    router.push("/login");
  }

  return (
    <>
      <Header user={user} userProfile={profile} />

      <main className="page-container" style={{ maxWidth: "640px" }}>
        <div className="page-header">
          <h1 className="page-title">Profile</h1>
          <p className="page-subtitle">Manage your account settings</p>
        </div>

        {/* Profile Info */}
        <div className="settings-section">
          <div className="settings-section-title">Account</div>

          <div style={{ display: "flex", alignItems: "center", gap: "16px", marginBottom: "24px" }}>
            <div
              className="avatar avatar-lg"
              style={{ background: avatarColor, width: "56px", height: "56px", fontSize: "20px" }}
            >
              {getInitials(fullName)}
            </div>
            <div>
              <div style={{ fontSize: "16px", fontWeight: 500, fontFamily: "var(--font-display)" }}>
                {fullName || "Your Name"}
              </div>
              <div className="text-sm text-muted">{user.email}</div>
              <div className="text-sm" style={{ marginTop: "2px" }}>
                <span style={{
                  padding: "2px 8px",
                  borderRadius: "4px",
                  fontSize: "11px",
                  fontWeight: 500,
                  textTransform: "uppercase",
                  letterSpacing: "0.5px",
                  background: profile?.role === "admin" ? "var(--primary-container)" : "var(--bg-surface-variant)",
                  color: profile?.role === "admin" ? "var(--primary)" : "var(--text-secondary)",
                }}>
                  {profile?.role || "member"}
                </span>
              </div>
            </div>
          </div>

          <form onSubmit={handleSaveProfile} style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
            <div className="form-group">
              <label className="form-label">Full Name</label>
              <input
                type="text"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                placeholder="Enter your full name"
              />
            </div>

            <div className="form-group">
              <label className="form-label">Email</label>
              <input
                type="email"
                value={user.email}
                disabled
                style={{ opacity: 0.5, cursor: "not-allowed" }}
              />
              <span className="text-sm text-muted" style={{ marginTop: "4px" }}>
                Email cannot be changed
              </span>
            </div>

            <div className="form-group">
              <label className="form-label">Avatar Color</label>
              <div style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
                {AVATAR_COLORS.map((color) => (
                  <button
                    key={color}
                    type="button"
                    onClick={() => setAvatarColor(color)}
                    style={{
                      width: "32px",
                      height: "32px",
                      borderRadius: "50%",
                      background: color,
                      border: avatarColor === color ? "2px solid var(--text-primary)" : "2px solid transparent",
                      cursor: "pointer",
                      outline: avatarColor === color ? "2px solid var(--primary)" : "none",
                      outlineOffset: "2px",
                      transition: "all 150ms ease",
                    }}
                  />
                ))}
              </div>
            </div>

            <button
              type="submit"
              className="btn btn-primary"
              disabled={saving}
              style={{ alignSelf: "flex-start" }}
            >
              {saving ? <span className="spinner" /> : saved ? "Saved" : "Save Changes"}
            </button>
          </form>
        </div>

        {/* GitHub Integration */}
        <div className="settings-section">
          <div className="settings-section-title">GitHub Integration</div>
          <p className="text-sm text-muted" style={{ marginBottom: "16px" }}>
            Connect your GitHub account to import repositories and auto-generate project plans from your codebase.
          </p>
          <form onSubmit={handleSaveGitHub} style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
            <div className="form-group">
              <label className="form-label">Personal Access Token</label>
              <input
                type="password"
                value={githubToken}
                onChange={(e) => setGithubToken(e.target.value)}
                placeholder="ghp_xxxxxxxxxxxxxxxxxxxx"
              />
              <span className="text-sm text-muted" style={{ marginTop: "4px" }}>
                Create a token at{" "}
                <a
                  href="https://github.com/settings/tokens/new?scopes=repo,read:user"
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{ color: "var(--primary)" }}
                >
                  github.com/settings/tokens
                </a>
                {" "}with <strong>repo</strong> scope.
              </span>
            </div>

            <div style={{ display: "flex", gap: "8px", alignItems: "center" }}>
              <button
                type="submit"
                className="btn btn-secondary"
                disabled={githubSaving}
                style={{ alignSelf: "flex-start" }}
              >
                {githubSaving ? <span className="spinner" /> : githubSaved ? "Saved" : "Save Token"}
              </button>
              {githubToken && (
                <button
                  type="button"
                  className="btn btn-ghost btn-sm"
                  onClick={async () => {
                    setGithubToken("");
                    await supabase.from("profiles").update({ github_token: null }).eq("id", user.id);
                    setGithubSaved(true);
                    setTimeout(() => setGithubSaved(false), 2000);
                  }}
                  style={{ color: "var(--error)" }}
                >
                  Remove
                </button>
              )}
            </div>
          </form>
        </div>

        {/* Change Password */}
        <div className="settings-section">
          <div className="settings-section-title">Change Password</div>
          <form onSubmit={handleChangePassword} style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
            <div className="form-group">
              <label className="form-label">New Password</label>
              <input
                type="password"
                value={passwordNew}
                onChange={(e) => setPasswordNew(e.target.value)}
                placeholder="Enter new password"
                minLength={6}
              />
            </div>

            {passwordMsg && (
              <p style={{
                fontSize: "13px",
                color: passwordMsg.includes("success") ? "var(--success)" : "var(--error)",
              }}>
                {passwordMsg}
              </p>
            )}

            <button
              type="submit"
              className="btn btn-secondary"
              style={{ alignSelf: "flex-start" }}
            >
              Update Password
            </button>
          </form>
        </div>

        {/* Session */}
        <div className="settings-section">
          <div className="settings-section-title">Session</div>
          <p className="text-sm text-muted" style={{ marginBottom: "16px" }}>
            Signed in as <strong>{user.email}</strong>
          </p>
          <button className="btn btn-danger" onClick={handleSignOut}>
            Sign Out
          </button>
        </div>
      </main>
    </>
  );
}
