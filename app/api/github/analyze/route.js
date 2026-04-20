import { NextResponse } from "next/server";
import { Octokit } from "octokit";
import { GoogleGenerativeAI, SchemaType } from "@google/generative-ai";
import { createClient } from "@/lib/supabase/server";

const planSchema = {
  type: SchemaType.OBJECT,
  properties: {
    project_summary: { type: SchemaType.STRING },
    suggested_roles: {
      type: SchemaType.ARRAY,
      items: {
        type: SchemaType.OBJECT,
        properties: {
          title: { type: SchemaType.STRING },
          focus_areas: { type: SchemaType.STRING },
        },
        required: ["title", "focus_areas"],
      },
    },
    weeks: {
      type: SchemaType.ARRAY,
      items: {
        type: SchemaType.OBJECT,
        properties: {
          week_number: { type: SchemaType.NUMBER },
          title: { type: SchemaType.STRING },
          theme: { type: SchemaType.STRING },
          tasks: {
            type: SchemaType.ARRAY,
            items: {
              type: SchemaType.OBJECT,
              properties: {
                title: { type: SchemaType.STRING },
                description: { type: SchemaType.STRING },
                assigned_role: { type: SchemaType.STRING },
                is_deliverable: { type: SchemaType.BOOLEAN },
                deliverable_text: { type: SchemaType.STRING },
              },
              required: ["title", "description", "assigned_role", "is_deliverable"],
            },
          },
        },
        required: ["week_number", "title", "theme", "tasks"],
      },
    },
  },
  required: ["project_summary", "suggested_roles", "weeks"],
};

