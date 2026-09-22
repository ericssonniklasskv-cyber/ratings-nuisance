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
      setGoogleError("Google sign-in is unavailable. Try an email link instead.");
      setGooglePending(false);
    }
  }

  return (
    <div className="login-options">
      <button type="button" className="button google-button" onClick={continueWithGoogle} disabled={googlePending}>
        <span className="google-mark" aria-hidden="true">G</span>
        {googlePending ? "Opening Google…" : "Continue with Google"}
      </button>
      {googleError && <p role="alert" className="error-message">{googleError}</p>}
      <details className="email-option"><summary>Use email instead</summary>
      <form action={action} className="login-form">
        <label htmlFor="email">Email address</label>
        <div className="login-row">
          <input id="email" name="email" type="email" autoComplete="email" placeholder="you@example.com" required />
          <button className="button secondary" disabled={pending}>{pending ? "Sending…" : "Send link"}</button>
        </div>
        {state.message && <p role="status" className="form-message">{state.message}</p>}
      </form></details>
    </div>
  );
}
