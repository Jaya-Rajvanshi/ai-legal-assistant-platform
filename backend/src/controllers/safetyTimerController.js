import crypto from "crypto";
import axios from "axios";
import { memoryStore, useInMemoryDb } from "../config/db.js";
import SafetyTimerContact from "../models/SafetyTimerContact.js";
import SafetyTimerSession from "../models/SafetyTimerSession.js";

const safeText = (v, max = 120) =>
  String(v || "")
    .replace(/[\r\n\t<>]+/g, " ")
    .trim()
    .slice(0, max);

const normalizeUserId = (req) =>
  safeText(req.user?.id || req.body?.userId || req.query?.userId || "anonymous", 80);

const normalizeUserName = (req) =>
  safeText(req.user?.name || req.body?.userName || "User", 80) || "User";

const normalizePhone = (raw) => {
  const s = String(raw || "").trim().replace(/[\s\-().]/g, "");
  if (!s) return null;
  if (s.startsWith("+")) {
    const x = s.slice(1).replace(/\D/g, "");
    if (x.length < 10 || x.length > 15) return null;
    return `+${x}`;
  }
  const d = s.replace(/\D/g, "");
  if (d.length === 10) return `+91${d}`;
  if (d.length >= 10 && d.length <= 15) return `+${d}`;
  return null;
};

const waDigits = (phoneE164) => phoneE164.replace(/[^\d]/g, "");

const toFast2SmsNumber = (phoneE164) => {
  const d = String(phoneE164 || "").replace(/[^\d]/g, "");
  if (d.length === 12 && d.startsWith("91")) return d.slice(2);
  if (d.length >= 10) return d.slice(-10);
  return d;
};

const mapUrlFromLocation = (location) => {
  if (!location) return null;
  const lat = Number(location.lat);
  const lng = Number(location.lng);
  if (!Number.isFinite(lat) || !Number.isFinite(lng)) return null;
  return `https://maps.google.com/?q=${lat},${lng}`;
};

const buildEmergencyMessage = ({ userName, location, expiredAt }) => {
  const mapUrl = mapUrlFromLocation(location);
  const when = expiredAt ? new Date(expiredAt) : new Date();
  const expiredAtText = when.toLocaleString();
  return [
    "EMERGENCY ALERT 🚨",
    "I am using Nayaya Setu Safety Timer.",
    "My timer has expired and I may need help.",
    `Name: ${safeText(userName, 80) || "User"}`,
    `Location: ${mapUrl || "Location unavailable"}`,
    `Timer expired at: ${expiredAtText}`,
    "Please call or check on me immediately.",
  ].join(" ");
};

const withLinks = (contact, message) => {
  const smsLink = `sms:${contact.phone}?body=${encodeURIComponent(message)}`;
  const whatsappLink = `https://wa.me/${waDigits(contact.phone)}?text=${encodeURIComponent(message)}`;
  const callLink = `tel:${contact.phone}`;
  return { smsLink, whatsappLink, callLink };
};

const getContactsMemory = (userId) =>
  memoryStore.safetyTimerContacts.find((x) => x.userId === userId) || null;

const setContactsMemory = (doc) => {
  const idx = memoryStore.safetyTimerContacts.findIndex((x) => x.userId === doc.userId);
  if (idx >= 0) memoryStore.safetyTimerContacts[idx] = doc;
  else memoryStore.safetyTimerContacts.push(doc);
  return doc;
};

const createSessionMemory = (payload) => {
  const doc = {
    id: crypto.randomUUID(),
    createdAt: new Date(),
    updatedAt: new Date(),
    ...payload,
  };
  memoryStore.safetyTimerSessions.push(doc);
  return doc;
};

const updateSessionMemory = (id, updates) => {
  const idx = memoryStore.safetyTimerSessions.findIndex((s) => s.id === id);
  if (idx < 0) return null;
  memoryStore.safetyTimerSessions[idx] = {
    ...memoryStore.safetyTimerSessions[idx],
    ...updates,
    updatedAt: new Date(),
  };
  return memoryStore.safetyTimerSessions[idx];
};

