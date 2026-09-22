export type ImdbEntry = { imdbId: string; title: string; year: number | null; mediaType: "movie" | "tv" | null };

function rowsFromCsv(input: string): string[][] {
  const rows: string[][] = [];
  let row: string[] = [];
  let value = "";
  let quoted = false;
  for (let i = 0; i < input.length; i++) {
    const char = input[i];
    if (char === '"') {
      if (quoted && input[i + 1] === '"') { value += '"'; i++; }
      else if (quoted || value === "") quoted = !quoted;
      else throw new Error("Invalid CSV quoting.");
    } else if (char === "," && !quoted) {
      row.push(value); value = "";
    } else if ((char === "\n" || char === "\r") && !quoted) {
      if (char === "\r" && input[i + 1] === "\n") i++;
      row.push(value); value = "";
      if (row.some((cell) => cell.trim())) rows.push(row);
      row = [];
    } else value += char;
  }
  if (quoted) throw new Error("Unclosed quote in CSV.");
  if (value || row.length) { row.push(value); rows.push(row); }
  return rows;
}

export function parseImdbRatingsCsv(input: string): ImdbEntry[] {
  const rows = rowsFromCsv(input.replace(/^\uFEFF/, ""));
  const headers = rows.shift()?.map((cell) => cell.trim().toLowerCase()) ?? [];
  const column = (...names: string[]) => headers.findIndex((header) => names.includes(header));
  const idColumn = column("const", "title id", "imdb id");
  const urlColumn = column("url");
  const titleColumn = column("title");
  const yearColumn = column("year");
  const typeColumn = column("title type", "type");
  if ((idColumn < 0 && urlColumn < 0) || titleColumn < 0 || column("your rating") < 0) {
    throw new Error("This does not look like an IMDb ratings export. Export Your Ratings as CSV from IMDb.");
  }
  const entries = new Map<string, ImdbEntry>();
  for (const row of rows) {
    const titleType = typeColumn < 0 ? "" : (row[typeColumn] ?? "").trim().toLowerCase();
    if (titleType && !["movie", "tv movie", "tv series", "tv mini series", "tv miniseries"].includes(titleType)) continue;
    const id = (row[idColumn] ?? row[urlColumn] ?? "").match(/tt\d{7,12}/)?.[0];
    const title = (row[titleColumn] ?? "").trim();
    if (!id || !title || title.length > 300) continue;
    const rawYear = yearColumn < 0 ? "" : row[yearColumn]?.trim();
    const year = rawYear && /^\d{4}$/.test(rawYear) ? Number(rawYear) : null;
    const mediaType = titleType === "movie" || titleType === "tv movie" ? "movie"
      : titleType.startsWith("tv series") || titleType.startsWith("tv mini") ? "tv" : null;
    entries.set(id, { imdbId: id, title, year: year && year >= 1870 && year <= 2200 ? year : null, mediaType });
  }
  if (!entries.size) throw new Error("No IMDb titles were found in this file.");
  if (entries.size > 10000) throw new Error("This file has more than 10,000 titles.");
  return [...entries.values()];
}
