import { AppHeader } from "@/components/app-header";

export default function TitleLoading() {
  return <main className="app-shell loading-shell" aria-label="Loading title">
    <AppHeader />
    <div className="skeleton-line" /><div className="title-hero"><div className="title-hero-poster skeleton-poster" /><div className="skeleton-line wide" /></div>
    <div className="comparison-pair" aria-hidden="true"><div className="skeleton-poster" /><span /><div className="skeleton-poster" /></div>
    <div className="skeleton-line wide" />
  </main>;
}
