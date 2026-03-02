import nodemailer from "nodemailer"

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: Number(process.env.SMTP_PORT) || 587,
  secure: process.env.SMTP_SECURE === "true",
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASSWORD,
  },
})

const FROM = process.env.EMAIL_FROM || "noreply@liquorbilling.com"
const APP_NAME = "LiquorPOS"

/* ─── shared styles ─── */
const wrapper = (body: string) => `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8" /><meta name="viewport" content="width=device-width,initial-scale=1" /></head>
<body style="margin:0;padding:0;background:#f1f5f9;font-family:'Segoe UI',Arial,sans-serif;">
  <div style="max-width:560px;margin:40px auto;background:#fff;border-radius:16px;overflow:hidden;box-shadow:0 4px 24px rgba(0,0,0,0.06);">
    <!-- header -->
    <div style="background:linear-gradient(135deg,#2563EB,#0EA5E9);padding:32px 40px;">
      <h1 style="margin:0;color:#fff;font-size:22px;font-weight:700;letter-spacing:0.5px;">${APP_NAME}</h1>
    </div>
    <!-- body -->
    <div style="padding:36px 40px 40px;">
      ${body}
    </div>
    <!-- footer -->
    <div style="padding:20px 40px;background:#f8fafc;border-top:1px solid #e2e8f0;text-align:center;">
      <p style="margin:0;color:#94a3b8;font-size:12px;">© ${new Date().getFullYear()} ${APP_NAME}. All rights reserved.</p>
    </div>
  </div>
</body>
</html>`

/* ─── Registration Request Submitted ─── */
export async function sendRegistrationEmail(to: string, companyName: string, slug: string) {
  const html = wrapper(`
    <h2 style="margin:0 0 8px;color:#0f172a;font-size:20px;">Registration Received!</h2>
    <p style="margin:0 0 20px;color:#64748b;font-size:14px;line-height:1.6;">
      Hi there,<br/>Thank you for registering <strong style="color:#0f172a;">${companyName}</strong> on ${APP_NAME}.
    </p>
    <div style="background:#f0f9ff;border:1px solid #bae6fd;border-radius:12px;padding:20px;margin-bottom:24px;">
      <table style="width:100%;font-size:14px;color:#334155;">
        <tr><td style="padding:4px 0;font-weight:600;width:120px;">Company</td><td style="padding:4px 0;">${companyName}</td></tr>
        <tr><td style="padding:4px 0;font-weight:600;">Workspace URL</td><td style="padding:4px 0;"><code style="background:#e0f2fe;padding:2px 8px;border-radius:4px;font-size:13px;">${slug}</code></td></tr>
        <tr><td style="padding:4px 0;font-weight:600;">Email</td><td style="padding:4px 0;">${to}</td></tr>
      </table>
    </div>
    <p style="margin:0 0 8px;color:#64748b;font-size:14px;line-height:1.6;">
      Your request is now being reviewed by our admin team. You will receive another email once your workspace is approved.
    </p>
    <div style="background:#fffbeb;border:1px solid #fde68a;border-radius:10px;padding:14px 18px;margin-top:16px;">
      <p style="margin:0;color:#92400e;font-size:13px;">⏳ <strong>Status:</strong> Pending Review — typically within 24 hours.</p>
    </div>
  `)

  await transporter.sendMail({
    from: `"${APP_NAME}" <${FROM}>`,
    to,
    subject: `Registration Received — ${companyName}`,
    html,
  })
}

/* ─── Request Approved ─── */
export async function sendApprovalEmail(to: string, companyName: string, slug: string, loginUrl: string) {
  const html = wrapper(`
    <h2 style="margin:0 0 8px;color:#0f172a;font-size:20px;">Your Workspace is Ready! 🎉</h2>
    <p style="margin:0 0 20px;color:#64748b;font-size:14px;line-height:1.6;">
      Great news! Your workspace <strong style="color:#0f172a;">${companyName}</strong> has been approved and is now live.
    </p>
    <div style="background:#f0fdf4;border:1px solid #bbf7d0;border-radius:12px;padding:20px;margin-bottom:24px;">
      <table style="width:100%;font-size:14px;color:#334155;">
        <tr><td style="padding:4px 0;font-weight:600;width:120px;">Company</td><td style="padding:4px 0;">${companyName}</td></tr>
        <tr><td style="padding:4px 0;font-weight:600;">Workspace URL</td><td style="padding:4px 0;"><code style="background:#dcfce7;padding:2px 8px;border-radius:4px;font-size:13px;">${slug}</code></td></tr>
        <tr><td style="padding:4px 0;font-weight:600;">Login Email</td><td style="padding:4px 0;">${to}</td></tr>
      </table>
    </div>
    <div style="text-align:center;margin:28px 0 16px;">
      <a href="${loginUrl}" style="display:inline-block;background:linear-gradient(135deg,#2563EB,#0EA5E9);color:#fff;text-decoration:none;font-weight:600;font-size:14px;padding:14px 36px;border-radius:12px;box-shadow:0 4px 16px rgba(37,99,235,0.3);">
        Login to Your Workspace →
      </a>
    </div>
    <p style="margin:0;color:#64748b;font-size:13px;text-align:center;line-height:1.5;">
      Use your registered email and password to log in.<br/>You have been assigned the <strong>Owner</strong> role.
    </p>
  `)

  await transporter.sendMail({
    from: `"${APP_NAME}" <${FROM}>`,
    to,
    subject: `Workspace Approved — ${companyName} is Live!`,
    html,
  })
}

/* ─── Request Rejected ─── */
export async function sendRejectionEmail(to: string, companyName: string, reason?: string) {
  const reasonBlock = reason
    ? `<div style="background:#fef2f2;border:1px solid #fecaca;border-radius:10px;padding:14px 18px;margin:16px 0;">
        <p style="margin:0;color:#991b1b;font-size:13px;"><strong>Reason:</strong> ${reason}</p>
      </div>`
    : ""

  const html = wrapper(`
    <h2 style="margin:0 0 8px;color:#0f172a;font-size:20px;">Registration Update</h2>
    <p style="margin:0 0 20px;color:#64748b;font-size:14px;line-height:1.6;">
      We've reviewed your request for <strong style="color:#0f172a;">${companyName}</strong>.
      Unfortunately, your workspace request was not approved at this time.
    </p>
    ${reasonBlock}
    <p style="margin:16px 0 0;color:#64748b;font-size:14px;line-height:1.6;">
      If you believe this was a mistake or would like to re-apply, feel free to submit a new request or contact our support team.
    </p>
  `)

  await transporter.sendMail({
    from: `"${APP_NAME}" <${FROM}>`,
    to,
    subject: `Registration Update — ${companyName}`,
    html,
  })
}
