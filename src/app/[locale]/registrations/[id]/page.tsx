import React from "react";
import { notFound } from "next/navigation";
import { RegistrationConfirmation } from "@/components/features/registration/components/registration-confirmation";

export default function RegistrationPage({ params }: { params: { id: string } }) {
  const id = params.id;
  if (!id) return notFound();
  return (
    <div className="mx-auto max-w-2xl p-4">
      <RegistrationConfirmation registrationId={id} />
    </div>
  );
}
