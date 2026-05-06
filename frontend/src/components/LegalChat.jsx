import React, { useEffect, useMemo, useRef, useState } from "react";
import api from "../api/client.js";

const LegalChat = ({ compact = false }) => {
  const storageKey = useMemo(
    () => (compact ? "nayay_setu_ai_assistant_compact" : "nayay_setu_ai_assistant"),
    [compact]
  );

  const welcomeMessage = useMemo(
    () => ({
      role: "assistant",
      content:
        "Hi, I’m your AI legal & emergency assistant. Describe your issue…",
    }),
    []
  );

  const [messages, setMessages] = useState([welcomeMessage]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const bottomRef = useRef(null);

  useEffect(() => {
    try {
      const raw = sessionStorage.getItem(storageKey);
      if (!raw) return;
      const parsed = JSON.parse(raw);
      if (!Array.isArray(parsed) || parsed.length === 0) return;
      const safe = parsed
        .filter(
          (m) =>
            m &&
            (m.role === "user" || m.role === "assistant") &&
            typeof m.content === "string"
        )
        .slice(-50);
      if (safe.length > 0) setMessages(safe);
    } catch {
      // ignore storage parsing issues
    }
  }, [storageKey]);

  useEffect(() => {
    try {
      sessionStorage.setItem(storageKey, JSON.stringify(messages.slice(-50)));
    } catch {
      // ignore quota / private mode issues
    }
  }, [messages, storageKey]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, loading]);

  const handleSend = async (e) => {
    e?.preventDefault();
    const trimmed = input.trim();
    if (!trimmed || loading) return;
    setError("");

    const userMessage = { role: "user", content: trimmed };
    setMessages((prev) => [...prev, userMessage]);
    setLoading(true);
    try {
      const history = messages
        .filter((m) => m.role === "user" || m.role === "assistant")
        .slice(-20);

      const { data } = await api.post("/ai-assistant/chat", {
        message: trimmed,
        history,
      });
      const botMessage = {
        role: "assistant",
        content: data?.reply || "Something went wrong, try again",
      };
      setMessages((prev) => [...prev, botMessage]);
      setInput("");
    } catch (err) {
      console.error(err);
      // The backend is designed to always return a reply; this is a network-level fallback.
      setError("");
      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          content:
            "Sorry, I couldn’t process your request right now.\nFor urgent help, please contact your nearest police station or helpline.",
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex h-full flex-col">
      {!compact && (
        <p className="mb-2 text-sm text-slate-600">
          Describe your legal situation in detail. The AI assistant will provide
          guidance and a structured summary (not a substitute for a lawyer).
        </p>
      )}
      <div className="flex-1 space-y-2 overflow-y-auto rounded border border-slate-200 bg-slate-50 p-2 text-sm">
        {messages.map((m, idx) => (
          <div
            key={idx}
            className={`flex ${
              m.role === "user" ? "justify-end" : "justify-start"
            }`}
          >
            <div
              className={`max-w-[80%] rounded px-3 py-2 text-xs ${
                m.role === "user"
                  ? "bg-primary text-white"
                  : "bg-white text-slate-800 border border-slate-200"
              }`}
            >
              {m.content}
            </div>
          </div>
        ))}
        {loading && (
          <p className="text-xs text-slate-500">Assistant is typing...</p>
        )}
        <div ref={bottomRef} />
      </div>
      {error && (
        <p className="mt-1 text-xs text-alert">
          {error}
        </p>
      )}
      <form onSubmit={handleSend} className="mt-2 flex gap-2">
        <textarea
          className="h-16 flex-1 resize-none rounded border border-slate-200 px-2 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
          placeholder="Describe your issue..."
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter" && !e.shiftKey) {
              e.preventDefault();
              handleSend();
            }
          }}
        />
        <button
          type="submit"
          disabled={loading || !input.trim()}
          className="btn-primary self-end px-3 py-2 text-xs"
        >
          Send
        </button>
      </form>
    </div>
  );
};

export default LegalChat;

