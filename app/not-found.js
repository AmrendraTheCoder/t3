import Link from "next/link";

export default function NotFound() {
  return (
    <div className="auth-container">
      <div style={{ textAlign: "center" }}>
        <div style={{ fontSize: "64px", marginBottom: "16px", opacity: 0.3 }}>404</div>
        <h1 className="page-title" style={{ marginBottom: "8px" }}>Page Not Found</h1>
        <p className="text-sm text-muted" style={{ marginBottom: "24px" }}>
          The page you're looking for doesn't exist.
        </p>
        <Link href="/" className="btn btn-primary">
          Go Home
        </Link>
      </div>
    </div>
  );
}
