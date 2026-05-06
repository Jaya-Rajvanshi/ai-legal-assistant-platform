import React from "react";
import { Link, NavLink } from "react-router-dom";
import { useAuth } from "../context/AuthContext.jsx";
import Logo from "./Logo.jsx";

const baseNavLinkClass =
  "px-3 py-2 text-sm font-medium rounded-full transition-colors duration-200";

const navLinkClass = ({ isActive }) =>
  [
    baseNavLinkClass,
    isActive
      ? "bg-white/15 text-white shadow-sm"
      : "text-slate-100/90 hover:bg-white/10 hover:text-white",
  ].join(" ");

const Navbar = () => {
  const { user, logout } = useAuth();

  return (
    <nav className="sticky top-0 z-30 bg-gradient-to-r from-[#0a1628] via-primary to-sky-600 text-white shadow-lg shadow-primary/20 backdrop-blur">
      <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-4 py-3">
        <Logo variant="compact" to="/" />

        <div className="hidden items-center gap-1 md:flex">
          <NavLink to="/" className={navLinkClass}>
            Home
          </NavLink>
          <NavLink to="/legal-help" className={navLinkClass}>
            Legal Help
          </NavLink>
          <NavLink to="/report-harassment" className={navLinkClass}>
            Crimes Against Women
          </NavLink>
          <NavLink to="/missing-person" className={navLinkClass}>
            Missing Persons
          </NavLink>
          <NavLink to="/emergency-helpline" className={navLinkClass}>
            Emergency Helpline
          </NavLink>
          <NavLink to="/police-stations" className={navLinkClass}>
            Police Finder
          </NavLink>
          <NavLink to="/safety-timer" className={navLinkClass}>
            Safety Timer
          </NavLink>
        </div>

        <div className="hidden items-center gap-3 md:flex">
          {user && (
            <div className="flex flex-col items-end leading-tight text-xs">
              <span className="text-sky-100/90">
                Welcome,{" "}
                <span className="font-semibold text-white">
                  {user.name}
                </span>
              </span>
              <div className="flex items-center gap-2">
                <span className="rounded-full bg-white/10 px-2 py-0.5 text-[11px] uppercase tracking-wide text-sky-100">
                  {user.role}
                </span>
                {user.role === "admin" && (
                  <Link
                    to="/admin"
                    className="rounded-full bg-white/15 px-2 py-0.5 text-[11px] font-semibold text-amber-100 hover:bg-white/25"
                  >
                    Admin Dashboard
                  </Link>
                )}
              </div>
            </div>
          )}
          {user ? (
            <button
              onClick={logout}
              className="inline-flex items-center justify-center rounded-full bg-white/90 px-4 py-1.5 text-xs font-semibold text-primary shadow-sm transition hover:bg-white"
            >
              Logout
            </button>
          ) : (
            <NavLink
              to="/auth"
              className="inline-flex items-center justify-center rounded-full bg-white/90 px-4 py-1.5 text-xs font-semibold text-primary shadow-sm transition hover:bg-white"
            >
              Login
            </NavLink>
          )}
        </div>
      </div>
    </nav>
  );
};

export default Navbar;

