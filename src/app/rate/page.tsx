import { AppHeader } from "@/components/app-header";
import { TitleSearch } from "@/components/title-search";
import { requireMember } from "@/lib/auth";

export default async function RatePage() {
  const { profile } = await requireMember();
  return <main className="app-shell">
    <AppHeader admin={profile?.is_admin ?? false} />
    <div className="page-heading"><p className="kicker">01 / DISCOVER</p><h1>Rate</h1><p className="muted">Börja med en film eller serie. Ditt betyg kan du alltid ändra senare.</p></div>
    <TitleSearch />
  </main>;
}
