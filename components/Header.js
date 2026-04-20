"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { getInitials } from "@/lib/utils";

export default function Header({ project, members, currentFilter, onFilterChange, user, userProfile }) {
  const router = useRouter();
  const supabase = createClient();

  async function handleSignOut() {
    await supabase.auth.signOut();
    router.push("/login");
  }

  return (
    <header className="topnav">
      <div style={{ display: "flex", alignItems: "center", gap: "20px" }}>
        <Link href="/" className="topnav-brand">
          <span>T3</span>
        </Link>
        {project && (
          <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
            <span style={{ color: "var(--text-disabled)" }}>|</span>
            <span style={{ fontSize: "14px", fontWeight: 500 }}>{project.name}</span>
          </div>
        )}
      </div>

      <div className="topnav-actions">
        {project && (
          <nav style={{ display: "flex", gap: "4px" }}>
            <Link href={`/project/${project.id}`} className="btn btn-ghost btn-sm">
              Board
            </Link>
            {userProfile?.role === "admin" && (
              <>
                <Link href={`/project/${project.id}/admin`} className="btn btn-ghost btn-sm">
                  Dashboard
                </Link>
                <Link href={`/project/${project.id}/settings`} className="btn btn-ghost btn-sm">
                  Settings
                </Link>
              </>
            )}
          </nav>
        )}

        <div className="topnav-user">
          <Link href="/profile" style={{ display: "flex", alignItems: "center", gap: "8px" }}>
            {userProfile && (
              <div
                className="avatar avatar-sm"
                style={{ background: userProfile.avatar_color || "#8ab4f8" }}
              >
                {getInitials(userProfile.full_name)}
              </div>
            )}
            <span className="text-sm" style={{ color: "var(--text-secondary)" }}>
              {userProfile?.full_name || "Profile"}
            </span>
          </Link>
          <button onClick={handleSignOut} className="btn btn-ghost btn-sm">
            Sign Out
          </button>
        </div>
      </div>
    </header>
  );
}

export function MemberFilter({ members, currentFilter, onFilterChange }) {
  return (
    <div className="pill-group" style={{ marginBottom: "20px" }}>
      <button
        className={`pill ${currentFilter === "all" ? "active" : ""}`}
        onClick={() => onFilterChange("all")}
      >
        All
      </button>
      {members.map((m) => (
        <button
          key={m.user_id}
          className={`pill ${currentFilter === m.user_id ? "active" : ""}`}
          onClick={() => onFilterChange(m.user_id)}
        >
          {m.profiles?.full_name || "Unknown"}
        </button>
      ))}
    </div>
  );
}
