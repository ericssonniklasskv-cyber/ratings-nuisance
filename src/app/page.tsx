import Link from "next/link";
import Image from "next/image";
import { getViewer } from "@/lib/auth";
import { AppHeader } from "@/components/app-header";
import { LoginForm } from "./login-form";
import { GatekeeperIntro } from "./gatekeeper-intro";

export default async function Home({ searchParams }: { searchParams: Promise<{ auth_error?: string }> }) {
  const { user, profile } = await getViewer();
  const { auth_error } = await searchParams;
  if (user) return <main className="app-shell">
    <AppHeader admin={profile?.is_admin ?? false} />
    <section className="home-content">
      <h1 className="visually-hidden">Home</h1>
      <Image className="home-symbol" src="/branding/nuisance-face.webp" alt="Golden face symbol" width={420} height={565} sizes="(max-width: 353px) 120px, (max-width: 700px) 34vw, 164px" priority />
      <div className="home-actions">
        <Link href="/rate" className="home-action">Gandalf</Link>
        <Link href="/my-ratings" className="home-action">Sazed</Link>
      </div>
      <p className="home-import-link"><Link href="/my-ratings?tab=to-rate">John A. Roebling →</Link></p>
    </section>
  </main>;

  return <GatekeeperIntro diagnosticsEnabled={process.env.VERCEL_ENV === "preview"}>
    <main className="login-shell">
    <div className="login-content">
      <h1 className="login-wordmark">nuisance</h1>
      {auth_error && <p role="alert" className="error-message">Sign in failed. Please try Google again.</p>}
      <LoginForm />
    </div>
    <footer>Film and TV data from <a href="https://www.themoviedb.org/" target="_blank" rel="noreferrer">TMDb</a>. This product uses the TMDb API but is not endorsed or certified by TMDb.</footer>
    </main>
  </GatekeeperIntro>;
}
