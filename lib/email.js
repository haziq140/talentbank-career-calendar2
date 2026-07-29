// lib/email.js
//
// Sends registration confirmation emails via Resend (https://resend.com).
// Uses a plain fetch call to Resend's REST API — no SDK needed.
//
// Setup:
//   1. Sign up at https://resend.com (free tier is generous for this)
//   2. Get an API key from the dashboard
//   3. Add RESEND_API_KEY to your Vercel project's Environment Variables
//   4. Until you verify your own sending domain, Resend lets you send
//      from "onboarding@resend.dev" — fine for testing, swap FROM_EMAIL
//      once you've verified talentbank.io (or whichever domain) in Resend.
//
// If RESEND_API_KEY isn't set, this silently no-ops instead of throwing,
// so registrations still work even before email is configured.

const FROM_EMAIL = "Talentbank Career Fairs <onboarding@resend.dev>";

export async function sendRegistrationEmail({ toEmail, toName, event, waitlisted }) {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) {
    console.warn("RESEND_API_KEY not set — skipping confirmation email.");
    return { skipped: true };
  }

  const dateLabel =
    event.startDate === event.endDate
      ? event.startDate
      : `${event.startDate} to ${event.endDate}`;

  const subject = waitlisted
    ? `You're on the waitlist — ${event.title}`
    : `You're registered — ${event.title}`;

  const html = `
    <div style="font-family: sans-serif; max-width: 480px; margin: 0 auto;">
      <p style="font-size: 12px; letter-spacing: 0.05em; text-transform: uppercase; color: #888;">
        Talentbank · Career Fairs
      </p>
      <h1 style="font-size: 22px; margin: 4px 0 16px;">${waitlisted ? "You're on the waitlist" : "You're registered!"}</h1>
      <p>Hi ${toName || "there"},</p>
      <p>
        ${
          waitlisted
            ? `You've been added to the waitlist for <strong>${event.title}</strong>. We'll email you if a spot opens up.`
            : `Your spot for <strong>${event.title}</strong> is confirmed.`
        }
      </p>
      <table style="margin: 16px 0; font-size: 14px; color: #333;">
        <tr><td style="padding: 2px 12px 2px 0; color: #888;">Dates</td><td>${dateLabel}</td></tr>
        <tr><td style="padding: 2px 12px 2px 0; color: #888;">Location</td><td>${event.location}</td></tr>
      </table>
      <p style="color: #888; font-size: 12px;">— Talentbank Career Fair Calendar</p>
    </div>
  `;

  try {
    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: "onboarding@resend.dev",
        to: toEmail,
        subject,
        html,
      }),
    });

    if (!res.ok) {
      const errText = await res.text();
      console.error("Resend email failed:", res.status, errText);
      return { error: errText };
    }
    return await res.json();
  } catch (err) {
    console.error("Resend email request failed:", err);
    return { error: err.message };
  }
}
