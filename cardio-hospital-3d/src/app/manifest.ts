import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Pediatric Hospital",
    short_name: "Peds Hospital",
    description: "An immersive pediatric clinical reasoning simulation.",
    start_url: "/",
    display: "standalone",
    orientation: "any",
    background_color: "#0b1215",
    theme_color: "#0b1215",
    icons: [
      {
        src: "/hospital-icon.svg",
        sizes: "any",
        type: "image/svg+xml",
      },
    ],
  };
}
