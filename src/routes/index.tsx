import { createFileRoute, redirect } from "@tanstack/react-router";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Crop Disease Detection" },
      { name: "description", content: "Scan crop leaves and detect diseases instantly." },
      { property: "og:title", content: "Crop Disease Detection" },
      { property: "og:description", content: "Scan crop leaves and detect diseases instantly." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  beforeLoad: () => {
    throw redirect({ href: "/site/index.html" });
  },
});
