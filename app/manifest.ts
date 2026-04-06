import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Meet & Moc",
    short_name: "MeetMoc",
    description: "Smart event coordination with friend-first scheduling.",
    start_url: "/",
    scope: "/",
    display: "standalone",
    background_color: "#fff8f3",
    theme_color: "#ff6b4a",
    lang: "ja",
    icons: [
      {
        src: "/pwa-icon.svg",
        sizes: "any",
        type: "image/svg+xml",
        purpose: "maskable",
      },
      {
        src: "/line_120.png",
        sizes: "120x120",
        type: "image/png",
      },
    ],
  };
}
