import { createClient } from "@/lib/supabase/server";
import HomeClient from "./HomeClient";

export const dynamic = "force-dynamic";

export default async function HomePage() {
  const supabase = await createClient();

  const { data: { user } } = await supabase.auth.getUser();

  // Try to fetch profile — may fail if tables don't exist yet
  const { data: profile, error: profileError } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", user.id)
    .single();

  // If profiles table doesn't exist, show setup message
  if (profileError && profileError.code === "42P01") {
    return (
      <div style={{ padding: "80px 24px", textAlign: "center", fontFamily: "'Roboto', sans-serif", color: "#e3e3e3", background: "#121212", minHeight: "100vh" }}>
        <h1 style={{ fontSize: "24px", fontWeight: 400, marginBottom: "16px" }}>Database Setup Required</h1>
        <p style={{ color: "#adadad", maxWidth: "500px", margin: "0 auto 24px", lineHeight: 1.6 }}>
          The database tables haven't been created yet. Please run the SQL schema in your Supabase Dashboard.
        </p>
        <div style={{ background: "#1e1e1e", border: "1px solid #3c3c3c", borderRadius: "12px", padding: "24px", maxWidth: "600px", margin: "0 auto", textAlign: "left" }}>
          <p style={{ fontWeight: 500, marginBottom: "12px" }}>Steps:</p>
          <ol style={{ paddingLeft: "20px", color: "#adadad", lineHeight: 2 }}>
            <li>Go to <strong>supabase.com/dashboard</strong></li>
            <li>Open <strong>SQL Editor</strong></li>
            <li>Copy the entire contents of <strong>supabase-schema.sql</strong></li>
            <li>Paste and click <strong>Run</strong></li>
            <li>Come back here and <strong>refresh this page</strong></li>
          </ol>
        </div>
      </div>
    );
  }

  // If profile doesn't exist (user signed up before schema), show message
  if (!profile) {
    return (
      <div style={{ padding: "80px 24px", textAlign: "center", fontFamily: "'Roboto', sans-serif", color: "#e3e3e3", background: "#121212", minHeight: "100vh" }}>
        <h1 style={{ fontSize: "24px", fontWeight: 400, marginBottom: "16px" }}>Profile Not Found</h1>
        <p style={{ color: "#adadad", maxWidth: "500px", margin: "0 auto 24px", lineHeight: 1.6 }}>
          Your profile wasn't created. This usually means you signed up before the database schema was applied.
        </p>
        <div style={{ background: "#1e1e1e", border: "1px solid #3c3c3c", borderRadius: "12px", padding: "24px", maxWidth: "600px", margin: "0 auto", textAlign: "left" }}>
          <p style={{ fontWeight: 500, marginBottom: "12px" }}>Fix:</p>
          <ol style={{ paddingLeft: "20px", color: "#adadad", lineHeight: 2 }}>
            <li>Run <strong>supabase-schema.sql</strong> in Supabase SQL Editor (includes Step 6 which creates profiles for existing users)</li>
            <li>Or manually insert your profile in the <strong>profiles</strong> table in Table Editor</li>
            <li>Refresh this page</li>
          </ol>
        </div>
      </div>
    );
  }

  // Fetch projects with member count
  const { data: projects } = await supabase
    .from("projects")
    .select("*, project_members(user_id)")
    .order("created_at", { ascending: false });

  // Fetch all tasks for progress calculation
  const projectIds = (projects || []).map((p) => p.id);
  let allTasks = [];
  if (projectIds.length > 0) {
    const { data: tasks } = await supabase
      .from("tasks")
      .select("id, status, week_id, weeks!inner(project_id)")
      .in("weeks.project_id", projectIds);
    allTasks = tasks || [];
  }

  return (
    <HomeClient
      user={user}
      profile={profile}
      initialProjects={projects || []}
      allTasks={allTasks}
    />
  );
}
