import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Gestion d'Invités Radio",
  description: "Système de gestion d'invités pour émissions radio",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="fr">
      <body>{children}</body>
    </html>
  );
}