const getLatestSessionMemory = (userId) => {
  const items = memoryStore.safetyTimerSessions
    .filter((x) => x.userId === userId)
    .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
  return items[0] || null;
};

const getSessionByIdMemory = (id) =>
  memoryStore.safetyTimerSessions.find((x) => x.id === id) || null;

const validateContactsInput = (contacts) => {
  if (!Array.isArray(contacts) || contacts.length === 0) {
    return { error: "Provide at least one trusted contact." };
  }
  if (contacts.length > 3) {
    return { error: "At most 3 trusted contacts are allowed." };
  }
  const out = [];
  for (const c of contacts) {
    const name = safeText(c?.name, 60);
    const phone = normalizePhone(c?.phone);
    if (!name) return { error: "Each contact requires a valid name." };
    if (!phone) return { error: `Invalid phone number for contact "${name}".` };
    out.push({ name, phone });
  }
  return { contacts: out };
};

export const saveTrustedContacts = async (req, res) => {
  try {
    const userId = normalizeUserId(req);
    const userName = normalizeUserName(req);
    const { contacts } = req.body || {};
    const v = validateContactsInput(contacts);
    if (v.error) return res.status(400).json({ message: v.error });

    if (useInMemoryDb) {
      const doc = setContactsMemory({
        userId,
        userName,
        contacts: v.contacts,
        updatedAt: new Date(),
      });
      return res.json({ ok: true, contacts: doc.contacts });
    }

    const doc = await SafetyTimerContact.findOneAndUpdate(
      { userId },
      { userId, userName, contacts: v.contacts },
      { upsert: true, new: true, setDefaultsOnInsert: true }
    );
    return res.json({ ok: true, contacts: doc.contacts });
  } catch (error) {
    console.error("safety-timer save contacts:", error);
    return res.status(500).json({ message: "Failed to save trusted contacts." });
  }
};

export const getTrustedContacts = async (req, res) => {
  try {
    const userId = normalizeUserId(req);
    if (useInMemoryDb) {
      const doc = getContactsMemory(userId);
      return res.json({ contacts: doc?.contacts || [] });
    }
    const doc = await SafetyTimerContact.findOne({ userId }).lean();
    return res.json({ contacts: doc?.contacts || [] });
  } catch (error) {
    console.error("safety-timer get contacts:", error);
    return res.status(500).json({ message: "Failed to fetch contacts." });
  }
};

export const startSafetyTimer = async (req, res) => {
  try {
    const userId = normalizeUserId(req);
    const userName = normalizeUserName(req);
    const durationMinutes = Number(req.body?.durationMinutes);
    const contacts = req.body?.contacts;

    if (!Number.isFinite(durationMinutes) || durationMinutes <= 0 || durationMinutes > 24 * 60) {
      return res.status(400).json({ message: "Provide a valid duration in minutes." });
    }
    const v = validateContactsInput(contacts);
    if (v.error) return res.status(400).json({ message: v.error });

    const payload = {
      userId,
      userName,
      durationMinutes: Math.round(durationMinutes),
      contacts: v.contacts,
      status: "running",
      startedAt: new Date(),
    };

    if (useInMemoryDb) {
      const session = createSessionMemory(payload);
      return res.status(201).json({ ok: true, sessionId: session.id, session });
    }

    const session = await SafetyTimerSession.create(payload);
    return res.status(201).json({ ok: true, sessionId: session._id.toString(), session });
  } catch (error) {
    console.error("safety-timer start:", error);
    return res.status(500).json({ message: "Failed to start timer session." });
  }
};

export const stopSafetyTimer = async (req, res) => {
  try {
    const userId = normalizeUserId(req);
    const sessionId = safeText(req.body?.sessionId, 80);
    const updates = { status: "safe", stoppedAt: new Date() };

    if (useInMemoryDb) {
      const current = sessionId ? getSessionByIdMemory(sessionId) : getLatestSessionMemory(userId);
      if (!current) return res.status(404).json({ message: "Timer session not found." });
      const updated = updateSessionMemory(current.id, updates);
      return res.json({ ok: true, session: updated });
    }

    let query = sessionId ? { _id: sessionId } : { userId };
    if (!sessionId) query = { ...query, status: "running" };
    const session = await SafetyTimerSession.findOneAndUpdate(query, updates, {
      new: true,
      sort: { createdAt: -1 },
    });
    if (!session) return res.status(404).json({ message: "Timer session not found." });
    return res.json({ ok: true, session });
  } catch (error) {
    console.error("safety-timer stop:", error);
    return res.status(500).json({ message: "Failed to stop timer session." });
  }
};

