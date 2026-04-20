"use client";

import { useEffect, useState, useCallback } from "react";
import { usePathname, useSearchParams } from "next/navigation";

export default function TopLoader() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [loading, setLoading] = useState(false);
  const [progress, setProgress] = useState(0);

  const startLoading = useCallback(() => {
    setLoading(true);
    setProgress(0);
  }, []);

  // When pathname or search params change, the page has finished loading
  useEffect(() => {
    setLoading(false);
    setProgress(100);

    const timeout = setTimeout(() => setProgress(0), 300);
    return () => clearTimeout(timeout);
  }, [pathname, searchParams]);

  // Animate progress while loading
  useEffect(() => {
    if (!loading) return;

    setProgress(20);

    const t1 = setTimeout(() => setProgress(45), 150);
    const t2 = setTimeout(() => setProgress(65), 400);
    const t3 = setTimeout(() => setProgress(80), 800);
    const t4 = setTimeout(() => setProgress(90), 1500);

    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
      clearTimeout(t3);
      clearTimeout(t4);
    };
  }, [loading]);

  // Intercept link clicks to trigger loading
  useEffect(() => {
    function handleClick(e) {
      const anchor = e.target.closest("a");
      if (!anchor) return;

      const href = anchor.getAttribute("href");
      if (!href || href.startsWith("#") || href.startsWith("http") || href.startsWith("mailto:")) return;
      if (anchor.target === "_blank") return;

      // Don't trigger for same page
      if (href === pathname) return;

      startLoading();
    }

    document.addEventListener("click", handleClick, true);
    return () => document.removeEventListener("click", handleClick, true);
  }, [pathname, startLoading]);

  const isVisible = loading || progress > 0;

  if (!isVisible) return null;

  return (
    <div
      style={{
        position: "fixed",
        top: 0,
        left: 0,
        right: 0,
        height: "2px",
        zIndex: 9999,
        pointerEvents: "none",
      }}
    >
      <div
        style={{
          height: "100%",
          background: "var(--primary)",
          width: `${progress}%`,
          transition: loading
            ? "width 400ms cubic-bezier(0.2, 0, 0, 1)"
            : "width 200ms ease-out, opacity 300ms ease-out",
          opacity: progress === 100 ? 0 : 1,
          boxShadow: "0 0 8px var(--primary)",
        }}
      />
    </div>
  );
}
