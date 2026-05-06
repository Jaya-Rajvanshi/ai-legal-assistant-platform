const DISCLAIMER =
  "This is general information, not a substitute for a licensed lawyer or authority.";

const normalize = (text) =>
  String(text || "")
    .toLowerCase()
    .replace(/\s+/g, " ")
    .trim();

const matchesAny = (text, patterns) => patterns.some((p) => p.test(text));

export function getPredefinedAssistantReply(message) {
  const text = normalize(message);
  if (!text) return null;

  // 1) theft / stolen / chori
  if (
    matchesAny(text, [
      /\btheft\b/,
      /\bstolen\b/,
      /\bsteal\b/,
      /\brob(bery|bed)?\b/,
      /\bsnatch(ed|ing)?\b/,
      /\bchori\b/,
      /\bchor\b/,
      /\bloot\b/,
    ])
  ) {
    return [
      "If something was stolen, act quickly:",
      "- Report it to the nearest police station and request an FIR copy/number.",
      "- Share key details: date/time/place, item description, IMEI/serial number (for phone/laptop), and any suspects/witnesses.",
      "- Keep purchase proof, photos, and ownership documents.",
      "- If it’s a phone, block SIM, try tracking, and ask your operator for a SIM reissue.",
      "",
      DISCLAIMER,
    ].join("\n");
  }

  // 2) harassment / abuse
  if (
    matchesAny(text, [
      /\bharass(ment|ing)?\b/,
      /\babuse(d|ive)?\b/,
      /\bstalk(ing|er)?\b/,
      /\bthreat(en|s|ened)?\b/,
      /\bblackmail\b/,
      /\bmolest(ation|ed|ing)?\b/,
      /\beve[- ]?teas(ing)?\b/,
      /\bbully(ing)?\b/,
      /\bcyber\b/,
      /\bsexual\b/,
      /\brape\b/,
    ])
  ) {
    return [
      "I’m sorry you’re going through this. Please prioritize your safety:",
      "- If you’re in immediate danger, call 112 (emergency) or contact local police right now.",
      "- Save evidence: screenshots, chat logs, call recordings (where legal), emails, URLs, and witness details.",
      "- Avoid direct confrontation; block/report accounts and tighten privacy settings.",
      "- You can file a complaint/FIR at the police station (or women’s cell).",
      "",
      DISCLAIMER,
    ].join("\n");
  }

  // 3) missing person
  if (
    matchesAny(text, [
      /\bmissing\b/,
      /\bmissing person\b/,
      /\blost\b/,
      /\bnot found\b/,
      /\bdisappear(ed|ance)?\b/,
      /\bkho(gaya|gyi|gayi)\b/,
      /\blapata\b/,
    ])
  ) {
    return [
      "For a missing person in India, report immediately (no waiting):",
      "- Go to the nearest police station and file a missing person report/FIR.",
      "- Share a recent photo, physical description, last seen location/time, clothes, phone number, and ID details.",
      "- Ask for the report number and keep a copy.",
      "- Inform hospitals/shelters nearby and share the alert with trusted groups.",
      "",
      DISCLAIMER,
    ].join("\n");
  }

  // 4) domestic violence
  if (
    matchesAny(text, [
      /\bdomestic\b/,
      /\bviolence\b/,
      /\bdv\b/,
      /\bhusband\b/,
      /\bin[- ]?laws\b/,
      /\bbeaten\b/,
      /\bhit\b/,
      /\bassault\b/,
      /\bmarital\b/,
    ])
  ) {
    return [
      "If this is domestic violence, safety comes first:",
      "- If you’re in danger, call 112 immediately. Consider calling Women Helpline 181/1091.",
      "- Move to a safer place if possible (trusted friend/family/shelter).",
      "- Preserve evidence: medical reports, photos of injuries, messages, and witness details.",
      "- You can file a police complaint/FIR and seek protection/support services.",
      "",
      DISCLAIMER,
    ].join("\n");
  }

  return null;
}

export function getFallbackKnowledge(message) {
  const text = normalize(message);
  if (!text) return null;

  // Keep these as short “snippets” to help the LLM be practical,
  // not as template replies to the user.

  // theft / stolen / chori
  if (
    matchesAny(text, [
      /\btheft\b/,
      /\bstolen\b/,
      /\bsteal\b/,
      /\brob(bery|bed)?\b/,
      /\bsnatch(ed|ing)?\b/,
      /\bchori\b/,
      /\bchor\b/,
      /\bloot\b/,
    ])
  ) {
    return [
      "Theft (India) practical steps (use only if relevant):",
      "- Ask for FIR number/copy; include exact place/time, serial/IMEI, invoice details.",
      "- For phones: block SIM, change passwords for key accounts (email/banking/UPI), enable find-my-device if already set.",
      "- Preserve any CCTV/bus ticket/route details; note witnesses.",
    ].join("\n");
  }

  // harassment / abuse
  if (
    matchesAny(text, [
      /\bharass(ment|ing)?\b/,
      /\babuse(d|ive)?\b/,
      /\bstalk(ing|er)?\b/,
      /\bthreat(en|s|ened)?\b/,
      /\bblackmail\b/,
      /\bmolest(ation|ed|ing)?\b/,
      /\beve[- ]?teas(ing)?\b/,
      /\bbully(ing)?\b/,
      /\bcyber\b/,
      /\bsexual\b/,
      /\brape\b/,
    ])
  ) {
    return [
      "Harassment/abuse practical steps (use only if relevant):",
      "- Prioritize safety; for immediate danger advise emergency services.",
      "- Preserve evidence (screenshots, URLs, dates/times, witness names).",
      "- Suggest reporting channels: police station/women’s cell/cybercrime (as applicable).",
    ].join("\n");
  }

  // missing person
  if (
    matchesAny(text, [
      /\bmissing\b/,
      /\bmissing person\b/,
      /\blost\b/,
      /\bnot found\b/,
      /\bdisappear(ed|ance)?\b/,
      /\bkho(gaya|gyi|gayi)\b/,
      /\blapata\b/,
    ])
  ) {
    return [
      "Missing person practical steps (use only if relevant):",
      "- Report immediately; no waiting period. Get report number/copy.",
      "- Gather photo, last-seen time/place, clothes, phone/ID details, contacts.",
      "- Check nearby hospitals/shelters; coordinate with local police.",
    ].join("\n");
  }

  // domestic violence
  if (
    matchesAny(text, [
      /\bdomestic\b/,
      /\bviolence\b/,
      /\bdv\b/,
      /\bhusband\b/,
      /\bin[- ]?laws\b/,
      /\bbeaten\b/,
      /\bhit\b/,
      /\bassault\b/,
      /\bmarital\b/,
    ])
  ) {
    return [
      "Domestic violence practical steps (use only if relevant):",
      "- Safety planning: trusted contact, safe place, emergency numbers.",
      "- Preserve evidence (medical records, photos, messages).",
      "- Mention support options (women helpline/shelter/complaint) without pressuring.",
    ].join("\n");
  }

  // FIR / complaint
  if (matchesAny(text, [/\bfir\b/, /\bcomplaint\b/, /\bpolice report\b/])) {
    return [
      "FIR/complaint drafting tips (use only if relevant):",
      "- Stick to facts: who/what/when/where/how; include IDs, addresses, phone numbers.",
      "- Add chronology + evidence list; request receiving copy/acknowledgment.",
    ].join("\n");
  }

  return null;
}

export const FAILSAFE_REPLY =
  "Sorry, I couldn’t process your request right now.\nFor urgent help, please contact your nearest police station or helpline.";

