// NO LONGER IN USE

import React from "react";

export type SideNavItem = {
  id: string;
  label: string;
  href?: string;
  icon?: string;
};

type SideNavProps = {
  items?: SideNavItem[];
  activeId?: string;
  onNavigate?: (id: string) => void;
  logoSrc?: string;
  className?: string;
};

export default function SideNav({
  items = defaultItems,
  activeId = "dashboard",
  onNavigate,
  logoSrc,
  className = "",
}
  :  
  SideNavProps) {
  return (
    <aside
      className={[
        "h-screen w-[320px] shrink-0 bg-(--background-color) text-white",
        "border-r border-white/10",
        className,
      ].join(" ")}
    >
      <div className="px-6 pt-6">
        <div className="h-21 w-full overflow-hidden rounded-md">
          {logoSrc ? (
            <img
              src={logoSrc}
              alt="App logo"
              className="h-full w-full object-contain p-3"
            />
          ) : (
            <div className="flex h-full w-full">
              <a href="/dashboard"><img src="/public/logo/aggr0-logo.png" alt="AGGR0 Logo" className="h-20 w-70" /></a>
            </div>
          )}
        </div>
      </div>

      {/* Nav */}
      <nav className="mt-8">
        <ul className="space-y-3 px-0">
          {items.map((item) => {
            const isActive = item.id === activeId;

            const content = (
              <div
                className={[
                  "relative flex items-center gap-4",
                  "h-16 px-6",
                  isActive
                    ? "bg-[#2B7FB0]/70 shadow-lg/50 shadow-(color:--background-color)"
                    : "bg-transparent hover:bg-white/5",
                ].join(" ")}
              >
                {isActive && (
                  <span className="absolute left-0 top-0 h-full w-1.5 bg-[#2EB8FF]" />
                )}

                <span className="text-white/80">
                  {item.icon && (
                    <img src={item.icon} alt={item.label + ' icon'} className="w-8 h-8" />
                  )}
                </span>

                <span
                  className={[
                    "text-2xl leading-none",
                    isActive ? "text-white" : "text-white/70",
                  ].join(" ")}
                >
                  {item.label}
                </span>
              </div>
            );

            return (
              <li key={item.id}>
                {item.href ? (
                  <a
                    href={item.href}
                    aria-current={isActive ? "page" : undefined}
                    className="block"
                    onClick={(e) => {
                      if (onNavigate) {
                        e.preventDefault();
                        onNavigate(item.id);
                      }
                    }}
                  >
                    {content}
                  </a>
                ) : (
                  <button
                    type="button"
                    aria-current={isActive ? "page" : undefined}
                    className="block w-full text-left"
                    onClick={() => onNavigate?.(item.id)}
                  >
                    {content}
                  </button>
                )}
              </li>
            );
          })}
        </ul>
      </nav>
    </aside>
  );
}

const defaultItems: SideNavItem[] = [
  { id: "dashboard", label: "Dashboard", href: "#", icon: "/icons/dash.svg" },
  // { id: "library", label: "Library", href: "#", icon: "/icons/library.svg" },
  { id: "settings", label: "Settings", href: "#", icon: "/icons/settings.svg" },

  { id: "dashboardFill", label: "Dashboard TEST", href: "#" }, //TEST ONLY - DELETE LATER when all content has been moved to the real dashboard page
];