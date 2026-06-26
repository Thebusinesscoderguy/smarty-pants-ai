// Inline HTML builder for the teacher/parent invite email.
//
// We use an inline HTML string (matching send-invitation-email) rather than the
// react-email templates in ./email-templates, because the Resend-based provisioning
// functions send raw HTML via fetch() and don't run the react-email renderer.
//
// IMPORTANT: callers MUST pass already-sanitized values for safeName / safeSchoolName
// (see sanitizeHtml in ./adminAuth.ts). acceptLink is built from a server-generated
// token and url-encoded, so it is safe.

interface InviteEmailParams {
  safeName: string;
  safeSchoolName: string;
  role: "teacher" | "parent";
  acceptLink: string;
}

export function buildInviteEmailHtml({ safeName, safeSchoolName, role, acceptLink }: InviteEmailParams): string {
  const roleWord = role === "teacher" ? "teacher" : "parent";
  return `
    <!DOCTYPE html>
    <html>
    <head><meta charset="utf-8"></head>
    <body style="font-family: Arial, sans-serif; background: #ffffff; padding: 40px 20px;">
      <div style="max-width: 480px; margin: 0 auto; background: #fff8f0; border-radius: 12px; padding: 32px; border: 1px solid #fed7aa;">
        <h1 style="color: #1a1a1a; font-size: 24px; margin-bottom: 16px;">You're invited to Teachly! 🎓</h1>
        <p style="color: #444; font-size: 16px; line-height: 1.6;">
          Hi ${safeName || "there"},
        </p>
        <p style="color: #444; font-size: 16px; line-height: 1.6;">
          <strong>${safeSchoolName}</strong> has invited you to join Teachly as a <strong>${roleWord}</strong>.
        </p>
        <p style="color: #444; font-size: 16px; line-height: 1.6;">
          Click the button below to set your password and access your account:
        </p>
        <div style="text-align: center; margin: 28px 0;">
          <a href="${acceptLink}" style="background: #f97316; color: white; padding: 14px 32px; border-radius: 8px; text-decoration: none; font-weight: bold; font-size: 16px; display: inline-block;">
            Set Your Password
          </a>
        </div>
        <p style="color: #888; font-size: 13px; margin-top: 24px;">
          If the button doesn't work, copy and paste this link into your browser:<br>
          <a href="${acceptLink}" style="color: #f97316;">${acceptLink}</a>
        </p>
        <p style="color: #888; font-size: 13px;">
          This link expires in 72 hours and can be used once. If you weren't expecting this invitation, you can safely ignore this email.
        </p>
        <hr style="border: none; border-top: 1px solid #fed7aa; margin: 24px 0;">
        <p style="color: #aaa; font-size: 12px;">The Teachly Team</p>
      </div>
    </body>
    </html>
  `;
}

export const INVITE_EMAIL_FROM = "Teachly <noreply@teachlyai.com>";
