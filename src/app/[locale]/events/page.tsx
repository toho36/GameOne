import { getCurrentUser } from "@/lib/kinde-auth";
import { redirect } from "next/navigation";
import { EventManagementDashboard } from "@/components/features/events/event-management-dashboard";
import { logger } from "@/lib/logger";

export default async function EventsPage() {
  try {
    const user = await getCurrentUser();

    // If no user, redirect to login
    if (!user) {
      redirect("/api/auth/login");
    }

    return (
      <main className="min-h-screen bg-gray-50">
        <div className="container mx-auto px-4 py-8">
          <EventManagementDashboard />
        </div>
      </main>
    );
  } catch (error) {
    logger.error("Error on events page:", error);
    // Fallback for error or unauthenticated state
    redirect("/api/auth/login");
  }
}