export async function POST(request) {
  try {
    const supabase = await createClient();

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { data: profile } = await supabase
      .from("profiles")
      .select("role, github_token")
      .eq("id", user.id)
      .single();

    if (profile?.role !== "admin") {
      return NextResponse.json({ error: "Admin only" }, { status: 403 });
    }

    if (!profile.github_token) {
      return NextResponse.json({ error: "GitHub token not configured" }, { status: 400 });
    }

    const geminiKey = process.env.GEMINI_API_KEY;
    if (!geminiKey || geminiKey === "your_gemini_api_key") {
      return NextResponse.json({ error: "GEMINI_API_KEY not configured" }, { status: 500 });
    }

    const { repoFullName, weekCount, roles } = await request.json();
    if (!repoFullName) {
      return NextResponse.json({ error: "Repository name required" }, { status: 400 });
    }

    const [owner, repo] = repoFullName.split("/");
    const octokit = new Octokit({ auth: profile.github_token });

    // Fetch repo data in parallel
    const [repoData, treeData, readmeData, issuesData, contributorsData, pkgData] = await Promise.allSettled([
      octokit.rest.repos.get({ owner, repo }),
      octokit.rest.git.getTree({ owner, repo, tree_sha: "HEAD", recursive: "1" }),
      octokit.rest.repos.getReadme({ owner, repo, mediaType: { format: "raw" } }).catch(() => null),
      octokit.rest.issues.listForRepo({ owner, repo, state: "open", per_page: 20 }),
      octokit.rest.repos.listContributors({ owner, repo, per_page: 10 }),
      octokit.rest.repos.getContent({ owner, repo, path: "package.json" }).catch(() => null),
    ]);

    // Extract useful data
    const repoInfo = repoData.status === "fulfilled" ? repoData.value.data : {};
    const fileTree = treeData.status === "fulfilled"
      ? treeData.value.data.tree
          .filter((f) => f.type === "blob")
          .map((f) => f.path)
          .slice(0, 200)
      : [];
    const readme = readmeData.status === "fulfilled" && readmeData.value
      ? (typeof readmeData.value.data === "string" ? readmeData.value.data : "").slice(0, 3000)
      : "";
    const issues = issuesData.status === "fulfilled"
      ? issuesData.value.data.map((i) => ({ title: i.title, labels: i.labels.map((l) => l.name), number: i.number }))
      : [];
    const contributors = contributorsData.status === "fulfilled"
      ? contributorsData.value.data.map((c) => ({ login: c.login, contributions: c.contributions }))
      : [];

    let packageJson = "";
    if (pkgData.status === "fulfilled" && pkgData.value?.data?.content) {
      try {
        const decoded = Buffer.from(pkgData.value.data.content, "base64").toString();
        const pkg = JSON.parse(decoded);
        packageJson = JSON.stringify({
          name: pkg.name,
          dependencies: Object.keys(pkg.dependencies || {}),
          devDependencies: Object.keys(pkg.devDependencies || {}),
          scripts: Object.keys(pkg.scripts || {}),
        });
      } catch {}
    }

    const numWeeks = weekCount || 6;
    const roleList = roles?.length
      ? roles.map((r) => `- ${r.title}`).join("\n")
      : "Analyze the repository and suggest appropriate team roles.";

    // Build AI prompt
    const prompt = `You are a senior technical project manager. Analyze this GitHub repository and generate a ${numWeeks}-week development plan.

REPOSITORY: ${repoFullName}
DESCRIPTION: ${repoInfo.description || "No description"}
LANGUAGE: ${repoInfo.language || "Unknown"}
TOPICS: ${(repoInfo.topics || []).join(", ") || "None"}

README (excerpt):
${readme || "No README available"}

PACKAGE.JSON:
${packageJson || "Not available"}

FILE STRUCTURE (top ${fileTree.length} files):
${fileTree.join("\n")}

OPEN ISSUES (${issues.length}):
${issues.map((i) => `- #${i.number}: ${i.title} [${i.labels.join(", ")}]`).join("\n") || "None"}

CONTRIBUTORS:
${contributors.map((c) => `- ${c.login} (${c.contributions} commits)`).join("\n") || "None"}

${roles?.length ? `TEAM ROLES:\n${roleList}` : "SUGGEST 2-4 appropriate team roles based on the repository structure and tech stack."}

RULES:
1. Generate exactly ${numWeeks} weeks of work.
2. Each week should have 2-4 tasks per role.
3. Provide a project_summary describing what the project is about based on the repo analysis.
4. If roles were provided, use them exactly. If not, suggest roles in suggested_roles.
5. Tasks should be specific to THIS codebase — reference actual files, components, and features.
6. Incorporate open issues as tasks where appropriate.
7. Progress logically: setup/analysis first, then features, then testing/polish.
8. Mark key deliverables with is_deliverable=true and clear deliverable_text.
9. The assigned_role must match one of the role titles exactly.`;

    const genAI = new GoogleGenerativeAI(geminiKey);
    const model = genAI.getGenerativeModel({
      model: "gemini-2.0-flash",
      generationConfig: {
        responseMimeType: "application/json",
        responseSchema: planSchema,
      },
    });

    const result = await model.generateContent(prompt);
    const plan = JSON.parse(result.response.text());

    // Create the project
    const { data: project, error: projError } = await supabase
      .from("projects")
      .insert({
        name: repo,
        description: plan.project_summary || repoInfo.description || "",
        kickoff_date: new Date().toISOString().split("T")[0],
        target_date: (() => {
          const d = new Date();
          d.setDate(d.getDate() + numWeeks * 7);
          return d.toISOString().split("T")[0];
        })(),
        created_by: user.id,
      })
      .select()
      .single();

    if (projError) throw projError;

    // Add creator as member
    const creatorRole = plan.suggested_roles?.[0]?.title || roles?.[0]?.title || "Lead";
    await supabase.from("project_members").insert({
      project_id: project.id,
      user_id: user.id,
      role_title: creatorRole,
      display_order: 0,
    });

    // Insert weeks and tasks
    for (const week of plan.weeks) {
      const { data: weekRow, error: weekError } = await supabase
        .from("weeks")
        .insert({
          project_id: project.id,
          week_number: week.week_number,
          title: week.title,
          date_range: "",
          theme: week.theme || "",
        })
        .select()
        .single();

      if (weekError) continue;

      let taskOrder = 0;
      for (const task of week.tasks) {
        await supabase.from("tasks").insert({
          week_id: weekRow.id,
          assigned_to: user.id,
          title: task.title,
          description: task.description || "",
          status: "todo",
          is_deliverable: task.is_deliverable || false,
          deliverable_text: task.deliverable_text || "",
          display_order: taskOrder++,
        });
      }
    }

    return NextResponse.json({
      success: true,
      projectId: project.id,
      summary: plan.project_summary,
      suggestedRoles: plan.suggested_roles,
      weeksCreated: plan.weeks.length,
      tasksCreated: plan.weeks.reduce((sum, w) => sum + w.tasks.length, 0),
    });
  } catch (err) {
    console.error("GitHub analyze error:", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
