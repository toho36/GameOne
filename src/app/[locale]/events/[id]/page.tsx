import { Suspense } from "react";
import { notFound } from "next/navigation";
import { Link } from "@/i18n/navigation";
import { EventDetail } from "@/components/features/events/event-detail";
import { EventRegistration } from "@/components/features/events/event-registration";
import { RegisteredUsersList } from "@/components/features/events/registered-users-list";
import { LoadingSpinner } from "@/components/ui/loading-spinner";
import { getPublicEventById } from "@/lib/api/events/public";
import type { Metadata } from "next";

interface EventPageProps {
  params: Promise<{
    id: string;
    locale: string;
  }>;
}

export async function generateMetadata({ params }: EventPageProps): Promise<Metadata> {
  const { id } = await params;
  const event = await getPublicEventById(id);

  if (!event) {
    return {
      title: "Event Not Found",
    };
  }

  return {
    title: event.title,
    description: event.shortDescription || event.description?.substring(0, 160),
    openGraph: {
      title: event.title,
      description: event.shortDescription || event.description?.substring(0, 160),
      type: "website",
    },
  };
}

export default async function EventPage({ params }: EventPageProps) {
  const { id } = await params;

  try {
    const event = await getPublicEventById(id);

    if (!event) {
      notFound();
    }

    const jsonLd = {
      "@context": "https://schema.org",
      "@type": "Event",
      name: event.title,
      description: event.description,
      startDate: event.startDate.toISOString(),
      endDate: event.endDate?.toISOString(),
      eventStatus: "https://schema.org/EventScheduled",
      eventAttendanceMode: "https://schema.org/OfflineEventAttendanceMode",
      location: {
        "@type": "Place",
        name: event.venue,
        address: {
          "@type": "PostalAddress",
          streetAddress: event.venue, // Assuming venue string contains address for now
        },
      },
      offers: {
        "@type": "Offer",
        price: event.price || 0,
        priceCurrency: event.currency || "CZK",
        availability:
          event.availableSpots && event.availableSpots > 0
            ? "https://schema.org/InStock"
            : "https://schema.org/SoldOut",
        url: `https://gameone.cz/events/${event.id}`, // Replace with actual domain
      },
      organizer: {
        "@type": "Organization",
        name: "GameOne",
        url: "https://gameone.cz",
      },
    };

    return (
      <main className="container mx-auto px-4 py-8">
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />

        {/* Breadcrumb Navigation */}
        <nav className="mb-6" aria-label="Breadcrumb">
          <ol className="flex items-center space-x-2 text-sm text-gray-500">
            <li>
              <Link href="/" className="hover:text-gray-700 hover:underline">
                Home
              </Link>
            </li>
            <li className="flex items-center">
              <span className="mx-2">/</span>
              <Link href="/events" className="hover:text-gray-700 hover:underline">
                Events
              </Link>
            </li>
            <li className="flex items-center">
              <span className="mx-2">/</span>
              <span className="font-medium text-gray-900">{event.title}</span>
            </li>
          </ol>
        </nav>

        <Suspense fallback={<LoadingSpinner />}>
          <EventDetail event={event} />
          <EventRegistration event={event} />
          <div className="mt-6">
            <RegisteredUsersList eventId={event.id} />
          </div>
        </Suspense>
      </main>
    );
  } catch {
    notFound();
  }
}
