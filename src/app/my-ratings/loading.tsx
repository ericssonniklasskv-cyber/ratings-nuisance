import { AppHeader } from "@/components/app-header";

export default function RatingsLoading() {
  return <main className="app-shell loading-shell" aria-label="Loading ratings">
    <AppHeader />
    <div className="skeleton-line" /><div className="skeleton-line wide" />
    <div className="search-skeleton" aria-hidden="true">{[1, 2, 3].map((item) => <div className="result-skeleton" key={item}><span /><i /></div>)}</div>
  </main>;
}
