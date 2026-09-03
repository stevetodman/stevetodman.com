import type { MetadataRoute } from "next";

export const dynamic = "force-static";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Pediatric Hospital",
    short_name: "Peds Hospital",
    description: "An immersive pediatric clinical reasoning simulation.",
    start_url: "/hospital/",
    scope: "/hospital/",
    display: "standalone",
    orientation: "any",
    background_color: "#0b1215",
    theme_color: "#0b1215",
    icons: [
      {
        src: "/hospital/hospital-icon.svg",
        sizes: "any",
        type: "image/svg+xml",
      },
    ],
  };
}
