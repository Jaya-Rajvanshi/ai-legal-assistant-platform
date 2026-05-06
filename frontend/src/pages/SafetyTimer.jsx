import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Link } from "react-router-dom";
import Layout from "../components/Layout.jsx";
import { useAuth } from "../context/AuthContext.jsx";
import {
  getSafetyContacts,
  getSafetyHistory,
  saveSafetyContacts,
  startSafetyTimer,
  stopSafetyTimer,
  triggerSafetyAlert,
} from "../api/safetyTimer.js";

const LS_CONTACTS = "nayay_setu_safety_contacts";
const LS_PIN = "nayay_setu_safety_pin";
const LS_PIN_ENABLED = "nayay_setu_safety_pin_enabled";
const LS_TIMER = "nayay_setu_safety_timer_active";

const inputClass =
  "mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/25";

function loadContacts() {
  try {
    const raw = localStorage.getItem(LS_CONTACTS);
    const arr = raw ? JSON.parse(raw) : [];
    return Array.isArray(arr) ? arr.slice(0, 3) : [];
  } catch {
    return [];
  }
}

function userKey(user) {
  return user?.id || user?._id || "anonymous";
}

function saveContacts(list) {
  localStorage.setItem(LS_CONTACTS, JSON.stringify(list.slice(0, 3)));
}

function loadTimerState() {
  try {
    const raw = localStorage.getItem(LS_TIMER);
    if (!raw) return null;
    const o = JSON.parse(raw);
    if (!o || typeof o.endAt !== "number") return null;
    return o;
  } catch {
    return null;
  }
}

function saveTimerState(o) {
  if (!o) localStorage.removeItem(LS_TIMER);
  else localStorage.setItem(LS_TIMER, JSON.stringify(o));
}

function formatClock(totalSec) {
  const s = Math.max(0, Math.floor(totalSec));
  const m = Math.floor(s / 60);
  const r = s % 60;
  return `${String(m).padStart(2, "0")}:${String(r).padStart(2, "0")}`;
}

function digitsOnly(phone) {
  return String(phone || "").replace(/\D/g, "");
}

/** +country... for sms: and tel: */
function smsTelAddress(phone) {
  let d = digitsOnly(phone);
  if (d.length === 10) d = `91${d}`;
  return `+${d}`;
}

/** wa.me expects digits only, no + */
function waMeDigits(phone) {
  let d = digitsOnly(phone);
  if (d.length === 10) d = `91${d}`;
  return d;
}

function buildEmergencyBody({ userName, lat, lng, expiredAt }) {
  const locationLine =
    lat != null && lng != null && Number.isFinite(Number(lat)) && Number.isFinite(Number(lng))
      ? `https://maps.google.com/?q=${Number(lat).toFixed(5)},${Number(lng).toFixed(5)}`
      : "Location unavailable";
  return [
    "EMERGENCY ALERT 🚨",
    "I am using Nayaya Setu Safety Timer.",
    "My timer has expired and I may need help.",
    `Name: ${userName || "User"}`,
    `Location: ${locationLine}`,
    `Timer expired at: ${new Date(expiredAt || Date.now()).toLocaleString()}`,
    "Please call or check on me immediately.",
  ].join(" ");
}

function buildLinksForPhone(phoneRaw, body) {
  const smsAddr = smsTelAddress(phoneRaw);
  const smsHref = `sms:${smsAddr}?body=${encodeURIComponent(body)}`;
  const waHref = `https://wa.me/${waMeDigits(phoneRaw)}?text=${encodeURIComponent(body)}`;
  const telHref = `tel:${smsAddr}`;
  return { smsHref, waHref, telHref };
}

function buildEmergencyOutletFromState(st, contacts) {
  const body = buildEmergencyBody({
    userName: st?.userName,
    lat: st?.lastLat,
    lng: st?.lastLng,
    expiredAt: st?.expiredAt || Date.now(),
  });
  const list = contacts || loadContacts();
  const items = list.map((c) => ({
    id: c.id,
    name: c.name,
    phone: c.phone,
    ...buildLinksForPhone(c.phone, body),
  }));
  return { message: body, items };
}

