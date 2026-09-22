import { AppHeader } from "@/components/app-header";

export default function TitleLoading() {
  return <main className="app-shell loading-shell" aria-label="Loading title">
    <AppHeader />
    <div className="skeleton-line" /><div className="worth-feature" aria-hidden="true"><div className="skeleton-poster" /><div className="skeleton-line wide" /></div>
    <div className="skeleton-line wide" />
  </main>;
}
