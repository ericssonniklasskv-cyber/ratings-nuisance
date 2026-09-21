"use client";

import { useActionState } from "react";
import { sendMagicLink } from "./actions";

export function LoginForm() {
  const [state, action, pending] = useActionState(sendMagicLink, { message: "" });
  return (
    <form action={action} className="login-form">
      <label htmlFor="email">E-postadress</label>
      <div className="login-row">
        <input id="email" name="email" type="email" autoComplete="email" placeholder="du@exempel.se" required />
        <button className="button primary" disabled={pending}>{pending ? "Skickar…" : "Skicka länk"}</button>
      </div>
      {state.message && <p role="status" className="form-message">{state.message}</p>}
    </form>
  );
}
