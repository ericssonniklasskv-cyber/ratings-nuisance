import { AppHeader } from "@/components/app-header";

export default function TitleLoading() {
  return <main className="app-shell title-loading" aria-label="Loading title">
    <AppHeader />
    <div className="title-loading-layout" aria-hidden="true">
      <div className="skeleton-poster" />
      <div className="title-loading-content"><div className="skeleton-line" /><div className="skeleton-line wide" /><div className="title-loading-ratings"><div className="skeleton-line wide" /><div className="skeleton-line wide" /></div></div>
    </div>
  </main>;
}
