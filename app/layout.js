import "./globals.css";
import { Suspense } from "react";
import TopLoader from "@/components/TopLoader";

export const metadata = {
  title: "T3",
  description:
    "A fast, Notion-like project management tool for tracking weekly tasks per team member with admin dashboard and email notifications.",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>
        <Suspense fallback={null}>
          <TopLoader />
        </Suspense>
        {children}
      </body>
    </html>
  );
}
