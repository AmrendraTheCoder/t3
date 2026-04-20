"use client";

import { useState } from "react";
import { getInitials } from "@/lib/utils";

export default function EmailComposer({ members, projectName, onSend }) {
  const [selectedMembers, setSelectedMembers] = useState([]);
  const [subject, setSubject] = useState(`[${projectName}] Weekly Update`);
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);

  function toggleMember(email) {
    setSelectedMembers((prev) =>
      prev.includes(email)
        ? prev.filter((e) => e !== email)
        : [...prev, email]
    );
  }

  function selectAll() {
    const allEmails = members.map((m) => m.profiles?.email).filter(Boolean);
    setSelectedMembers(allEmails);
  }

  async function handleSend() {
    if (selectedMembers.length === 0 || !subject.trim() || !message.trim()) return;
    setLoading(true);

    try {
      const res = await fetch("/api/send-notification", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          to: selectedMembers,
          subject: subject.trim(),
          message: message.trim(),
          projectName,
        }),
      });

      if (!res.ok) throw new Error("Failed to send");

      setSent(true);
      setTimeout(() => setSent(false), 3000);
      setMessage("");
      setSelectedMembers([]);
      if (onSend) onSend();
    } catch (err) {
      alert("Failed to send email: " + err.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="email-composer">
      <h3 style={{ fontSize: "15px", fontWeight: 500, marginBottom: "16px" }}>
        Send Notification
      </h3>

      <div style={{ marginBottom: "12px" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "8px" }}>
          <span className="form-label">Recipients</span>
          <button className="btn btn-ghost btn-sm" onClick={selectAll}>
            Select All
          </button>
        </div>
        <div className="email-recipients">
          {members.map((m) => {
            const email = m.profiles?.email;
            if (!email) return null;
            return (
              <button
                key={email}
                className={`email-recipient-chip ${selectedMembers.includes(email) ? "selected" : ""}`}
                onClick={() => toggleMember(email)}
              >
                <div
                  className="avatar avatar-sm"
                  style={{
                    background: m.profiles?.avatar_color || "#8B6F47",
                    width: "20px",
                    height: "20px",
                    fontSize: "9px",
                  }}
                >
                  {getInitials(m.profiles?.full_name)}
                </div>
                {m.profiles?.full_name}
              </button>
            );
          })}
        </div>
      </div>

      <div className="form-group" style={{ marginBottom: "12px" }}>
        <label className="form-label">Subject</label>
        <input
          type="text"
          value={subject}
          onChange={(e) => setSubject(e.target.value)}
        />
      </div>

      <div className="form-group" style={{ marginBottom: "16px" }}>
        <label className="form-label">Message</label>
        <textarea
          placeholder="Write your message to the team…"
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          rows={5}
        />
      </div>

      <button
        className="btn btn-primary"
        onClick={handleSend}
        disabled={loading || selectedMembers.length === 0 || !message.trim()}
      >
        {loading ? (
          <span className="spinner" />
        ) : sent ? (
          "✓ Sent!"
        ) : (
          `Send to ${selectedMembers.length} member${selectedMembers.length !== 1 ? "s" : ""}`
        )}
      </button>
    </div>
  );
}
