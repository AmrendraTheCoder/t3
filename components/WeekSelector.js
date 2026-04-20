"use client";

export default function WeekSelector({ weeks, activeWeek, onSelect }) {
  if (!weeks || weeks.length === 0) return null;

  return (
    <div className="pill-group" style={{ marginBottom: "24px" }}>
      {weeks
        .sort((a, b) => a.week_number - b.week_number)
        .map((w) => (
          <button
            key={w.id}
            className={`pill ${activeWeek === w.id ? "active" : ""}`}
            onClick={() => onSelect(w.id)}
          >
            Week {w.week_number}
          </button>
        ))}
    </div>
  );
}
