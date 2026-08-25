"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import type { ReactNode } from "react";

const nav = [
  ["Overview", "/", "⌘"], ["Attack Library", "/attack-library", "◈"], ["Red Team Simulator", "/simulator", "ϟ"], ["Generated Data", "/", "▣"], ["Detection Lab", "/", "◌"], ["Investigation Center", "/", "⌕"],
];

export function AppShell({ children, title = "Attack Library" }: { children: ReactNode; title?: string }) {
  const pathname = usePathname();
  return <main className="shell library-shell">
    <aside className="sidebar">
      <Link className="brand" href="/"><div className="brand-mark"><span/><span/><span/></div><span>agentshield</span></Link>
      <div className="workspace"><span>WORKSPACE</span><button>Mastercard India <span>⌄</span></button></div>
      <nav>{nav.slice(0, 5).map(([label, href, icon]) => <Link key={label} href={href} className={`nav-item ${pathname === href || (href !== "/" && pathname.startsWith(href)) ? "active" : ""}`}><b className="nav-glyph">{icon}</b><span>{label}</span>{label === "Red Team Simulator" && <i>NEW</i>}</Link>)}</nav>
      <div className="nav-divider" />
      <Link href="/" className="nav-item"><b className="nav-glyph">⌕</b><span>Investigation Center</span><b className="nav-count">12</b></Link>
      <div className="sidebar-bottom"><button className="nav-item"><b className="nav-glyph">⚙</b><span>Settings</span></button><div className="analyst"><div className="avatar">AM</div><div><strong>Ananya Mehra</strong><span>Security Analyst</span></div><span>⌄</span></div></div>
    </aside>
    <section className="content">
      <header className="topbar"><div className="crumb"><span>AgentShield</span><i>/</i><strong>{title}</strong></div><div className="top-actions"><div className="live"><em/> All systems operational</div><button className="icon-btn" aria-label="Notifications">♧<small>3</small></button><div className="top-avatar">AM</div></div></header>
      {children}
    </section>
  </main>;
}
