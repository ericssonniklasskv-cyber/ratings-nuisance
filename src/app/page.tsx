import Link from "next/link";
import { getViewer } from "@/lib/auth";
import { LoginForm } from "./login-form";
import { signOut } from "./actions";

export default async function Home({ searchParams }: { searchParams: Promise<{ auth_error?: string }> }) {
  const { user, profile } = await getViewer();
  const { auth_error } = await searchParams;
  return (
    <main className="home-shell">
      <div className="eyebrow">PRIVATE FILM CLUB</div>
      <h1 className="brand-title">Nuisance<span className="brand-dot">.</span></h1>
      {!user ? (
        <section className="intro-card">
          <p className="kicker">EN ANNAN SORTS FILMSKALA</p>
          <h2>Vad är något värt att se?</h2>
          <p className="muted">Logga in med Google eller e-postlänk för att sätta betyg och se gruppens omdömen.</p>
          {auth_error && <p role="alert" className="error-message">Inloggningen kunde inte slutföras. Försök igen eller använd e-postlänken.</p>}
          <LoginForm />
          <p className="small muted">Nya konton behöver godkännas innan de får tillgång till gruppen.</p>
        </section>
      ) : !profile?.is_active ? (
        <section className="intro-card">
          <p className="kicker">INLOGGAD</p>
          <h2>Väntar på godkännande</h2>
          <p className="muted">Kontot är skapat. En administratör behöver ge dig tillgång till gruppen.</p>
          <form action={signOut}><button className="button subtle">Logga ut</button></form>
        </section>
      ) : (
        <section className="dashboard">
          <div className="welcome-row"><div><p className="kicker">VÄLKOMMEN TILLBAKA</p><h2>Hej, {profile.display_name}</h2></div><form action={signOut}><button className="text-button">Logga ut</button></form></div>
          <div className="choice-grid">
            <Link href="/rate" className="choice-card rate-choice"><span className="choice-number">01 / DISCOVER</span><span className="choice-label">Rate <span aria-hidden>↗</span></span><span className="choice-description">Hitta en film eller serie och sätt ditt betyg.</span></Link>
            <Link href="/my-ratings" className="choice-card ratings-choice"><span className="choice-number">02 / YOUR COLLECTION</span><span className="choice-label">My Ratings <span aria-hidden>↗</span></span><span className="choice-description">Se vad du har sett och hur du rankat det.</span></Link>
          </div>
          {profile.is_admin && <p className="admin-link"><Link href="/admin/references">Hantera referenstitlar →</Link></p>}
        </section>
      )}
      <footer>Film- och seriedata från <a href="https://www.themoviedb.org/" target="_blank" rel="noreferrer">TMDb</a>. This product uses the TMDb API but is not endorsed or certified by TMDb.</footer>
    </main>
  );
}
