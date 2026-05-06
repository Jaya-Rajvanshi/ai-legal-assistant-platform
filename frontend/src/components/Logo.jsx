import React from "react";
import { Link } from "react-router-dom";

const ScalesIcon = ({ className, size = 24 }) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="1.6"
    strokeLinecap="round"
    strokeLinejoin="round"
    className={className}
    width={size}
    height={size}
    aria-hidden
  >
    <path d="M12 2v20" />
    <path d="M4 8h16" />
    <path d="M12 8v3" />
    <path d="M6 11l-2 5h4l-2-5z" />
    <path d="M18 11l-2 5h4l-2-5z" />
    <path d="M6 16H4" />
    <path d="M20 16h-2" />
  </svg>
);

const Logo = ({ variant = "compact", to = "/", className = "" }) => {
  const isCompact = variant === "compact";

  const content = (
    <>
      <div className="flex shrink-0 items-center justify-center text-white">
        <ScalesIcon size={isCompact ? 28 : 40} className="shrink-0" />
      </div>
      <div className="flex min-w-0 flex-col justify-center leading-tight">
        <span
          className={
            isCompact
              ? "truncate text-sm font-bold tracking-tight text-white sm:text-base"
              : "text-2xl font-bold tracking-tight text-white sm:text-3xl"
          }
        >
          Nayay Setu
        </span>
        <span
          className={
            isCompact
              ? "truncate text-[11px] text-white/85 sm:text-xs"
              : "mt-0.5 truncate text-xs text-white/90 sm:text-sm"
          }
        >
          AI Legal &amp; Emergency Assistant
        </span>
      </div>
    </>
  );

  const wrapperClass = isCompact
    ? `flex items-center gap-2.5 ${className}`
    : `flex items-center justify-center gap-4 rounded-xl bg-gradient-to-r from-[#0a1628] via-[#0f2847] to-[#1e3a5f] px-6 py-4 shadow-lg ${className}`;

  if (to) {
    return (
      <Link to={to} className={wrapperClass}>
        {content}
      </Link>
    );
  }

  return <div className={wrapperClass}>{content}</div>;
};

export default Logo;
