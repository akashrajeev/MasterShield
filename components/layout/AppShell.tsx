"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import type { ReactNode } from "react";

const navItems = [
  { label: "Overview", href: "/", icon: "⌘" },
  { label: "Attack Library", href: "/attack-library", icon: "◈", badge: "125+" },
  { label: "Red Team Simulator", href: "/simulator", icon: "⚡", tag: "SIMULATE" },
  { label: "Generated Data", href: "/generated-data", icon: "▣" },
  { label: "Blue Team Lab", href: "/detection-lab", icon: "◌" },
  { label: "The Closed Loop", href: "/closed-loop", icon: "↺", tag: "CORE" },
  { label: "Novelty Engine", href: "/novelty-engine", icon: "✦" },
  { label: "Investigation Center", href: "/investigation", icon: "⌕", badge: "12" },
];

export function AppShell({ children, title = "Defense Overview" }: { children: ReactNode; title?: string }) {
  const pathname = usePathname();

  return (
    <main className="shell library-shell">
      <aside className="sidebar">
        <Link className="brand" href="/">
          <div className="brand-mark">
            <span className="mark-circle mark-red" />
            <span className="mark-circle mark-yellow" />
          </div>
          <div className="brand-text">
            <span>MasterShield</span>
            <small>DEFENSE LAB</small>
          </div>
        </Link>

        <div className="workspace">
          <span className="workspace-label">DEPLOYMENT CONTEXT</span>
          <button className="workspace-btn">
            <span>Mastercard Innovation @ GFF 2026</span>
            <span className="chevron">⌄</span>
          </button>
        </div>

        <nav className="nav-menu">
          {navItems.map(item => {
            const isActive = pathname === item.href || (item.href !== "/" && pathname.startsWith(item.href));
            return (
              <Link
                key={item.label}
                href={item.href}
                className={`nav-item ${isActive ? "active" : ""}`}
              >
                <span className="nav-glyph">{item.icon}</span>
                <span className="nav-label">{item.label}</span>
                {item.tag && <span className="nav-tag">{item.tag}</span>}
                {item.badge && <span className="nav-count">{item.badge}</span>}
              </Link>
            );
          })}
        </nav>

        <div className="nav-divider" />

        <div className="demo-nav-wrap">
          <Link
            href="/demo"
            className={`nav-item nav-demo-item ${pathname === "/demo" ? "active" : ""}`}
          >
            <span className="nav-glyph demo-star">★</span>
            <span className="nav-label">Judge Demo (3-min)</span>
            <span className="nav-tag demo-tag">EVALUATE</span>
          </Link>
        </div>

        <div className="sidebar-bottom">
          <div className="analyst">
            <div className="avatar">MC</div>
            <div className="analyst-info">
              <strong>Evaluation Team</strong>
              <span>Security Research Operations</span>
            </div>
          </div>
        </div>
      </aside>

      <section className="content">
        <header className="topbar">
          <div className="crumb">
            <span className="crumb-root">MasterShield</span>
            <span className="crumb-sep">/</span>
            <strong className="crumb-current">{title}</strong>
          </div>
          <div className="top-actions">
            <div className="live">
              <em /> Simulation stream online
            </div>
            <Link href="/demo" className="primary top-demo-btn">
              Launch Judge Demo →
            </Link>
            <div className="top-avatar">MC</div>
          </div>
        </header>

        {children}

        <div className="disclaimer-banner">
          <em>Research Sandbox</em>
          <span>Synthetic defense research environment for Mastercard Innovation Challenge @ GFF 2026. All telemetry, account identifiers, transactions, and attack models are simulated. No live payment credentials are processed.</span>
        </div>
      </section>
    </main>
  );
}


