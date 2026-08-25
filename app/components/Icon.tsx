import React from "react";

type IconName =
  | "home"
  | "sale"
  | "calendar"
  | "calendar-grid"
  | "trophy"
  | "more"
  | "analytics"
  | "shield"
  | "users"
  | "package"
  | "tool"
  | "shopping"
  | "plane"
  | "plus"
  | "check"
  | "chevron-right"
  | "chevron-left"
  | "arrow-left"
  | "logout"
  | "menu"
  | "x"
  | "trending-up"
  | "trending-down"
  | "search"
  | "sun"
  | "moon"
  | "sparkle"
  | "leaf"
  | "bracelet"
  | "shield-check"
  | "circle";

type IconProps = {
  name: IconName;
  className?: string;
  size?: number;
};

export function Icon({ name, className = "", size = 22 }: IconProps) {
  const props = {
    width: size,
    height: size,
    viewBox: "0 0 24 24",
    fill: "none",
    stroke: "currentColor",
    strokeWidth: 2,
    strokeLinecap: "round" as const,
    strokeLinejoin: "round" as const,
    className,
  };

  switch (name) {
    case "home":
      return (
        <svg {...props}>
          <path d="M3 9.5L12 3l9 6.5V20a2 2 0 0 1-2 2h-4v-7h-6v7H5a2 2 0 0 1-2-2V9.5z" />
        </svg>
      );
    case "sale":
      return (
        <svg {...props}>
          <path d="M12 1.5l3.5 3.5H20a2 2 0 0 1 2 2v4.5l3.5 3.5-3.5 3.5V22a2 2 0 0 1-2 2h-4.5L12 27.5 8.5 24H4a2 2 0 0 1-2-2v-4.5L-1.5 14 2 10.5V6a2 2 0 0 1 2-2h4.5L12 1.5z" transform="translate(0 -1)" opacity="0" />
          <circle cx="9" cy="9" r="1.5" />
          <circle cx="15" cy="15" r="1.5" />
          <path d="M8 16l8-8" />
          <path d="M3 12h2M19 12h2M12 3v2M12 19v2" />
        </svg>
      );
    case "calendar":
      return (
        <svg {...props}>
          <rect x="3" y="5" width="18" height="16" rx="2" />
          <path d="M3 10h18M8 3v4M16 3v4" />
        </svg>
      );
    case "trophy":
      return (
        <svg {...props}>
          <path d="M8 21h8M12 17v4M7 4h10v4a5 5 0 0 1-10 0V4z" />
          <path d="M17 4h3v3a3 3 0 0 1-3 3M7 4H4v3a3 3 0 0 0 3 3" />
        </svg>
      );
    case "more":
      return (
        <svg {...props}>
          <circle cx="6" cy="12" r="1.5" fill="currentColor" />
          <circle cx="12" cy="12" r="1.5" fill="currentColor" />
          <circle cx="18" cy="12" r="1.5" fill="currentColor" />
        </svg>
      );
    case "analytics":
      return (
        <svg {...props}>
          <path d="M3 21h18M6 17V9M11 17V5M16 17v-6M21 17v-2" />
        </svg>
      );
    case "shield":
      return (
        <svg {...props}>
          <path d="M12 2l8 4v6c0 5-3.5 9.5-8 10-4.5-.5-8-5-8-10V6l8-4z" />
        </svg>
      );
    case "users":
      return (
        <svg {...props}>
          <circle cx="9" cy="8" r="3" />
          <path d="M3 21v-1a6 6 0 0 1 12 0v1" />
          <circle cx="17" cy="6" r="2.5" />
          <path d="M15 14a5 5 0 0 1 6 4.5V20" />
        </svg>
      );
    case "package":
      return (
        <svg {...props}>
          <path d="M21 8l-9-5-9 5 9 5 9-5z" />
          <path d="M3 8v8l9 5 9-5V8" />
          <path d="M12 13v8" />
        </svg>
      );
    case "tool":
      return (
        <svg {...props}>
          <path d="M14.7 6.3a4 4 0 0 1-5.4 5.4l-6.6 6.6a2 2 0 1 0 2.8 2.8l6.6-6.6a4 4 0 0 0 5.4-5.4l-2.3 2.3-2.4-2.4 2.3-2.3z" />
        </svg>
      );
    case "shopping":
      return (
        <svg {...props}>
          <path d="M3 3h2l2.5 12.5a2 2 0 0 0 2 1.5h9a2 2 0 0 0 2-1.5L22 7H6" />
          <circle cx="9" cy="20" r="1.5" />
          <circle cx="18" cy="20" r="1.5" />
        </svg>
      );
    case "plane":
      return (
        <svg {...props}>
          <path d="M21 12l-9 9v-4l3-3-3-3V8M3 12l5 5v-3l-2-2 2-2v-3z" transform="rotate(45 12 12)" opacity="0" />
          <path d="M2 16l20-7L12 2 2 16zM12 2v10l10-3" />
        </svg>
      );
    case "plus":
      return (
        <svg {...props}>
          <path d="M12 5v14M5 12h14" />
        </svg>
      );
    case "check":
      return (
        <svg {...props}>
          <path d="M5 12l5 5 9-11" />
        </svg>
      );
    case "chevron-right":
      return (
        <svg {...props}>
          <path d="M9 5l7 7-7 7" />
        </svg>
      );
    case "chevron-left":
      return (
        <svg {...props}>
          <path d="M15 5l-7 7 7 7" />
        </svg>
      );
    case "arrow-left":
      return (
        <svg {...props}>
          <path d="M19 12H5M12 19l-7-7 7-7" />
        </svg>
      );
    case "logout":
      return (
        <svg {...props}>
          <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4M16 17l5-5-5-5M21 12H9" />
        </svg>
      );
    case "menu":
      return (
        <svg {...props}>
          <path d="M3 6h18M3 12h18M3 18h18" />
        </svg>
      );
    case "x":
      return (
        <svg {...props}>
          <path d="M6 6l12 12M18 6L6 18" />
        </svg>
      );
    case "trending-up":
      return (
        <svg {...props}>
          <path d="M3 17l6-6 4 4 8-8M14 7h7v7" />
        </svg>
      );
    case "trending-down":
      return (
        <svg {...props}>
          <path d="M3 7l6 6 4-4 8 8M14 17h7v-7" />
        </svg>
      );
    case "search":
      return (
        <svg {...props}>
          <circle cx="11" cy="11" r="7" />
          <path d="M21 21l-4-4" />
        </svg>
      );
    case "sun":
      return (
        <svg {...props}>
          <circle cx="12" cy="12" r="4" />
          <path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M4.93 19.07l1.41-1.41M17.66 6.34l1.41-1.41" />
        </svg>
      );
    case "moon":
      return (
        <svg {...props}>
          <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
        </svg>
      );
    case "sparkle":
      return (
        <svg {...props}>
          <path d="M12 2l1.8 5.4L19 9l-5.2 1.6L12 16l-1.8-5.4L5 9l5.2-1.6L12 2z" />
          <path d="M19 16l.9 2.6L22 19l-2.1.4L19 22l-.9-2.6L16 19l2.1-.4.9-2.6z" />
        </svg>
      );
    case "leaf":
      return (
        <svg {...props}>
          <path d="M21 3c-9 0-16 7-16 16 0 1 0 2 .2 3 1-.2 2-.2 3-.2 9 0 16-7 16-16 0-1 0-2-.2-3-1 .2-2 .2-3 .2z" />
          <path d="M5 21l9-9" />
        </svg>
      );
    case "bracelet":
      return (
        <svg {...props}>
          <circle cx="12" cy="12" r="8" />
          <circle cx="12" cy="12" r="5" />
          <circle cx="12" cy="12" r="2" />
        </svg>
      );
    case "shield-check":
      return (
        <svg {...props}>
          <path d="M12 2l8 4v6c0 5-3.5 9.5-8 10-4.5-.5-8-5-8-10V6l8-4z" />
          <path d="M9 12l2 2 4-4" />
        </svg>
      );
    case "circle":
      return (
        <svg {...props}>
          <circle cx="12" cy="12" r="9" />
        </svg>
      );
    case "calendar-grid":
      return (
        <svg {...props}>
          <rect x="3" y="4" width="18" height="17" rx="2" />
          <path d="M3 10h18M8 4v3M16 4v3" />
          <rect x="6.5" y="13" width="3" height="2.5" rx="0.5" fill="currentColor" stroke="none" />
          <rect x="11" y="13" width="3" height="2.5" rx="0.5" fill="currentColor" stroke="none" />
          <rect x="15.5" y="13" width="2.5" height="2.5" rx="0.5" fill="currentColor" stroke="none" />
          <rect x="6.5" y="16.5" width="3" height="2.5" rx="0.5" fill="currentColor" stroke="none" />
          <rect x="11" y="16.5" width="3" height="2.5" rx="0.5" fill="currentColor" stroke="none" />
        </svg>
      );
  }
}
