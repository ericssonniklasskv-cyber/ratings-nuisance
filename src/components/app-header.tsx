"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { signOut } from "@/app/actions";

export function AppHeader({ admin = false }: { admin?: boolean }) {
  const pathname = usePathname();
  const links = [
    { href: "/rate", label: "Rate", active: pathname.startsWith("/rate") },
    { href: "/my-ratings", label: "My Ratings", active: pathname.startsWith("/my-ratings") },
  ];

  return <>
    <header className="app-header">
      <Link href="/" className="wordmark" aria-label="Nuisance home">Nuisance<span>.</span></Link>
      <nav className="desktop-nav" aria-label="Main navigation">
        {links.map((link) => <Link key={link.href} href={link.href} aria-current={link.active ? "page" : undefined}>{link.label}</Link>)}
      </nav>
      <details className="account-menu">
        <summary>Account</summary>
        <div className="account-options">
          <Link href="/imdb">IMDb import</Link>
          {admin && <Link href="/admin/references">References</Link>}
          <form action={signOut}><button type="submit">Sign out</button></form>
        </div>
      </details>
    </header>
    <nav className="mobile-nav" aria-label="Mobile navigation">
      {links.map((link) => <Link key={link.href} href={link.href} aria-current={link.active ? "page" : undefined}>{link.label}</Link>)}
      <button type="button" onClick={() => { document.querySelector<HTMLDetailsElement>(".account-menu")?.setAttribute("open", ""); document.querySelector<HTMLElement>(".account-menu summary")?.focus(); }}>Account</button>
    </nav>
  </>;
}
