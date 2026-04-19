import nodemailer from "nodemailer";

function escapeHtml(value) {
  return String(value)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/\"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function buildOtpEmailHtml({ title, greetingName, description, otp, expiresInMinutes }) {
  const safeName = escapeHtml(greetingName || "there");
  const safeDescription = escapeHtml(description);
  const safeOtp = escapeHtml(otp);
  const safeExpiry = escapeHtml(String(expiresInMinutes));
  return `
  <div style="margin:0;padding:24px;background:#0b0b0b;font-family:Segoe UI,Arial,sans-serif;color:#f1f1f1;">
    <div style="max-width:560px;margin:0 auto;background:#151515;border:1px solid #2a2a2a;border-radius:14px;padding:28px;">
      <h1 style="margin:0 0 10px;font-size:22px;line-height:1.3;color:#45ffca;">${escapeHtml(title)}</h1>
      <p style="margin:0 0 12px;font-size:15px;color:#e6e6e6;">Hi ${safeName},</p>
      <p style="margin:0 0 18px;font-size:14px;line-height:1.6;color:#cfcfcf;">${safeDescription}</p>
      <div style="margin:0 0 18px;padding:14px 16px;border-radius:10px;border:1px dashed #45ffca;background:#0f0f0f;text-align:center;">
        <span style="display:block;font-size:12px;letter-spacing:0.08em;color:#9ca3af;text-transform:uppercase;">One-Time Password</span>
        <span style="display:block;margin-top:6px;font-size:30px;font-weight:700;letter-spacing:0.2em;color:#ffffff;">${safeOtp}</span>
      </div>
      <p style="margin:0 0 10px;font-size:13px;color:#cfcfcf;">This code expires in ${safeExpiry} minute(s).</p>
      <p style="margin:0;font-size:12px;color:#8b8b8b;">If you did not request this, you can safely ignore this message.</p>
    </div>
  </div>`;
}

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
  const from = process.env.EMAIL_FROM || process.env.SMTP_USER || "Gym App <noreply@localhost>";
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

export async function sendSignupOtpEmail({ to, name, otp, expiresInMinutes }) {
  const subject = "Verify your account - OTP code";
  const text = `Hi ${name},\n\nYour signup OTP is ${otp}. It expires in ${expiresInMinutes} minute(s).\n\nIf you did not request this, you can ignore this email.\n\n— Gym Management`;
  const html = buildOtpEmailHtml({
    title: "Verify your account",
    greetingName: name,
    description: "Use the OTP below to complete your signup.",
    otp,
    expiresInMinutes,
  });
  return sendMail({ to, subject, text, html });
}

export async function sendPasswordResetOtpEmail({ to, name, otp, expiresInMinutes }) {
  const subject = "Reset your password - OTP code";
  const text = `Hi ${name},\n\nYour password reset OTP is ${otp}. It expires in ${expiresInMinutes} minute(s).\n\nIf you did not request this, please secure your account.\n\n— Gym Management`;
  const html = buildOtpEmailHtml({
    title: "Reset your password",
    greetingName: name,
    description: "Use the OTP below to reset your password.",
    otp,
    expiresInMinutes,
  });
  return sendMail({ to, subject, text, html });
}

function buildSubscriptionReceiptEmailHtml({
  memberName,
  planName,
  amount,
  currency,
  startDate,
  endDate,
  providerPaymentId,
  providerOrderId,
}) {
  const safeName = escapeHtml(memberName || "there");
  const safePlan = escapeHtml(planName || "Membership plan");
  const safeAmount = escapeHtml(String(amount));
  const safeCurrency = escapeHtml(String(currency || "INR"));
  const safeStart = escapeHtml(new Date(startDate).toDateString());
  const safeEnd = escapeHtml(new Date(endDate).toDateString());
  const safePaymentId = escapeHtml(providerPaymentId || "-");
  const safeOrderId = escapeHtml(providerOrderId || "-");

  return `
  <div style="margin:0;padding:24px;background:#0b0b0b;font-family:Segoe UI,Arial,sans-serif;color:#f1f1f1;">
    <div style="max-width:560px;margin:0 auto;background:#151515;border:1px solid #2a2a2a;border-radius:14px;padding:28px;">
      <h1 style="margin:0 0 10px;font-size:22px;line-height:1.3;color:#45ffca;">Subscription Receipt</h1>
      <p style="margin:0 0 16px;font-size:15px;color:#e6e6e6;">Hi ${safeName},</p>
      <p style="margin:0 0 16px;font-size:14px;line-height:1.6;color:#cfcfcf;">Your subscription payment was successful. Here is your receipt summary.</p>

      <div style="margin:0 0 16px;padding:14px 16px;border-radius:10px;border:1px solid #2f2f2f;background:#101010;">
        <p style="margin:0 0 8px;font-size:14px;color:#f1f1f1;"><strong>Plan:</strong> ${safePlan}</p>
        <p style="margin:0 0 8px;font-size:14px;color:#f1f1f1;"><strong>Amount:</strong> ${safeCurrency} ${safeAmount}</p>
        <p style="margin:0 0 8px;font-size:14px;color:#f1f1f1;"><strong>Start Date:</strong> ${safeStart}</p>
        <p style="margin:0 0 8px;font-size:14px;color:#f1f1f1;"><strong>End Date:</strong> ${safeEnd}</p>
        <p style="margin:0 0 8px;font-size:13px;color:#cfcfcf;"><strong>Payment ID:</strong> ${safePaymentId}</p>
        <p style="margin:0;font-size:13px;color:#cfcfcf;"><strong>Order ID:</strong> ${safeOrderId}</p>
      </div>

      <p style="margin:0;font-size:12px;color:#8b8b8b;">Thank you for training with Iron Fitness.</p>
    </div>
  </div>`;
}

export async function sendSubscriptionReceiptEmail({
  to,
  name,
  planName,
  amount,
  currency,
  startDate,
  endDate,
  providerPaymentId,
  providerOrderId,
}) {
  const subject = `Subscription receipt - ${planName || "Membership"}`;
  const text = `Hi ${name},\n\nYour subscription payment was successful.\n\nPlan: ${planName}\nAmount: ${currency || "INR"} ${amount}\nStart Date: ${new Date(startDate).toDateString()}\nEnd Date: ${new Date(endDate).toDateString()}\nPayment ID: ${providerPaymentId || "-"}\nOrder ID: ${providerOrderId || "-"}\n\nThank you for training with Iron Fitness.`;
  const html = buildSubscriptionReceiptEmailHtml({
    memberName: name,
    planName,
    amount,
    currency,
    startDate,
    endDate,
    providerPaymentId,
    providerOrderId,
  });
  return sendMail({ to, subject, text, html });
}
