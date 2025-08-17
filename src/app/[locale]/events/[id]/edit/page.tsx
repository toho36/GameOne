import { getCurrentUser } from "@/lib/kinde-auth";
import { redirect } from "next/navigation";
import { EventEditForm } from "@/components/features/events/event-edit-form";
import { logger } from "@/lib/logger";

interface EditEventPageProps {
  params: {
    id: string;
    locale: string;
  };
}

export default async function EditEventPage({ params }: EditEventPageProps) {
  try {
    const user = await getCurrentUser();

    // If no user, redirect to login
    if (!user) {
      redirect("/api/auth/login");
    }

    // Fetch event data
    const response = await fetch(`${process.env["NEXT_PUBLIC_APP_URL"]}/api/events/${params.id}`, {
      // No need for Authorization header as this is a server-side fetch
    });

    if (!response.ok) {
      if (response.status === 404) {
        redirect("/events");
      }
      throw new Error("Failed to fetch event");
    }

    const { event } = await response.json();

    // Check if user is the creator of the event
    if (event.creatorId !== user.id) {
      redirect("/events");
    }

    return (
      <main className="min-h-screen bg-gray-50">
        <EventEditForm
          event={event}
          locale={params.locale}
          bankAccounts={[]} // TODO: Fetch bank accounts
          categories={[]} // TODO: Fetch categories
        />
      </main>
    );
  } catch (error) {
    logger.error("Error on edit event page:", error);
    // Fallback for error or unauthenticated state
    redirect("/api/auth/login");
  }
}
