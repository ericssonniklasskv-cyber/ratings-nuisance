"use client";

import { useActionState, useState } from "react";
import { createClient } from "@/lib/supabase/browser";
import { sendMagicLink } from "./actions";

export function LoginForm() {
  const [state, action, pending] = useActionState(sendMagicLink, { message: "" });
  const [googlePending, setGooglePending] = useState(false);
  const [googleError, setGoogleError] = useState("");

  async function continueWithGoogle() {
    setGooglePending(true);
    setGoogleError("");
    const supabase = createClient();
    const { error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: { redirectTo: `${window.location.origin}/auth/callback` },
    });
    if (error) {
      setGoogleError("Google-inloggning är inte tillgänglig just nu. Använd e-postlänken tills vidare.");
      setGooglePending(false);
    }
  }

  return (
    <div className="login-options">
      <button type="button" className="button google-button" onClick={continueWithGoogle} disabled={googlePending}>
        <span className="google-mark" aria-hidden="true">G</span>
        {googlePending ? "Öppnar Google…" : "Continue with Google"}
      </button>
      {googleError && <p role="alert" className="error-message">{googleError}</p>}
      <div className="login-divider"><span>eller med e-postlänk</span></div>
      <form action={action} className="login-form">
        <label htmlFor="email">E-postadress</label>
        <div className="login-row">
          <input id="email" name="email" type="email" autoComplete="email" placeholder="du@exempel.se" required />
          <button className="button primary" disabled={pending}>{pending ? "Skickar…" : "Skicka länk"}</button>
        </div>
        {state.message && <p role="status" className="form-message">{state.message}</p>}
      </form>
    </div>
  );
}
