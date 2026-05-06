import api from "./client.js";

export async function saveSafetyContacts(payload) {
  const { data } = await api.post("/safety-timer/contacts", payload);
  return data;
}

export async function getSafetyContacts(userId) {
  const { data } = await api.get("/safety-timer/contacts", {
    params: { userId },
  });
  return data;
}

export async function startSafetyTimer(payload) {
  const { data } = await api.post("/safety-timer/start", payload);
  return data;
}

export async function stopSafetyTimer(payload) {
  const { data } = await api.post("/safety-timer/stop", payload);
  return data;
}

export async function triggerSafetyAlert(payload) {
  const { data } = await api.post("/safety-timer/trigger-alert", payload);
  return data;
}

export async function getSafetyHistory(userId) {
  const { data } = await api.get("/safety-timer/history", {
    params: { userId },
  });
  return data;
}
