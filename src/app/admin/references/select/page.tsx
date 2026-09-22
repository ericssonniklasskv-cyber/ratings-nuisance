import { notFound } from "next/navigation";
import Link from "next/link";
import { AppHeader } from "@/components/app-header";
import { TitleSearch } from "@/components/title-search";
import { requireAdmin } from "@/lib/auth";

export default async function SelectReferencePage({ searchParams }: { searchParams: Promise<{ score?: string }> }) {
  await requireAdmin();
  const score = Number((await searchParams).score);
  if (!Number.isInteger(score) || score < 2 || score > 10) notFound();
  return <main className="app-shell"><AppHeader admin /><Link className="back-link" href="/admin/references">← References</Link><div className="page-heading"><p className="kicker">REFERENCE {score}</p><h1>Choose a title</h1><p className="muted">Choose the movie or show that represents {score}.</p></div><TitleSearch mode="reference" referenceScore={score} /></main>;
}
