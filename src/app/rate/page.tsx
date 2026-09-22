import { AppHeader } from "@/components/app-header";
import { TitleSearch } from "@/components/title-search";
import { requireMember } from "@/lib/auth";

export default async function RatePage() {
  const { profile } = await requireMember();
  return <main className="app-shell">
    <AppHeader admin={profile?.is_admin ?? false} />
    <div className="page-heading"><p className="kicker">DISCOVER</p><h1>Rate</h1></div>
    <TitleSearch />
  </main>;
}
