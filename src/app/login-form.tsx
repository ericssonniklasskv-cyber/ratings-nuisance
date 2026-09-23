"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/browser";

export function LoginForm() {
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
      setGoogleError("Google sign-in is unavailable. Please try again.");
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
    </div>
  );
}
