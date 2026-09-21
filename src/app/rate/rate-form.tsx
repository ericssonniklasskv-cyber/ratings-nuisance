"use client";

import { useActionState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { saveRating } from "./actions";
import type { MediaType } from "@/lib/tmdb";

export function RateForm({ type, id, current }: { type: MediaType; id: number; current: number | null }) {
  const router = useRouter();
  const [state, action, pending] = useActionState(saveRating, { message: "", saved: false });
  useEffect(() => { if (state.saved) router.refresh(); }, [state.saved, router]);
  return <form action={action} className="rating-form">
    <input type="hidden" name="type" value={type} />
    <input type="hidden" name="id" value={id} />
    <label htmlFor="score">Ditt betyg</label>
    <div className="rating-control"><input id="score" name="score" type="number" step="0.1" min="0" max="10" defaultValue={current ?? ""} placeholder="7.8" required /><span>/ 10</span><button className="button primary" disabled={pending}>{pending ? "Sparar…" : current === null ? "Spara betyg" : "Uppdatera betyg"}</button></div>
    <p className="small muted">0 = särskild bottenmarkering · 1 = inte sevärd · 2–10 = sevärd. Använd högst en decimal.</p>
    {state.message && <p role="status" className={state.saved ? "success-message" : "error-message"}>{state.message}</p>}
  </form>;
}
