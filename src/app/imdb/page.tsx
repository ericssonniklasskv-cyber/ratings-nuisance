import { redirect } from "next/navigation";

export default function ImdbPage() {
  redirect("/my-ratings?tab=to-rate");
}
