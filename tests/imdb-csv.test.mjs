import test from "node:test";
import assert from "node:assert/strict";
import { parseImdbRatingsCsv } from "../src/lib/imdb-csv.ts";

test("imports movie and series titles, ignores episodes and IMDb scores", () => {
  const csv = `Const,Your Rating,Date Rated,Title,Title Type,Year
tt1375666,10,2020-01-01,Inception,Movie,2010
tt0903747,9,2020-01-02,Breaking Bad,TV Series,2008
tt0959621,8,2020-01-03,Pilot,TV Episode,2008`;
  assert.deepEqual(parseImdbRatingsCsv(csv), [
    { imdbId: "tt1375666", title: "Inception", year: 2010, mediaType: "movie" },
    { imdbId: "tt0903747", title: "Breaking Bad", year: 2008, mediaType: "tv" },
  ]);
});

test("handles BOM, quoted comma, duplicate title and URL id", () => {
  const csv = '\uFEFFYour Rating,Title,URL,Title Type,Year\r\n7,"A, Film",https://www.imdb.com/title/tt1234567/,Movie,2001\r\n8,"A, Film",https://www.imdb.com/title/tt1234567/,Movie,2001';
  assert.deepEqual(parseImdbRatingsCsv(csv), [
    { imdbId: "tt1234567", title: "A, Film", year: 2001, mediaType: "movie" },
  ]);
});

test("rejects non-rating export", () => {
  assert.throws(() => parseImdbRatingsCsv("Title,URL\nTest,tt1234567"), /ratings export/);
});
