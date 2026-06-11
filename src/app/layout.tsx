import type { Metadata, Viewport } from "next";
import { Inter, JetBrains_Mono, Sora } from "next/font/google";
import { SimulationRunner } from "@/components/SimulationRunner";
import "./globals.css";

const sora = Sora({
  subsets: ["latin"],
  variable: "--font-sora",
  weight: ["400", "600", "700", "800"],
});

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
});

const jetbrains = JetBrains_Mono({
  subsets: ["latin"],
  variable: "--font-jetbrains",
  weight: ["400", "500"],
});

export const metadata: Metadata = {
  title: "CrewDesk — Mission Control",
  description:
    "Pilotez votre équipe d'agents IA depuis un mission control isométrique. Un orchestrateur, cinq spécialistes, zéro friction.",
};

export const viewport: Viewport = {
  themeColor: "#07090E",
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="fr" className={`${sora.variable} ${inter.variable} ${jetbrains.variable}`}>
      <body className="antialiased">
        <SimulationRunner />
        {children}
      </body>
    </html>
  );
}
