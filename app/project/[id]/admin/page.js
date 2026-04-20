import { createClient } from "@/lib/supabase/server";
import { notFound, redirect } from "next/navigation";
import AdminClient from "./AdminClient";

export const dynamic = "force-dynamic";

export default async function AdminPage({ params }) {
  const { id } = await params;
  const supabase = await createClient();

  const { data: { user } } = await supabase.auth.getUser();

  const { data: profile } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", user.id)
    .single();

  if (profile?.role !== "admin") redirect(`/project/${id}`);

  const { data: project } = await supabase
    .from("projects")
    .select("*")
    .eq("id", id)
    .single();

  if (!project) notFound();

  const { data: members } = await supabase
    .from("project_members")
    .select("*, profiles(*)")
    .eq("project_id", id)
    .order("display_order");

  const { data: weeks } = await supabase
    .from("weeks")
    .select("*")
    .eq("project_id", id)
    .order("week_number");

  const weekIds = (weeks || []).map((w) => w.id);
  let tasks = [];
  if (weekIds.length > 0) {
    const { data } = await supabase
      .from("tasks")
      .select("*")
      .in("week_id", weekIds);
    tasks = data || [];
  }

  const { data: emailLogs } = await supabase
    .from("email_log")
    .select("*")
    .eq("project_id", id)
    .order("sent_at", { ascending: false })
    .limit(10);

  return (
    <AdminClient
      user={user}
      profile={profile}
      project={project}
      members={members || []}
      weeks={weeks || []}
      tasks={tasks}
      emailLogs={emailLogs || []}
    />
  );
}
