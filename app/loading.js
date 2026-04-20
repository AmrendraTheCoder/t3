export default function Loading() {
  return (
    <div className="loading-container" style={{ minHeight: "100vh" }}>
      <div style={{ textAlign: "center" }}>
        <div className="spinner" style={{ width: "24px", height: "24px", margin: "0 auto 12px" }} />
        <p className="text-sm text-muted">Loading...</p>
      </div>
    </div>
  );
}
