"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import { AVATAR_COLORS, getInitials } from "@/lib/utils";

export default function AddMemberModal({ projectId, existingMemberIds, onClose, onAdded }) {
  const [profiles, setProfiles] = useState([]);
  const [selectedUser, setSelectedUser] = useState("");
  const [roleTitle, setRoleTitle] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const supabase = createClient();

  useEffect(() => {
    async function loadProfiles() {
      const { data } = await supabase
        .from("profiles")
        .select("*")
        .order("full_name");

      if (data) {
        // Filter out already-added members
        setProfiles(data.filter((p) => !existingMemberIds.includes(p.id)));
      }
    }
    loadProfiles();
  }, []);

  async function handleSubmit(e) {
    e.preventDefault();
    if (!selectedUser || !roleTitle.trim()) return;
    setLoading(true);
    setError("");

    try {
      const { data, error: err } = await supabase
        .from("project_members")
        .insert({
          project_id: projectId,
          user_id: selectedUser,
          role_title: roleTitle.trim(),
          display_order: existingMemberIds.length,
        })
        .select("*, profiles(*)")
        .single();

      if (err) throw err;
      if (onAdded) onAdded(data);
      onClose();
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2 className="modal-title">Add Team Member</h2>
          <button className="btn-icon" onClick={onClose}>✕</button>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="modal-body">
            {profiles.length === 0 ? (
              <div className="empty-state" style={{ padding: "20px" }}>
                <div className="empty-state-text">
                  No available users to add. New team members need to sign up first.
                </div>
              </div>
            ) : (
              <>
                <div className="form-group">
                  <label className="form-label">Select User *</label>
                  <select
                    value={selectedUser}
                    onChange={(e) => setSelectedUser(e.target.value)}
                    required
                  >
                    <option value="">Choose a user…</option>
                    {profiles.map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.full_name} ({p.email})
                      </option>
                    ))}
                  </select>
                </div>

                <div className="form-group">
                  <label className="form-label">Role Title *</label>
                  <input
                    type="text"
                    placeholder="e.g. Frontend Dev, AI Engineer, Designer"
                    value={roleTitle}
                    onChange={(e) => setRoleTitle(e.target.value)}
                    required
                  />
                </div>
              </>
            )}

            {error && <p className="form-error">{error}</p>}
          </div>

          <div className="modal-footer">
            <button type="button" className="btn btn-secondary" onClick={onClose}>
              Cancel
            </button>
            <button
              type="submit"
              className="btn btn-primary"
              disabled={loading || profiles.length === 0}
            >
              {loading ? <span className="spinner" /> : "Add Member"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
