import { MetadataRoute } from "next";
import { getPublicEvents } from "@/lib/api/events/public";

const baseUrl = process.env["NEXT_PUBLIC_APP_URL"] || "https://gameone.cz";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  // Fetch all published events
  // In a real app with thousands of events, we might want to limit this or use a sitemap index
  const eventsData = await getPublicEvents({ limit: 1000 });
  const events = eventsData?.data || [];

  const eventUrls = events.map((event) => ({
    url: `${baseUrl}/events/${event.id}`,
    lastModified: event.updatedAt,
    changeFrequency: "daily" as const,
    priority: 0.7,
  }));

  return [
    {
      url: baseUrl,
      lastModified: new Date(),
      changeFrequency: "daily",
      priority: 1,
    },
    {
      url: `${baseUrl}/events`,
      lastModified: new Date(),
      changeFrequency: "daily",
      priority: 0.8,
    },
    ...eventUrls,
  ];
}
