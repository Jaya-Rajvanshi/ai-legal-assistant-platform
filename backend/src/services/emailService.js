import nodemailer from "nodemailer";

const {
  SMTP_HOST,
  SMTP_PORT,
  SMTP_USER,
  SMTP_PASS,
  MAIL_FROM,
} = process.env;

let transporter = null;

if (SMTP_HOST && SMTP_USER && SMTP_PASS) {
  try {
    transporter = nodemailer.createTransport({
      host: SMTP_HOST,
      port: Number(SMTP_PORT) || 587,
      secure: SMTP_PORT === "465",
      auth: { user: SMTP_USER, pass: SMTP_PASS },
    });
  } catch (err) {
    console.warn("Nodemailer transport creation failed:", err.message);
  }
} else {
  console.warn(
    "SMTP env vars (SMTP_HOST, SMTP_USER, SMTP_PASS) not set. Email notifications disabled."
  );
}

/**
 * Send email. Fails gracefully if transporter not configured.
 * @returns {Promise<{ sent: boolean, error?: string }>}
 */
export const sendEmail = async ({ to, subject, text, html }) => {
  if (!transporter) {
    return { sent: false, error: "Email not configured" };
  }
  try {
    await transporter.sendMail({
      from: MAIL_FROM || SMTP_USER,
      to,
      subject,
      text: text || undefined,
      html: html || undefined,
    });
    return { sent: true };
  } catch (err) {
    console.error("sendEmail error:", err.message);
    return { sent: false, error: err.message };
  }
};

/** Send confirmation after missing person report submission. */
export const sendMissingPersonSubmissionConfirmation = async (report, reportId) => {
  const to = report.contactEmail;
  if (!to) return { sent: false, error: "No contact email" };
  const link = process.env.CLIENT_ORIGIN
    ? `${process.env.CLIENT_ORIGIN}/missing-alert/${reportId}`
    : `(portal link for report ID: ${reportId})`;
  const subject = "Missing Person Report Received";
  const text = [
    "Your missing person report has been received.",
    "",
    `Name: ${report.fullName}`,
    `Age: ${report.age}`,
    `Last seen: ${report.lastSeenLocation} on ${report.dateLastSeen}`,
    `Contact: ${report.contactName} - ${report.contactPhone}`,
    "",
    "Status: Pending admin approval. Once approved, the alert will be published and you will receive an SMS.",
    `Public link (after approval): ${link}`,
    "",
    "Thank you for using the AI Legal & Emergency Support Portal.",
  ].join("\n");
  return sendEmail({ to, subject, text, html: `<pre>${text.replace(/</g, "&lt;")}</pre>` });
};

/** Send notification after admin approves the report. */
export const sendMissingPersonApprovalNotification = async (report) => {
  const link = process.env.CLIENT_ORIGIN
    ? `${process.env.CLIENT_ORIGIN}/missing-alert/${report._id || report.id}`
    : `(portal link)`;
  const subject = "Missing Person Alert Approved";
  const text = `
Missing Person Alert Approved: ${report.fullName}

Last Seen: ${report.lastSeenLocation} on ${report.dateLastSeen}.

Your alert is now live. View and share: ${link}

You can download the poster PDF from the alert page.

Thank you.
  `.trim();

  const to = report.contactEmail;
  if (!to) return { sent: false, error: "No contact email for approval notification" };
  return sendEmail({ to, subject, text, html: `<pre>${text.replace(/</g, "&lt;")}</pre>` });
}
