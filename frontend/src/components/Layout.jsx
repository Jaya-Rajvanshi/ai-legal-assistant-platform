import React from "react";
import Navbar from "./Navbar.jsx";
import FloatingAssistant from "./FloatingAssistant.jsx";

const Layout = ({ children }) => {
  return (
    <div className="flex min-h-screen flex-col bg-slate-900/5 bg-[radial-gradient(circle_at_top,_rgba(15,76,129,0.18),_transparent_55%),_radial-gradient(circle_at_bottom,_rgba(40,120,180,0.18),_transparent_55%)]">
      <Navbar />
      <main className="mx-auto flex w-full max-w-6xl flex-1 px-4 py-6">
        {children}
      </main>
      <FloatingAssistant />
    </div>
  );
};

export default Layout;

