import { getViewer } from "@/lib/auth";
import { parseImdbRatingsCsv } from "@/lib/imdb-csv";

export async function POST(request: Request) {
  const { supabase, user } = await getViewer();
  if (!user) return Response.json({ error: "Not authorized." }, { status: 401 });
  if (Number(request.headers.get("content-length")) > 3_000_000) {
    return Response.json({ error: "The CSV must be smaller than 3 MB." }, { status: 413 });
  }
  try {
    const form = await request.formData();
    const file = form.get("file");
    if (!(file instanceof File) || file.size > 3_000_000) {
      return Response.json({ error: "Choose an IMDb CSV file smaller than 3 MB." }, { status: 400 });
    }
    const entries = parseImdbRatingsCsv(await file.text());
    for (let offset = 0; offset < entries.length; offset += 200) {
      const { error } = await supabase.from("imdb_imports").upsert(
        entries.slice(offset, offset + 200).map((entry) => ({
          user_id: user.id, imdb_id: entry.imdbId,
          source_title: entry.title, source_year: entry.year, source_media_type: entry.mediaType,
        })),
        { onConflict: "user_id,imdb_id", ignoreDuplicates: true },
      );
      if (error) throw new Error("Could not save the IMDb titles. Try again.");
    }
    return Response.json({ imported: entries.length });
  } catch (error) {
    return Response.json({ error: error instanceof Error ? error.message : "Could not read the file." }, { status: 400 });
  }
}
