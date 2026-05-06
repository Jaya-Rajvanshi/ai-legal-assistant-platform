import twilio from "twilio";

const ACCOUNT_SID = process.env.TWILIO_ACCOUNT_SID;
const AUTH_TOKEN = process.env.TWILIO_AUTH_TOKEN;
const FROM_NUMBER =
  process.env.TWILIO_PHONE_NUMBER || process.env.TWILIO_FROM_NUMBER;

let client = null;

if (!ACCOUNT_SID || !AUTH_TOKEN || !FROM_NUMBER) {
  console.warn(
    "Twilio env vars not fully set. SMS features will not work until configured."
  );
} else {
  client = twilio(ACCOUNT_SID, AUTH_TOKEN);
}

export const isTwilioConfigured = () => Boolean(client && FROM_NUMBER);

export const sendSmsToMany = async ({ recipients, message }) => {
  if (!isTwilioConfigured()) {
    const err = new Error("Twilio is not configured");
    err.code = "TWILIO_NOT_CONFIGURED";
    throw err;
  }

  const normalized = Array.isArray(recipients) ? recipients : [recipients];

  const results = [];
  for (const to of normalized) {
    if (!to) continue;
    try {
      const res = await client.messages.create({
        from: FROM_NUMBER,
        to,
        body: message,
      });
      results.push({ to, status: "sent", sid: res.sid });
    } catch (error) {
      results.push({
        to,
        status: "failed",
        error: error.message || "SMS send failed",
      });
    }
  }

  return results;
};

export const sendMissingPersonAlertSMS = async (toNumbers, message) => {
  const normalized = Array.isArray(toNumbers) ? toNumbers : [toNumbers];
  const results = await sendSmsToMany({ recipients: normalized, message });
  return results
    .filter((r) => r.status === "sent")
    .map((r) => ({ to: r.to, sid: r.sid }));
};