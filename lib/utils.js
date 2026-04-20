export function generateId() {
  return crypto.randomUUID();
}

export function formatDate(dateStr) {
  if (!dateStr) return "";
  const d = new Date(dateStr);
  return d.toLocaleDateString("en-IN", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

export function getInitials(name) {
  if (!name) return "?";
  return name
    .split(" ")
    .map((w) => w[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);
}

export function getStatusLabel(status) {
  switch (status) {
    case "todo":
      return "To Do";
    case "in_progress":
      return "In Progress";
    case "done":
      return "Done";
    default:
      return status;
  }
}

export function getNextStatus(status) {
  switch (status) {
    case "todo":
      return "in_progress";
    case "in_progress":
      return "done";
    case "done":
      return "todo";
    default:
      return "todo";
  }
}

export function calculateProgress(tasks) {
  if (!tasks || tasks.length === 0) return 0;
  const done = tasks.filter((t) => t.status === "done").length;
  return Math.round((done / tasks.length) * 100);
}

export const AVATAR_COLORS = [
  "#8B6F47",
  "#BE7B7B",
  "#7B8B9A",
  "#6B8E6B",
  "#9A7BBE",
  "#BE9A7B",
  "#7BBEAB",
  "#BE7BAE",
];
