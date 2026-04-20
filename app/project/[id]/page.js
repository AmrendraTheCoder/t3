import { createClient } from "@/lib/supabase/server";
import { notFound } from "next/navigation";
import ProjectClient from "./ProjectClient";

export const dynamic = "force-dynamic";

export default async function ProjectPage({ params }) {
  const { id } = await params;
  const supabase = await createClient();

  const { data: { user } } = await supabase.auth.getUser();

  const { data: profile } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", user.id)
    .single();

  // Fetch project
  const { data: project } = await supabase
    .from("projects")
    .select("*")
    .eq("id", id)
    .single();

  if (!project) notFound();

  // Fetch members with profiles
  const { data: members } = await supabase
    .from("project_members")
    .select("*, profiles(*)")
    .eq("project_id", id)
    .order("display_order");

  // Fetch weeks
  const { data: weeks } = await supabase
    .from("weeks")
    .select("*")
    .eq("project_id", id)
    .order("week_number");

  // Fetch all tasks for this project's weeks
  const weekIds = (weeks || []).map((w) => w.id);
  let tasks = [];
  if (weekIds.length > 0) {
    const { data } = await supabase
      .from("tasks")
      .select("*")
      .in("week_id", weekIds)
      .order("display_order");
    tasks = data || [];
  }

  return (
    <ProjectClient
      user={user}
      profile={profile}
      project={project}
      initialMembers={members || []}
      initialWeeks={weeks || []}
      initialTasks={tasks}
    />
  );
}
