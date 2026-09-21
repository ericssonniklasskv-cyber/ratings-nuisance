export type MediaType = "movie" | "tv";
export type TmdbTitle = {
  tmdbId: number;
  mediaType: MediaType;
  title: string;
  posterPath: string | null;
  releaseYear: number | null;
};

type RawTitle = {
  id?: number;
  media_type?: string;
  title?: string;
  name?: string;
  poster_path?: string | null;
  release_date?: string;
  first_air_date?: string;
};

function normalize(item: RawTitle, mediaType: MediaType): TmdbTitle | null {
  const title = mediaType === "movie" ? item.title : item.name;
  if (!Number.isInteger(item.id) || !title) return null;
  const date = mediaType === "movie" ? item.release_date : item.first_air_date;
  const year = date && /^\d{4}/.test(date) ? Number(date.slice(0, 4)) : null;
  return {
    tmdbId: item.id!, mediaType, title,
    posterPath: item.poster_path || null,
    releaseYear: year,
  };
}

async function tmdbFetch(path: string) {
  const token = process.env.TMDB_READ_ACCESS_TOKEN;
  if (!token) throw new Error("TMDb is not configured.");
  const response = await fetch(`https://api.themoviedb.org/3${path}`, {
    headers: { Authorization: `Bearer ${token}`, Accept: "application/json" },
    cache: "no-store",
  });
  if (!response.ok) throw new Error("TMDb is temporarily unavailable.");
  return response.json();
}

export async function searchTmdb(query: string): Promise<TmdbTitle[]> {
  const params = new URLSearchParams({ query, include_adult: "false", language: "en-US", page: "1" });
  const data = await tmdbFetch(`/search/multi?${params}`);
  return (data.results as RawTitle[])
    .filter((item) => item.media_type === "movie" || item.media_type === "tv")
    .map((item) => normalize(item, item.media_type as MediaType))
    .filter((item): item is TmdbTitle => item !== null);
}

export async function getTmdbTitle(type: MediaType, id: number): Promise<TmdbTitle | null> {
  try {
    const data = await tmdbFetch(`/${type}/${id}?language=en-US`);
    return normalize(data, type);
  } catch {
    return null;
  }
}

export function posterUrl(path: string | null) {
  return path ? `https://image.tmdb.org/t/p/w342${path}` : null;
}
