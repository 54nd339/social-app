export async function sendWelcomeEmail(input: {
  email: string;
  username: string;
  displayName: string | null;
}) {
  const { resend } = await import('@/lib/resend');
  const name = input.displayName || input.username;
  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? 'https://haven.app';

  await resend.emails.send({
    from: 'Haven <welcome@haven.app>',
    to: input.email,
    subject: `Welcome to Haven, ${name}!`,
    html: `
      <!DOCTYPE html>
      <html lang="en">
      <head>
        <meta charset="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
      </head>
      <body style="margin:0;padding:0;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;background-color:#f9fafb;">
        <table width="100%" cellpadding="0" cellspacing="0" style="padding:40px 20px;">
          <tr>
            <td align="center">
              <table width="560" cellpadding="0" cellspacing="0" style="background:#ffffff;border-radius:12px;overflow:hidden;box-shadow:0 1px 3px rgba(0,0,0,0.1);">
                <tr>
                  <td style="background:linear-gradient(135deg,#6366f1,#8b5cf6);padding:32px;text-align:center;">
                    <h1 style="margin:0;color:#ffffff;font-size:28px;font-weight:700;">Haven</h1>
                    <p style="margin:8px 0 0;color:rgba(255,255,255,0.85);font-size:14px;">The Anti-Algorithm Social Platform</p>
                  </td>
                </tr>
                <tr>
                  <td style="padding:32px;">
                    <h2 style="margin:0 0 16px;font-size:20px;color:#111827;">Welcome, ${name}!</h2>
                    <p style="margin:0 0 16px;font-size:15px;line-height:1.6;color:#4b5563;">
                      You've joined a community that puts people first. No algorithms deciding what you see,
                      no engagement bait, no data harvesting &mdash; just genuine connections.
                    </p>
                    <p style="margin:0 0 24px;font-size:15px;line-height:1.6;color:#4b5563;">
                      Here's what you can do next:
                    </p>
                    <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:24px;">
                      <tr>
                        <td style="padding:12px 0;border-bottom:1px solid #f3f4f6;">
                          <strong style="color:#111827;">Complete your profile</strong>
                          <br/><span style="font-size:13px;color:#6b7280;">Add a bio, avatar, and let people know who you are.</span>
                        </td>
                      </tr>
                      <tr>
                        <td style="padding:12px 0;border-bottom:1px solid #f3f4f6;">
                          <strong style="color:#111827;">Find your people</strong>
                          <br/><span style="font-size:13px;color:#6b7280;">Explore and follow others who share your interests.</span>
                        </td>
                      </tr>
                      <tr>
                        <td style="padding:12px 0;">
                          <strong style="color:#111827;">Share your first post</strong>
                          <br/><span style="font-size:13px;color:#6b7280;">Say hello to the community. We're listening.</span>
                        </td>
                      </tr>
                    </table>
                    <table width="100%" cellpadding="0" cellspacing="0">
                      <tr>
                        <td align="center">
                          <a href="${appUrl}"
                            style="display:inline-block;padding:12px 32px;background:#6366f1;color:#ffffff;text-decoration:none;border-radius:8px;font-size:15px;font-weight:600;">
                            Get Started
                          </a>
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>
                <tr>
                  <td style="padding:20px 32px;background:#f9fafb;text-align:center;">
                    <p style="margin:0;font-size:12px;color:#9ca3af;">
                      You're receiving this because you signed up for Haven as @${input.username}.
                    </p>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
        </table>
      </body>
      </html>
    `,
  });
}
