import { NextResponse } from "next/server";
import { Resend } from "resend";
import { createClient } from "@/lib/supabase/server";

export async function POST(request) {
  try {
    const supabase = await createClient();

    // Verify user is admin
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

    const { to, subject, message, projectName } = await request.json();

    if (!to || !subject || !message) {
      return NextResponse.json({ error: "Missing fields" }, { status: 400 });
    }

    const apiKey = process.env.RESEND_API_KEY;
    if (!apiKey || apiKey === "your_resend_api_key") {
      // Log instead of sending if no API key
      console.log("📧 Email would be sent (no RESEND_API_KEY configured):");
      console.log({ to, subject, message });

      // Still log it to the database
      const recipients = Array.isArray(to) ? to : [to];
      for (const email of recipients) {
        await supabase.from("email_log").insert({
          sent_by: user.id,
          sent_to: email,
          subject,
        });
      }

      return NextResponse.json({ success: true, mode: "dry_run" });
    }

    const resend = new Resend(apiKey);
    const recipients = Array.isArray(to) ? to : [to];

    // Send email to each recipient
    for (const email of recipients) {
      await resend.emails.send({
        from: "T3 <onboarding@resend.dev>",
        to: email,
        subject,
        html: `
          <div style="font-family: 'Inter', -apple-system, system-ui, sans-serif; max-width: 600px; margin: 0 auto; background: #0a0a0a; padding: 32px; border-radius: 12px;">
            <div style="text-align: center; margin-bottom: 24px;">
              <h1 style="color: #f0f0f0; font-size: 20px; margin: 0;">T3</h1>
              ${projectName ? `<p style="color: #999; font-size: 13px; margin-top: 4px;">${projectName}</p>` : ""}
            </div>
            <div style="background: #161616; border: 1px solid #232323; border-radius: 10px; padding: 24px; color: #f0f0f0; font-size: 14px; line-height: 1.6;">
              ${message.replace(/\n/g, "<br>")}
            </div>
            <p style="color: #5a5a5a; font-size: 11px; text-align: center; margin-top: 24px;">
              Sent via T3
            </p>
          </div>
        `,
      });

      // Log to database
      await supabase.from("email_log").insert({
        sent_by: user.id,
        sent_to: email,
        subject,
      });
    }

    return NextResponse.json({ success: true, sent: recipients.length });
  } catch (err) {
    console.error("Email send error:", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
