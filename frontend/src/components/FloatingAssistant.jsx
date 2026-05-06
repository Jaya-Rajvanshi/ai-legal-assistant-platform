import React, { useState } from "react";
import LegalChat from "./LegalChat.jsx";

const FloatingAssistant = () => {
  const [open, setOpen] = useState(false);

  return (
    <>
      <button
        onClick={() => setOpen((o) => !o)}
        className="fixed bottom-6 right-6 rounded-full bg-primary px-4 py-3 text-sm font-semibold text-white shadow-lg hover:bg-primary/90"
      >
        AI Assistant
      </button>
      {open && (
        <div className="fixed bottom-20 right-6 w-80 rounded-lg border border-slate-200 bg-white shadow-xl">
          <div className="flex items-center justify-between border-b border-slate-200 px-3 py-2">
            <h2 className="text-sm font-semibold text-slate-800">
              Quick Legal Help
            </h2>
            <button
              onClick={() => setOpen(false)}
              className="text-xs text-slate-500 hover:text-slate-800"
            >
              Close
            </button>
          </div>
          <div className="h-80 overflow-hidden">
            <LegalChat compact />
          </div>
        </div>
      )}
    </>
  );
};

export default FloatingAssistant;

