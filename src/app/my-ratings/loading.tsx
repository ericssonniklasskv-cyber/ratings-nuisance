import { AppHeader } from "@/components/app-header";

export default function RatingsLoading() {
  return <main className="app-shell" aria-label="Loading ratings">
    <AppHeader />
    <div className="my-ratings-library library-loading" aria-hidden="true">
      <div className="library-heading"><div className="skeleton-line wide" /><div className="skeleton-line" /></div>
      <div className="library-controls"><div className="library-control-skeleton" /><div className="library-control-skeleton" /></div>
      <div className="library-grid">{Array.from({ length: 10 }, (_, index) => <div className="library-card-skeleton" key={index}><div /><span /><span /></div>)}</div>
    </div>
  </main>;
}
