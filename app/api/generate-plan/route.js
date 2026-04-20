import { NextResponse } from "next/server";
import { GoogleGenerativeAI, SchemaType } from "@google/generative-ai";
import { createClient } from "@/lib/supabase/server";

const planSchema = {
  type: SchemaType.OBJECT,
  properties: {
    weeks: {
      type: SchemaType.ARRAY,
      items: {
        type: SchemaType.OBJECT,
        properties: {
          week_number: { type: SchemaType.NUMBER },
          title: { type: SchemaType.STRING },
          date_range: { type: SchemaType.STRING },
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
  required: ["weeks"],
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
      .select("role")
      .eq("id", user.id)
      .single();

    if (profile?.role !== "admin") {
      return NextResponse.json({ error: "Admin only" }, { status: 403 });
    }

    const { name, description, roles, weekCount, goals, kickoffDate } = await request.json();

    if (!name || !description || !roles?.length || !weekCount) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey || apiKey === "your_gemini_api_key") {
      return NextResponse.json({ error: "GEMINI_API_KEY not configured" }, { status: 500 });
    }

    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({
      model: "gemini-2.0-flash",
      generationConfig: {
        responseMimeType: "application/json",
        responseSchema: planSchema,
      },
    });

    const roleList = roles.map((r) => `- ${r.title} (${r.name || "TBD"})`).join("\n");

    const startDate = kickoffDate
      ? new Date(kickoffDate)
      : new Date();

    const dateRanges = [];
    for (let i = 0; i < weekCount; i++) {
      const weekStart = new Date(startDate);
      weekStart.setDate(weekStart.getDate() + i * 7);
      const weekEnd = new Date(weekStart);
      weekEnd.setDate(weekEnd.getDate() + 6);
      const fmt = (d) => d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
      dateRanges.push(`Week ${i + 1}: ${fmt(weekStart)} - ${fmt(weekEnd)}`);
    }

    const prompt = `You are a senior technical project manager. Generate a detailed, realistic ${weekCount}-week project plan.

PROJECT: ${name}
DESCRIPTION: ${description}
${goals ? `GOALS: ${goals}` : ""}

TEAM ROLES:
${roleList}

DATE RANGES:
${dateRanges.join("\n")}

RULES:
1. Generate exactly ${weekCount} weeks.
2. Each week must have 2-4 tasks PER ROLE. Every role should have tasks every week.
3. The "assigned_role" must exactly match one of the role titles listed above.
4. Tasks should progress logically: foundation first, then core features, then polish/testing.
5. Mark ~1 key task per person per week as a deliverable (is_deliverable=true) with a clear deliverable_text describing the expected output.
6. Week titles should be concise (e.g., "Foundation & Setup", "Core Features", "Integration & Testing").
7. Theme should be a brief phrase describing the week's focus.
8. Task descriptions should be specific and actionable, not generic.
9. Use the provided date ranges for each week.
10. Ensure the plan is realistic for the team size and timeline.`;

    const result = await model.generateContent(prompt);
    const plan = JSON.parse(result.response.text());

    // Create the project
    const { data: project, error: projError } = await supabase
      .from("projects")
      .insert({
        name,
        description,
        kickoff_date: kickoffDate || null,
        target_date: (() => {
          const d = new Date(startDate);
          d.setDate(d.getDate() + weekCount * 7);
          return d.toISOString().split("T")[0];
        })(),
        created_by: user.id,
      })
      .select()
      .single();

    if (projError) throw projError;

    // Add creator as project member
    await supabase.from("project_members").insert({
      project_id: project.id,
      user_id: user.id,
      role_title: roles[0]?.title || "Admin",
      display_order: 0,
    });

    // Fetch all profiles to match role names to users
    const { data: allProfiles } = await supabase.from("profiles").select("id, full_name, email");

    // Create a role→userId map based on name matching
    const roleUserMap = {};
    for (const role of roles) {
      if (role.name) {
        const match = allProfiles?.find(
          (p) =>
            p.full_name?.toLowerCase().includes(role.name.toLowerCase()) ||
            p.email?.toLowerCase().includes(role.name.toLowerCase())
        );
        if (match) {
          roleUserMap[role.title] = match.id;

          // Add as project member if not already creator
          if (match.id !== user.id) {
            await supabase.from("project_members").insert({
              project_id: project.id,
              user_id: match.id,
              role_title: role.title,
              display_order: roles.indexOf(role),
            }).select();
          }
        }
      }
    }

    // Insert weeks and tasks
    for (const week of plan.weeks) {
      const { data: weekRow, error: weekError } = await supabase
        .from("weeks")
        .insert({
          project_id: project.id,
          week_number: week.week_number,
          title: week.title,
          date_range: week.date_range || "",
          theme: week.theme || "",
        })
        .select()
        .single();

      if (weekError) {
        console.error("Week insert error:", weekError);
        continue;
      }

      let taskOrder = 0;
      for (const task of week.tasks) {
        const assignedUserId = roleUserMap[task.assigned_role] || user.id;

        await supabase.from("tasks").insert({
          week_id: weekRow.id,
          assigned_to: assignedUserId,
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
      weeksCreated: plan.weeks.length,
      tasksCreated: plan.weeks.reduce((sum, w) => sum + w.tasks.length, 0),
    });
  } catch (err) {
    console.error("Plan generation error:", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