export const triggerSafetyTimerAlert = async (req, res) => {
  try {
    const userId = normalizeUserId(req);
    const userName = normalizeUserName(req);
    const { contacts, sessionId, location } = req.body || {};
    const expiredAt = req.body?.expiredAt || new Date();

    const v = validateContactsInput(contacts);
    if (v.error) return res.status(400).json({ message: v.error });

    const message = buildEmergencyMessage({ userName, location, expiredAt });
    const mapUrl = mapUrlFromLocation(location);

    const fastApiKey = process.env.FAST2SMS_API_KEY;
    if (!fastApiKey) {
      return res.status(500).json({
        success: false,
        message: "FAST2SMS_API_KEY is missing in server environment.",
      });
    }

    const numbers = v.contacts.map((c) => toFast2SmsNumber(c.phone)).filter(Boolean);
    const numbersCsv = numbers.join(",");

    const fastPayload = {
      route: "q",
      message,
      language: "english",
      flash: 0,
      numbers: numbersCsv,
    };

    const fastResponse = await axios.post(
      "https://www.fast2sms.com/dev/bulkV2",
      fastPayload,
      {
        headers: {
          authorization: fastApiKey,
          "Content-Type": "application/json",
        },
      }
    );

    console.log("Fast2SMS response:", fastResponse.data);

    const results = v.contacts.map((c, idx) => ({
      name: c.name,
      phone: c.phone,
      status: "sent",
      provider: "fast2sms",
      providerResponse: fastResponse.data || null,
      ...withLinks(c, message),
      submittedNumber: numbers[idx] || null,
    }));
    const mode = "fast2sms";

    const sessionUpdates = {
      status: "expired",
      expiredAt: new Date(expiredAt),
      triggeredAt: new Date(),
      location: mapUrl
        ? { lat: Number(location.lat), lng: Number(location.lng), mapsUrl: mapUrl }
        : undefined,
      alertMessage: message,
      alertResults: results,
    };

    if (useInMemoryDb) {
      let target = sessionId ? getSessionByIdMemory(sessionId) : getLatestSessionMemory(userId);
      if (target) updateSessionMemory(target.id, sessionUpdates);
      memoryStore.safetyTimerAlertLogs.push({
        id: crypto.randomUUID(),
        userId,
        userName,
        message,
        mode,
        results,
        createdAt: new Date(),
      });
      return res.json({
        success: true,
        mode,
        message,
        mapUrl: mapUrl || null,
        results,
      });
    }

    if (sessionId) {
      await SafetyTimerSession.findByIdAndUpdate(sessionId, sessionUpdates, { new: true });
    } else {
      await SafetyTimerSession.findOneAndUpdate(
        { userId, status: "running" },
        sessionUpdates,
        { new: true, sort: { createdAt: -1 } }
      );
    }

    return res.json({
      success: true,
      mode,
      message,
      mapUrl: mapUrl || null,
      results,
    });
  } catch (error) {
    console.error("safety-timer trigger-alert:", error);
    if (error.response) {
      console.log("Fast2SMS error response:", error.response.data);
    }
    return res.status(500).json({ message: "Failed to trigger emergency alert." });
  }
};

export const getSafetyTimerHistory = async (req, res) => {
  try {
    const userId = normalizeUserId(req);
    if (useInMemoryDb) {
      const list = memoryStore.safetyTimerSessions
        .filter((x) => x.userId === userId)
        .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
        .slice(0, 50);
      return res.json({ history: list });
    }
    const list = await SafetyTimerSession.find({ userId })
      .sort({ createdAt: -1 })
      .limit(50)
      .lean();
    return res.json({ history: list });
  } catch (error) {
    console.error("safety-timer history:", error);
    return res.status(500).json({ message: "Failed to fetch safety timer history." });
  }
};
