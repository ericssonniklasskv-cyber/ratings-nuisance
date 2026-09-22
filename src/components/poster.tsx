import Image from "next/image";
import { posterUrl } from "@/lib/tmdb";

type PosterSize = "search" | "comparison" | "list" | "detail" | "reference" | "collection";
const sizes: Record<PosterSize, string> = {
  search: "(max-width: 700px) 64px, 72px",
  comparison: "(max-width: 700px) 33vw, 175px",
  list: "(max-width: 700px) 64px, 72px",
  detail: "(max-width: 700px) 105px, 210px",
  reference: "52px",
  collection: "(max-width: 700px) calc((100vw - 44px) / 2), (max-width: 1000px) calc((100vw - 112px) / 4), 195px",
};

export function Poster({ path, title, priority = false, size = "search" }: { path: string | null; title: string; priority?: boolean; size?: PosterSize }) {
  const src = posterUrl(path, size === "search" || size === "list" || size === "reference" ? "w185" : "w342");
  return <div className="poster">
    {src ? <Image src={src} alt="" fill sizes={sizes[size]} priority={priority} /> : <span className="poster-empty" aria-label={`No poster for ${title}`}>No poster</span>}
  </div>;
}
