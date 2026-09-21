"use server";

import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

export async function sendMagicLink(_state: { message: string }, formData: FormData) {
  const email = String(formData.get("email") || "").trim();
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return { message: "Ange en giltig e-postadress." };
  const origin = (await headers()).get("origin");
  if (!origin) return { message: "Kunde inte avgöra appens adress." };
  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithOtp({
    email,
    options: { emailRedirectTo: `${origin}/auth/callback`, shouldCreateUser: true },
  });
  return { message: error ? "Kunde inte skicka länken. Försök igen." : "Kolla din inkorg efter inloggningslänken." };
}

export async function signOut() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect("/");
}
