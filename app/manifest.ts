import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Planner Familiar",
    short_name: "Planner",
    description: "Planificador diario compartido para toda la familia.",
    start_url: "/",
    display: "standalone",
    background_color: "#f6f7fb",
    theme_color: "#6d5efc",
    icons: [
      {
        src: "/icon.svg",
        sizes: "any",
        type: "image/svg+xml",
        purpose: "any",
      },
    ],
  };
}
