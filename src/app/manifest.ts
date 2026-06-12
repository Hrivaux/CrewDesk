import type { MetadataRoute } from "next";

/** Manifest PWA : permet d'ajouter CrewDesk à l'écran d'accueil (mobile). */
export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "CrewDesk — Mission Control",
    short_name: "CrewDesk",
    description:
      "Pilotez votre équipe d'agents IA depuis un mission control isométrique.",
    start_url: "/",
    display: "standalone",
    background_color: "#07090E",
    theme_color: "#07090E",
    icons: [
      { src: "/icon.svg", sizes: "any", type: "image/svg+xml" },
    ],
  };
}
