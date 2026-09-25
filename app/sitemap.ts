import type { MetadataRoute } from "next";
import { getMetadataBaseUrl } from "@/lib/site-url";

export default function sitemap(): MetadataRoute.Sitemap {
  const baseUrl = getMetadataBaseUrl();

  return [
    {
      url: baseUrl.toString(),
      lastModified: new Date(),
      changeFrequency: "daily",
      priority: 1,
    },
  ];
}
