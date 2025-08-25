import { Suspense } from "react";
import { notFound } from "next/navigation";
import { Link } from "@/i18n/navigation";
import { EventDetail } from "@/components/features/events/event-detail";
import { EventRegistration } from "@/components/features/events/event-registration";
import { LoadingSpinner } from "@/components/ui/loading-spinner";
import { getPublicEventById } from "@/lib/api/events/public";

interface EventPageProps {
  params: {
    id: string;
  };
}

export default async function EventPage({ params }: EventPageProps) {
  try {
    const event = await getPublicEventById(params.id);

    if (!event) {
      notFound();
    }

    return (
      <main className="container mx-auto px-4 py-8">
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
        </Suspense>
      </main>
    );
  } catch {
    notFound();
  }
}
