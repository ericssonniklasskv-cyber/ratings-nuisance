import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Nuisance — Private Film Club",
  description: "Private ratings for films and TV, shared with friends.",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="en"><body>{children}</body></html>;
}
