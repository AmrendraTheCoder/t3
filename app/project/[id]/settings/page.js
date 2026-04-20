import { createClient } from "@/lib/supabase/server";
import { notFound, redirect } from "next/navigation";
import SettingsClient from "./SettingsClient";

export const dynamic = "force-dynamic";

export default async function SettingsPage({ params }) {
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

  return (
    <SettingsClient
      user={user}
      profile={profile}
      project={project}
      initialMembers={members || []}
      initialWeeks={weeks || []}
    />
  );
}
