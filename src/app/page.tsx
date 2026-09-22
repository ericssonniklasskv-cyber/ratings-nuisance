import Link from "next/link";
import { getViewer } from "@/lib/auth";
import { AppHeader } from "@/components/app-header";
import { LoginForm } from "./login-form";

export default async function Home({ searchParams }: { searchParams: Promise<{ auth_error?: string }> }) {
  const { user, profile } = await getViewer();
  const { auth_error } = await searchParams;
  if (user) return <main className="app-shell">
    <AppHeader admin={profile?.is_admin ?? false} />
    <section className="home-content">
      <p className="eyebrow">YOUR FILM CLUB</p>
      <h1>What will you rate next?</h1>
      <div className="home-actions">
        <Link href="/rate" className="home-action home-action-primary"><span>Rate something</span><span aria-hidden="true">↗</span></Link>
        <Link href="/my-ratings" className="home-action"><span>My Ratings</span><span aria-hidden="true">↗</span></Link>
      </div>
      <p className="home-import-link"><Link href="/imdb">Bring your IMDb watch history →</Link></p>
    </section>
  </main>;

  return <main className="login-shell">
    <div className="login-content">
      <p className="eyebrow">PRIVATE FILM CLUB</p>
      <h1 className="login-wordmark">Nuisance<span>.</span></h1>
      <p className="login-tagline">Movies rated against movies.</p>
      {auth_error && <p role="alert" className="error-message">Sign in failed. Try again or use an email link.</p>}
      <LoginForm />
    </div>
    <footer>Film and TV data from <a href="https://www.themoviedb.org/" target="_blank" rel="noreferrer">TMDb</a>. This product uses the TMDb API but is not endorsed or certified by TMDb.</footer>
  </main>;
}
