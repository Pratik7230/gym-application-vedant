import nodemailer from "nodemailer";

function getTransport() {
  const host = process.env.SMTP_HOST;
  const port = Number(process.env.SMTP_PORT || 587);
  const secure = process.env.SMTP_SECURE === "true";
  const user = process.env.SMTP_USER;
  const pass = process.env.SMTP_PASS;
  if (!host || !user || !pass) return null;
  return nodemailer.createTransport({
    host,
    port,
    secure,
    auth: { user, pass },
  });
}

export async function sendMail({ to, subject, text, html }) {
  const transport = getTransport();
  if (!transport) {
    console.warn("[email] SMTP not configured; skipping send to", to);
    return { skipped: true };
  }
  const from = process.env.EMAIL_FROM || "Gym App <noreply@localhost>";
  try {
    await transport.sendMail({ from, to, subject, text, html: html ?? text });
    return { sent: true };
  } catch (err) {
    console.error("[email] send failed", { to, subject, err: err?.message || err });
    throw err;
  }
}

export async function sendSubscriptionReminderEmail({ to, name, endDate, daysLeft }) {
  const subject =
    daysLeft === 0
      ? "Your gym subscription has expired"
      : `Your gym subscription expires in ${daysLeft} day(s)`;
  const text = `Hi ${name},\n\n${subject}.\nEnd date: ${new Date(endDate).toDateString()}.\n\n— Gym Management`;
  return sendMail({ to, subject, text });
}
