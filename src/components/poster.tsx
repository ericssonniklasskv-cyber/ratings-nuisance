import Image from "next/image";
import { posterUrl } from "@/lib/tmdb";

export function Poster({ path, title, priority = false }: { path: string | null; title: string; priority?: boolean }) {
  const src = posterUrl(path);
  return <div className="poster">
    {src ? <Image src={src} alt={`Poster: ${title}`} fill sizes="(max-width: 640px) 40vw, 170px" priority={priority} /> : <span className="poster-empty">NO POSTER</span>}
  </div>;
}
