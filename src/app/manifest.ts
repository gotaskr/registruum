import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Registruum",
    short_name: "Registruum",
    description: "Operational workspace for spaces, work orders, and documents.",
    start_url: "/m",
    scope: "/m",
    display: "standalone",
    background_color: "#f3f6fb",
    theme_color: "#3566d6",
    orientation: "portrait",
    icons: [
      {
        src: "/icon?size=192",
        sizes: "192x192",
        type: "image/png",
      },
      {
        src: "/icon?size=512",
        sizes: "512x512",
        type: "image/png",
      },
      {
        src: "/apple-icon",
        sizes: "180x180",
        type: "image/png",
      },
    ],
  };
}
