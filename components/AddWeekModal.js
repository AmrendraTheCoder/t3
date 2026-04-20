"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";

export default function AddWeekModal({ projectId, existingWeeks, onClose, onAdded }) {
  const nextNumber = existingWeeks.length > 0
    ? Math.max(...existingWeeks.map((w) => w.week_number)) + 1
    : 1;

  const [weekNumber, setWeekNumber] = useState(nextNumber);
  const [title, setTitle] = useState("");
  const [dateRange, setDateRange] = useState("");
  const [theme, setTheme] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const supabase = createClient();

  async function handleSubmit(e) {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const { data, error: err } = await supabase
        .from("weeks")
        .insert({
          project_id: projectId,
          week_number: weekNumber,
          title: title.trim() || `Week ${weekNumber}`,
          date_range: dateRange.trim(),
          theme: theme.trim(),
        })
        .select()
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
          <h2 className="modal-title">Add Week</h2>
          <button className="btn-icon" onClick={onClose}>✕</button>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="modal-body">
            <div className="form-row">
              <div className="form-group">
                <label className="form-label">Week Number *</label>
                <input
                  type="number"
                  min="1"
                  value={weekNumber}
                  onChange={(e) => setWeekNumber(parseInt(e.target.value))}
                  required
                />
              </div>
              <div className="form-group">
                <label className="form-label">Date Range</label>
                <input
                  type="text"
                  placeholder="e.g. June 1–7"
                  value={dateRange}
                  onChange={(e) => setDateRange(e.target.value)}
                />
              </div>
            </div>

            <div className="form-group">
              <label className="form-label">Title</label>
              <input
                type="text"
                placeholder="e.g. Foundation & Setup"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                autoFocus
              />
            </div>

            <div className="form-group">
              <label className="form-label">Theme</label>
              <input
                type="text"
                placeholder="e.g. Project scaffolding, dev environment, design system"
                value={theme}
                onChange={(e) => setTheme(e.target.value)}
              />
            </div>

            {error && <p className="form-error">{error}</p>}
          </div>

          <div className="modal-footer">
            <button type="button" className="btn btn-secondary" onClick={onClose}>
              Cancel
            </button>
            <button type="submit" className="btn btn-primary" disabled={loading}>
              {loading ? <span className="spinner" /> : "Add Week"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
