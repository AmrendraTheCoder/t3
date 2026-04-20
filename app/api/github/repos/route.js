import { NextResponse } from "next/server";
import { Octokit } from "octokit";
import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const supabase = await createClient();

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { data: profile } = await supabase
      .from("profiles")
      .select("github_token")
      .eq("id", user.id)
      .single();

    if (!profile?.github_token) {
      return NextResponse.json({ error: "GitHub token not configured. Add it in your Profile settings." }, { status: 400 });
    }

    const octokit = new Octokit({ auth: profile.github_token });

    // Fetch user's repos (sorted by recently pushed)
    const { data: repos } = await octokit.rest.repos.listForAuthenticatedUser({
      sort: "pushed",
      per_page: 30,
      type: "owner",
    });

    const simplified = repos.map((r) => ({
      id: r.id,
      name: r.name,
      full_name: r.full_name,
      description: r.description,
      language: r.language,
      topics: r.topics,
      updated_at: r.updated_at,
      html_url: r.html_url,
      default_branch: r.default_branch,
      open_issues_count: r.open_issues_count,
      private: r.private,
    }));

    return NextResponse.json({ repos: simplified });
  } catch (err) {
    console.error("GitHub repos error:", err);
    if (err.status === 401) {
      return NextResponse.json({ error: "Invalid GitHub token. Please update it in Profile settings." }, { status: 401 });
    }
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