const SafetyTimer = () => {
  const { user } = useAuth();
  const myUserId = userKey(user);
  const myUserName = user?.name || "User";
  const [contacts, setContacts] = useState(loadContacts);
  const [newName, setNewName] = useState("");
  const [newPhone, setNewPhone] = useState("");
  const [customMin, setCustomMin] = useState(30);
  const [pinInput, setPinInput] = useState("");
  const [pinEnabledPref, setPinEnabledPref] = useState(() =>
    localStorage.getItem(LS_PIN_ENABLED) === "1"
  );

  const [timerState, setTimerState] = useState(loadTimerState);
  const [remainingSec, setRemainingSec] = useState(0);
  const [uiPhase, setUiPhase] = useState("idle");
  const [emergencyOutlet, setEmergencyOutlet] = useState(null);
  const [backendHistory, setBackendHistory] = useState([]);
  useEffect(() => {
    (async () => {
      try {
        const [c, h] = await Promise.all([
          getSafetyContacts(myUserId),
          getSafetyHistory(myUserId),
        ]);
        if (Array.isArray(c.contacts)) {
          setContacts(c.contacts.map((x, i) => ({ id: String(i + 1), ...x })));
          saveContacts(c.contacts.map((x, i) => ({ id: String(i + 1), ...x })));
        }
        if (Array.isArray(h.history)) setBackendHistory(h.history.slice(0, 5));
      } catch (e) {
        console.error("safety timer bootstrap failed:", e);
      }
    })();
  }, [myUserId]);

  const [alertError, setAlertError] = useState("");
  const [pinModal, setPinModal] = useState(null);
  const vibratedRef = useRef(false);
  const tickRef = useRef(null);
  const locWatchRef = useRef(null);
  const expiryHandledRef = useRef(false);
  const clearLocationWatch = () => {
    if (locWatchRef.current != null) {
      navigator.geolocation.clearWatch(locWatchRef.current);
      locWatchRef.current = null;
    }
  };

  const updateStoredLocation = useCallback((lat, lng) => {
    const st = loadTimerState();
    if (!st) return;
    const next = {
      ...st,
      lastLat: lat,
      lastLng: lng,
      lastLocAt: Date.now(),
    };
    saveTimerState(next);
    setTimerState(next);
  }, []);

  const triggerLocalEmergency = useCallback(async () => {
    const st = loadTimerState();
    if (!st || st.alertSent) return;
    const lockKey = `nayay_safety_alert_${st.endAt}`;
    if (sessionStorage.getItem(lockKey)) return;
    sessionStorage.setItem(lockKey, "1");

    setUiPhase("emergency_pending");

    let lat = st.lastLat;
    let lng = st.lastLng;
    if (navigator.geolocation) {
      try {
        const pos = await new Promise((resolve, reject) => {
          navigator.geolocation.getCurrentPosition(resolve, reject, {
            enableHighAccuracy: true,
            timeout: 8000,
            maximumAge: 0,
          });
        });
        lat = pos.coords.latitude;
        lng = pos.coords.longitude;
      } catch {
        /* keep last known */
      }
    }

    const expiredAt = Date.now();
    const localMessage = buildEmergencyBody({
      userName: myUserName,
      lat: lat ?? st.lastLat,
      lng: lng ?? st.lastLng,
      expiredAt,
    });
    let backend = null;
    try {
      backend = await triggerSafetyAlert({
        userId: myUserId,
        userName: myUserName,
        sessionId: st.sessionId,
        contacts: contacts.map((c) => ({ name: c.name, phone: c.phone })),
        location:
          lat != null && lng != null ? { lat, lng } : null,
        expiredAt,
      });
      console.log("safety-timer trigger-alert result:", backend);
    } catch (e) {
      console.error("safety-timer trigger-alert failed:", e);
    }

    const outlet = backend
      ? {
          message: backend.message || localMessage,
          items: (backend.results || []).map((r, idx) => ({
            id: `${idx}`,
            name: r.name,
            phone: r.phone,
            status: r.status,
            sid: r.sid,
            error: r.error,
            smsHref: r.smsLink || buildLinksForPhone(r.phone, backend.message || localMessage).smsHref,
            waHref:
              r.whatsappLink ||
              buildLinksForPhone(r.phone, backend.message || localMessage).waHref,
            telHref:
              r.callLink ||
              buildLinksForPhone(r.phone, backend.message || localMessage).telHref,
          })),
          mode: backend.mode,
        }
      : buildEmergencyOutletFromState({
          ...st,
          userName: myUserName,
          lastLat: lat ?? st.lastLat,
          lastLng: lng ?? st.lastLng,
          expiredAt,
        }, contacts);

    const optimistic = {
      ...st,
      userName: myUserName,
      alertSent: true,
      lastLat: lat ?? st.lastLat,
      lastLng: lng ?? st.lastLng,
      expiredAt,
    };
    saveTimerState(optimistic);
    setTimerState(optimistic);
    setEmergencyOutlet(outlet);
    setUiPhase("emergency_triggered");
    expiryHandledRef.current = true;
  }, [contacts, myUserId, myUserName]);

  useEffect(() => {
    const st = loadTimerState();
    setTimerState(st);
    expiryHandledRef.current = false;
    if (!st) {
      setUiPhase("idle");
      setRemainingSec(0);
      setEmergencyOutlet(null);
      return;
    }
    const left = Math.ceil((st.endAt - Date.now()) / 1000);
    setRemainingSec(left);
    if (st.alertSent) {
      setEmergencyOutlet(buildEmergencyOutletFromState(st, contacts));
      setUiPhase("emergency_triggered");
    } else if (left <= 0) {
      setUiPhase("emergency_pending");
      triggerLocalEmergency();
    } else {
      setUiPhase("running");
    }
  }, [contacts, triggerLocalEmergency]);

  useEffect(() => {
    if (tickRef.current) {
      clearInterval(tickRef.current);
      tickRef.current = null;
    }

    const tick = () => {
      const st = loadTimerState();
      if (!st || st.alertSent) {
        setRemainingSec(0);
        return;
      }
      const left = Math.ceil((st.endAt - Date.now()) / 1000);
      setRemainingSec(left);
      if (left <= 60 && left > 0 && navigator.vibrate && !vibratedRef.current) {
        try {
          navigator.vibrate([180, 120, 180]);
          vibratedRef.current = true;
        } catch {
          /* ignore */
        }
      }
      if (left <= 0 && !expiryHandledRef.current) {
        expiryHandledRef.current = true;
        triggerLocalEmergency();
        setUiPhase("emergency_pending");
      }
    };

    tick();
    tickRef.current = setInterval(tick, 1000);
    return () => {
      if (tickRef.current) clearInterval(tickRef.current);
    };
  }, [triggerLocalEmergency, timerState?.endAt, timerState?.alertSent]);

  useEffect(() => {
    const st = loadTimerState();
    if (!st || st.alertSent) {
      clearLocationWatch();
      return undefined;
    }
    if (!navigator.geolocation) return undefined;
    locWatchRef.current = navigator.geolocation.watchPosition(
      (pos) => {
        updateStoredLocation(pos.coords.latitude, pos.coords.longitude);
      },
      () => {},
      { enableHighAccuracy: false, maximumAge: 60000, timeout: 20000 }
    );
    return () => clearLocationWatch();
  }, [timerState?.endAt, timerState?.alertSent, updateStoredLocation]);

  /** Auto-open SMS for first contact once per timer expiry (not again on page refresh). */
  useEffect(() => {
    if (uiPhase !== "emergency_triggered") return;
    const st = loadTimerState();
    const endAt = st?.endAt;
    const first = emergencyOutlet?.items?.[0];
    if (!first?.smsHref || endAt == null) return;
    const autoKey = `nayay_safety_auto_sms_${endAt}`;
    if (sessionStorage.getItem(autoKey)) return;
    const t = setTimeout(() => {
      if (sessionStorage.getItem(autoKey)) return;
      sessionStorage.setItem(autoKey, "1");
      try {
        const a = document.createElement("a");
        a.href = first.smsHref;
        a.rel = "noopener noreferrer";
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
      } catch {
        /* user can use button */
      }
    }, 500);
    return () => clearTimeout(t);
  }, [uiPhase, emergencyOutlet]);

  const addContact = () => {
    const name = newName.trim();
    const phone = newPhone.trim();
    if (!name || !phone) return;
    if (contacts.length >= 3) return;
    const next = [...contacts, { id: String(Date.now()), name, phone }];
    setContacts(next);
    saveContacts(next);
    saveSafetyContacts({
      userId: myUserId,
      userName: myUserName,
      contacts: next.map(({ name: n, phone: p }) => ({ name: n, phone: p })),
    }).catch((e) => console.error("save contacts failed:", e));
    setNewName("");
    setNewPhone("");
  };

  const removeContact = (id) => {
    const next = contacts.filter((c) => c.id !== id);
    setContacts(next);
    saveContacts(next);
    saveSafetyContacts({
      userId: myUserId,
      userName: myUserName,
      contacts: next.map(({ name: n, phone: p }) => ({ name: n, phone: p })),
    }).catch((e) => console.error("save contacts failed:", e));
  };

  const startTimer = () => {
    if (contacts.length === 0) return;
    const mins = Math.min(180, Math.max(1, Math.round(Number(customMin) || 1)));
    const storedPin = (localStorage.getItem(LS_PIN) || "").trim();
    const pinRequired =
      pinEnabledPref &&
      (/^\d{4}$/.test(pinInput) || /^\d{4}$/.test(storedPin));
    if (pinEnabledPref && !pinRequired) {
      setAlertError(
        "Enter a 4-digit PIN to enable PIN protection (or turn PIN protection off)."
      );
      return;
    }
    if (pinRequired) {
      if (/^\d{4}$/.test(pinInput)) {
        localStorage.setItem(LS_PIN, pinInput);
      }
      localStorage.setItem(LS_PIN_ENABLED, "1");
    } else {
      localStorage.removeItem(LS_PIN);
      localStorage.setItem(LS_PIN_ENABLED, "0");
    }

    const endAt = Date.now() + mins * 60 * 1000;
    const st = {
      userName: myUserName,
      endAt,
      durationMin: mins,
      startedAt: Date.now(),
      pinRequired,
      alertSent: false,
    };
    saveTimerState(st);
    setTimerState(st);
    setRemainingSec(mins * 60);
    setUiPhase("running");
    startSafetyTimer({
      userId: myUserId,
      userName: myUserName,
      durationMinutes: mins,
      contacts: contacts.map((c) => ({ name: c.name, phone: c.phone })),
    })
      .then((resp) => {
        const withId = { ...st, sessionId: resp.sessionId };
        saveTimerState(withId);
        setTimerState(withId);
      })
      .catch((e) => console.error("start timer session failed:", e));

    setEmergencyOutlet(null);
    setAlertError("");
    vibratedRef.current = false;
    expiryHandledRef.current = false;

    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          const next = {
            ...st,
            lastLat: pos.coords.latitude,
            lastLng: pos.coords.longitude,
            lastLocAt: Date.now(),
          };
          saveTimerState(next);
          setTimerState(next);
        },
        () => {},
        { enableHighAccuracy: true, timeout: 12000, maximumAge: 0 }
      );
    }
  };

  const verifyPin = (entered) => {
    const saved = localStorage.getItem(LS_PIN) || "";
    return entered === saved;
  };

  const stopTimerClear = () => {
    const st = loadTimerState();
    if (st?.sessionId) {
      stopSafetyTimer({
        userId: myUserId,
        sessionId: st.sessionId,
      }).catch((e) => console.error("stop timer session failed:", e));
    }
    if (st) {
      sessionStorage.removeItem(`nayay_safety_alert_${st.endAt}`);
    }
    saveTimerState(null);
    setTimerState(null);
    setRemainingSec(0);
    setUiPhase("safe");
    setEmergencyOutlet(null);
    vibratedRef.current = false;
    expiryHandledRef.current = false;
    if (tickRef.current) clearInterval(tickRef.current);
    clearLocationWatch();
  };

  const finishEmergencyFlow = () => {
    const st = loadTimerState();
    if (st) {
      sessionStorage.removeItem(`nayay_safety_alert_${st.endAt}`);
      sessionStorage.removeItem(`nayay_safety_auto_sms_${st.endAt}`);
    }
    saveTimerState(null);
    setTimerState(null);
    setRemainingSec(0);
    setEmergencyOutlet(null);
    setUiPhase("idle");
    if (tickRef.current) clearInterval(tickRef.current);
    clearLocationWatch();
  };

  const requestImSafe = () => {
    const st = loadTimerState();
    if (!st) return;
    if (st.pinRequired) {
      setPinModal({ action: "safe", title: "Confirm you are safe", pin: "" });
      return;
    }
    stopTimerClear();
  };

  const requestCancel = () => {
    const st = loadTimerState();
    if (!st) return;
    if (st.pinRequired) {
      setPinModal({ action: "cancel", title: "Enter PIN to cancel timer", pin: "" });
      return;
    }
    stopTimerClear();
  };

  const submitPinModal = () => {
    if (!pinModal) return;
    if (!verifyPin(pinModal.pin)) {
      setPinModal({ ...pinModal, error: "Incorrect PIN" });
      return;
    }
    setPinModal(null);
    if (pinModal.action === "safe" || pinModal.action === "cancel") {
      stopTimerClear();
    }
  };

  const warning = remainingSec > 0 && remainingSec <= 60 && uiPhase === "running";

  const presets = useMemo(() => [15, 30, 45, 60], []);

  const running = Boolean(timerState && !timerState.alertSent && remainingSec > 0);

  const showEmergencyUI =
    uiPhase === "emergency_triggered" ||
    uiPhase === "emergency_pending" ||
    (timerState?.alertSent && emergencyOutlet);

  const showSetup = !running && !showEmergencyUI;

  return (
    <Layout>
      <div className="mx-auto flex w-full max-w-3xl flex-col gap-6 pb-10">
        <section>
          <Link
            to="/"
            className="text-xs font-medium text-primary hover:text-sky-700"
          >
            ← Back to dashboard
          </Link>
          <h1 className="mt-3 text-2xl font-semibold text-primary">Safety Timer</h1>
          <p className="mt-2 text-sm text-slate-600">
            Set a countdown for your journey or walk. If you do not confirm that
            you are safe before time runs out, your phone opens SMS and WhatsApp
            with a pre-filled emergency message for each trusted contact — no paid
            SMS service required.
          </p>
        </section>

        {uiPhase === "safe" && (
          <div className="card border-l-4 border-l-emerald-500 bg-emerald-50/80">
            <p className="text-sm font-semibold text-emerald-900">You marked yourself safe.</p>
            <p className="mt-1 text-xs text-emerald-800">No alert was sent. You can start a new timer below.</p>
          </div>
        )}

        {showEmergencyUI && (
          <section className="card border-2 border-alert bg-gradient-to-b from-red-50 to-red-100/90 shadow-lg">
            <h2 className="text-xl font-bold text-red-900">Emergency alert triggered</h2>
            <p className="mt-2 text-sm text-red-800">
              Your timer expired. We opened the SMS app for your first contact when
              possible. Send the message, then use the buttons below for other
              contacts or WhatsApp.
            </p>
            {uiPhase === "emergency_pending" && !emergencyOutlet && (
              <p className="mt-3 text-sm font-medium text-red-700">
                Getting your latest location…
              </p>
            )}
            {emergencyOutlet?.message && (
              <div className="mt-4 rounded-lg border border-red-200 bg-white/80 p-3">
                <p className="text-[11px] font-semibold uppercase text-slate-500">
                  Message preview
                </p>
                <p className="mt-1 whitespace-pre-wrap text-xs text-slate-800">
                  {emergencyOutlet.message}
                </p>
              </div>
            )}
            {emergencyOutlet?.items?.length ? (
              <ul className="mt-4 space-y-4">
                {emergencyOutlet.items.map((row, idx) => (
                  <li
                    key={row.id || idx}
                    className="rounded-xl border border-red-200 bg-white p-4 shadow-sm"
                  >
                    <p className="font-semibold text-slate-900">{row.name}</p>
                    <p className="text-xs text-slate-600">{row.phone}</p>
                    <p className="text-[11px] text-slate-500">
                      Status: {row.status || "link_ready"}
                      {row.sid ? ` (sid ${row.sid})` : ""}
                      {row.error ? ` - ${row.error}` : ""}
                    </p>
                    <div className="mt-3 flex flex-wrap gap-2">
                      <a
                        href={row.smsHref}
                        className="btn-primary inline-flex px-4 py-2 text-xs"
                      >
                        Send SMS
                      </a>
                      <a
                        href={row.waHref}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center justify-center rounded-md border border-emerald-600 bg-emerald-50 px-4 py-2 text-xs font-semibold text-emerald-800 hover:bg-emerald-100"
                      >
                        WhatsApp
                      </a>
                      <a
                        href={row.telHref}
                        className="btn-secondary inline-flex px-4 py-2 text-xs"
                      >
                        Call
                      </a>
                    </div>
                  </li>
                ))}
              </ul>
            ) : emergencyOutlet && uiPhase === "emergency_triggered" ? (
              <p className="mt-4 text-sm text-red-800">
                No trusted contacts were saved. Add contacts before starting the timer
                next time.
              </p>
            ) : null}
            <button
              type="button"
              onClick={finishEmergencyFlow}
              className="btn-secondary mt-6 w-full sm:w-auto"
            >
              I&apos;ve notified my contacts — dismiss
            </button>
          </section>
        )}

        {running && (
          <section
            className={`rounded-2xl border-2 p-6 text-center shadow-lg transition-colors ${
              warning
                ? "border-alert bg-gradient-to-b from-red-50 to-red-100/90"
                : "border-primary/30 bg-white/90"
            }`}
          >
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
              {warning ? "Final minute — confirm safe" : "Timer running"}
            </p>
            <p className="mt-2 font-mono text-5xl font-bold tabular-nums text-primary sm:text-6xl">
              {formatClock(remainingSec)}
            </p>
            <p className="mt-2 text-sm text-slate-600">
              Stay aware. Tap <span className="font-semibold">I&apos;m Safe</span> when you arrive.
            </p>
            <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:justify-center">
              <button
                type="button"
                onClick={requestImSafe}
                className="rounded-xl bg-emerald-600 px-8 py-4 text-lg font-bold text-white shadow-md transition hover:bg-emerald-700 focus-visible:outline focus-visible:ring-4 focus-visible:ring-emerald-300"
              >
                I&apos;m Safe
              </button>
              <button
                type="button"
                onClick={requestCancel}
                className="btn-secondary rounded-xl px-6 py-3 text-sm font-semibold"
              >
                Cancel timer
              </button>
            </div>
          </section>
        )}

        {showSetup && (
          <>
            <section className="card space-y-4">
              <h2 className="text-base font-semibold text-primary">Duration</h2>
              <div className="grid gap-3 sm:grid-cols-2">
                <div>
                  <label className="text-xs font-medium text-slate-600">Hours</label>
                  <input
                    type="number"
                    min={0}
                    max={12}
                    value={Math.floor((Number(customMin) || 0) / 60)}
                    onChange={(e) => {
                      const h = Math.max(0, Number(e.target.value) || 0);
                      const minsOnly = Number(customMin) % 60;
                      setCustomMin(h * 60 + minsOnly);
                    }}
                    className={inputClass}
                  />
                </div>
                <div>
                  <label className="text-xs font-medium text-slate-600">Minutes</label>
                  <input
                    type="number"
                    min={0}
                    max={59}
                    value={Number(customMin) % 60}
                    onChange={(e) => {
                      const m = Math.max(0, Number(e.target.value) || 0);
                      const h = Math.floor((Number(customMin) || 0) / 60);
                      setCustomMin(h * 60 + Math.min(59, m));
                    }}
                    className={inputClass}
                  />
                </div>
              </div>
              <div className="flex flex-wrap gap-2">
                {presets.map((m) => (
                  <button
                    key={m}
                    type="button"
                    onClick={() => setCustomMin(m)}
                    className={`rounded-full px-4 py-2 text-sm font-semibold transition ${
                      customMin === m
                        ? "bg-primary text-white"
                        : "border border-slate-200 bg-slate-50 text-slate-700 hover:bg-slate-100"
                    }`}
                  >
                    {m} min
                  </button>
                ))}
              </div>
              <div>
                <label className="text-xs font-medium text-slate-600">Custom (minutes)</label>
                <input
                  type="number"
                  min={1}
                  max={180}
                  value={customMin}
                  onChange={(e) => setCustomMin(Number(e.target.value))}
                  className={inputClass}
                />
              </div>
            </section>
            {!!backendHistory.length && (
              <section className="card space-y-3">
                <h2 className="text-base font-semibold text-primary">Recent Safety Timer Logs</h2>
                <ul className="space-y-2 text-xs text-slate-600">
                  {backendHistory.map((h, idx) => (
                    <li key={h._id || h.id || idx} className="rounded-lg border border-slate-100 bg-slate-50 px-3 py-2">
                      <span className="font-medium text-slate-800">{h.status}</span>{" "}
                      • {new Date(h.createdAt).toLocaleString()}
                    </li>
                  ))}
                </ul>
              </section>
            )}

            <section className="card space-y-4">
              <h2 className="text-base font-semibold text-primary">Trusted contacts (max 3)</h2>
              <p className="text-xs text-slate-500">
                Stored only on this device. Used when the timer expires.
              </p>
              <ul className="space-y-2">
                {contacts.map((c) => (
                  <li
                    key={c.id}
                    className="flex items-center justify-between gap-2 rounded-lg border border-slate-100 bg-slate-50 px-3 py-2 text-sm"
                  >
                    <span>
                      <span className="font-medium text-slate-800">{c.name}</span>{" "}
                      <span className="text-slate-500">{c.phone}</span>
                    </span>
                    <button
                      type="button"
                      onClick={() => removeContact(c.id)}
                      className="text-xs font-semibold text-alert hover:underline"
                    >
                      Remove
                    </button>
                  </li>
                ))}
              </ul>
              {contacts.length < 3 && (
                <div className="grid gap-2 sm:grid-cols-2">
                  <div>
                    <label className="text-xs font-medium text-slate-600">Name</label>
                    <input
                      value={newName}
                      onChange={(e) => setNewName(e.target.value)}
                      className={inputClass}
                      placeholder="Contact name"
                    />
                  </div>
                  <div>
                    <label className="text-xs font-medium text-slate-600">Phone</label>
                    <input
                      value={newPhone}
                      onChange={(e) => setNewPhone(e.target.value)}
                      className={inputClass}
                      placeholder="Mobile number"
                    />
                  </div>
                </div>
              )}
              {contacts.length < 3 && (
                <button type="button" onClick={addContact} className="btn-secondary text-sm">
                  Add contact
                </button>
              )}
            </section>

            <section className="card space-y-3">
              <h2 className="text-base font-semibold text-primary">PIN protection (optional)</h2>
              <label className="flex items-center gap-2 text-sm text-slate-700">
                <input
                  type="checkbox"
                  checked={pinEnabledPref}
                  onChange={(e) => setPinEnabledPref(e.target.checked)}
                />
                Require PIN to cancel timer or mark safe
              </label>
              {pinEnabledPref && (
                <div>
                  <label className="text-xs font-medium text-slate-600">4-digit PIN</label>
                  <input
                    type="password"
                    inputMode="numeric"
                    maxLength={4}
                    value={pinInput}
                    onChange={(e) => setPinInput(e.target.value.replace(/\D/g, "").slice(0, 4))}
                    className={inputClass}
                    placeholder="••••"
                  />
                </div>
              )}
            </section>

            {alertError && (
              <p className="rounded-lg border border-red-100 bg-red-50 px-3 py-2 text-sm text-red-800">
                {alertError}
              </p>
            )}

            <div className="flex justify-center">
              <button
                type="button"
                onClick={startTimer}
                disabled={contacts.length === 0}
                className="btn-primary px-10 py-3 text-base font-semibold disabled:opacity-50"
              >
                Start timer
              </button>
            </div>
          </>
        )}

        {pinModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
            <div className="card max-w-sm shadow-xl">
              <h3 className="text-base font-semibold text-primary">{pinModal.title}</h3>
              <input
                type="password"
                inputMode="numeric"
                maxLength={4}
                autoFocus
                value={pinModal.pin}
                onChange={(e) =>
                  setPinModal({
                    ...pinModal,
                    pin: e.target.value.replace(/\D/g, "").slice(0, 4),
                    error: "",
                  })
                }
                className={`${inputClass} mt-3`}
                placeholder="PIN"
              />
              {pinModal.error && (
                <p className="mt-2 text-xs text-alert">{pinModal.error}</p>
              )}
              <div className="mt-4 flex gap-2">
                <button type="button" className="btn-primary flex-1" onClick={submitPinModal}>
                  Confirm
                </button>
                <button
                  type="button"
                  className="btn-secondary flex-1"
                  onClick={() => setPinModal(null)}
                >
                  Back
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </Layout>
  );
};

export default SafetyTimer;
