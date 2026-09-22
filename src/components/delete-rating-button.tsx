"use client";

import { useActionState } from "react";
import { deleteRating } from "@/app/rate/actions";

export function DeleteRatingButton({ id, title }: { id: string; title: string }) {
  const [state, action, pending] = useActionState(deleteRating, { error: "" });
  return <div className="delete-control"><form action={action} onSubmit={(event) => { if (!window.confirm(`Delete your rating for ${title}?`)) event.preventDefault(); }}>
    <input type="hidden" name="ratingId" value={id} />
    <button className="text-button danger" disabled={pending} aria-label={`Delete rating for ${title}`}>{pending ? "Deleting…" : "Delete"}</button>
  </form>{state.error && <span role="alert" className="error-message">{state.error}</span>}</div>;
}
