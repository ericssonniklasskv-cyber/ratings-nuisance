import Link from "next/link";

export function AppHeader({ admin = false }: { admin?: boolean }) {
  return <header className="app-header">
    <Link href="/" className="wordmark">Nuisance<span>.</span></Link>
    <nav aria-label="Huvudmeny">
      <Link href="/rate">Rate</Link>
      <Link href="/my-ratings">My Ratings</Link>
      {admin && <Link href="/admin/references">References</Link>}
    </nav>
  </header>;
}
