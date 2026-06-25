"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import type { UserProfile } from "@/types/domain";
import {
  getAppPersona,
  getNavItems,
  getPortalSubtitle,
  getPortalTitle,
} from "@/lib/auth/persona";
import { signOut } from "@/lib/auth/actions";

type SidebarProps = {
  profile: UserProfile | null;
};

export function Sidebar({ profile }: SidebarProps) {
  const pathname = usePathname();
  const persona = getAppPersona(profile);
  const navItems = getNavItems(persona);

  return (
    <aside className={`sidebar sidebar--${persona}`}>
      <div className="brand">
        <div className="brand-mark" aria-hidden="true">
          <svg viewBox="0 0 32 32" width="31" height="31" role="img">
            <path d="M4 19h15.7l2.2-6.2h3.9l2.2 6.2h1.9v5.1h-3a3.7 3.7 0 0 1-7.2 0H12a3.7 3.7 0 0 1-7.2 0H3V21c0-1.1.9-2 2-2Z" />
            <path d="M5.6 11.2h9.8c1.1 0 1.9.8 1.9 1.9V19H3.7v-6c0-1 .8-1.8 1.9-1.8Z" />
            <circle cx="8.4" cy="24.1" r="1.7" />
            <circle cx="23.3" cy="24.1" r="1.7" />
          </svg>
        </div>
        <div>
          <p className="eyebrow">{getPortalTitle(persona)}</p>
          <h1>{getPortalSubtitle(persona)}</h1>
        </div>
      </div>

      <nav className="nav-stack" aria-label="主要画面">
        {navItems.map((item) => {
          const active = pathname === item.href || pathname.startsWith(`${item.href}/`);
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`nav-link${active ? " is-active" : ""}`}
            >
              <span className="nav-icon" aria-hidden="true">
                {item.icon}
              </span>
              {item.label}
            </Link>
          );
        })}
      </nav>

      <div className="sidebar-note">
        <span className="note-label">ログイン中</span>
        <strong>{profile?.name ?? "ゲスト"}</strong>
        <span>{profile?.companyName ?? profile?.email ?? ""}</span>
        <form action={signOut} style={{ marginTop: 12 }}>
          <button type="submit" className="ghost-button full-width">
            ログアウト
          </button>
        </form>
      </div>
    </aside>
  );
}
