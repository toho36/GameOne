import { redirect, notFound } from "next/navigation";
import { getKindeServerSession } from "@kinde-oss/kinde-auth-nextjs/server";

import { prisma } from "@/lib/prisma";
import { EventCreationForm } from "@/components/features/events/creation";
import { EventCreationFormData } from "@/types/event";

interface EditEventPageProps {
  params: {
    id: string;
  };
}

export default async function EditEventPage({ params }: EditEventPageProps) {
  const { getUser } = getKindeServerSession();
  const user = await getUser();

  if (!user) {
    redirect("/api/auth/login");
  }

  // Get user from database
  const dbUser = await prisma.user.findUnique({
    where: { kindeId: user.id },
  });

  if (!dbUser) {
    redirect("/api/auth/login");
  }

  // Get event and check permissions
  const event = await prisma.event.findUnique({
    where: { id: params.id },
    include: {
      bankAccount: {
        select: { id: true, name: true },
      },
    },
  });

  if (!event) {
    notFound();
  }

  // Check if user has permission to edit
  if (event.creatorId !== dbUser.id && event.managerId !== dbUser.id) {
    redirect("/dashboard/events");
  }

  // Transform event data for form
  const initialData: Partial<EventCreationFormData> = {
    title: event.title,
    description: event.description ?? undefined,
    type: event.type,
    capacity: event.capacity,
    price: event.price ? Number(event.price) : undefined,
    currency: event.currency ?? "CZK",
    startDate: event.startDate,
    endDate: event.endDate ?? undefined,
    timezone: event.timezone ?? "Europe/Prague",
    venue: event.venue ?? undefined,
    country: event.country ?? "Czech Republic",
    isOnline: event.isOnline,
    requiresApproval: event.requiresApproval,
    allowWaitingList: event.allowWaitingList,
    requiresPayment: event.requiresPayment,
    bankAccountId: event.bankAccountId ?? undefined,
    tags: (event.tags as string[]) ?? [],
  };

  return (
    <div className="container mx-auto max-w-4xl px-4 py-8">
      <div className="mb-8">
        <h1 className="mb-2 text-3xl font-bold text-gray-900">Edit Event</h1>
        <p className="text-gray-600">Update your event details below</p>
      </div>

      <div className="rounded-lg border border-gray-200 bg-white shadow-sm">
        <EventCreationForm mode="edit" eventId={params.id} initialData={initialData} />
      </div>
    </div>
  );
}
