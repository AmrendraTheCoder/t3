import { createClient } from "@/lib/supabase/server";
import ProfileClient from "./ProfileClient";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Profile — T3",
};

export default async function ProfilePage() {
  const supabase = await createClient();

  const { data: { user } } = await supabase.auth.getUser();

  const { data: profile } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", user.id)
    .single();

  return <ProfileClient user={user} profile={profile} />;
}
