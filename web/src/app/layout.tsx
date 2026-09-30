import type { Metadata } from "next";
import { Caprasimo, Figtree } from "next/font/google";
import "./globals.css";

const caprasimo = Caprasimo({
  variable: "--font-titulo",
  weight: "400",
  subsets: ["latin"],
});

const figtree = Figtree({
  variable: "--font-corpo",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Lella Dolci - Controle de Vendas",
  description: "Sistema de controle de vendas e CRM da confeitaria Lella Dolci",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pt-BR" className={`${caprasimo.variable} ${figtree.variable}`}>
      <body className="min-h-screen bg-fundo text-texto font-corpo antialiased">{children}</body>
    </html>
  );
}
