"use client";

import { useState } from "react";
import { useRegister } from "@/components/features/registration/hooks/use-register";
import type { RegistrationFormProps } from "./registration-form.types";

export function RegistrationForm({ eventId, onSuccess }: RegistrationFormProps) {
  const [guests, setGuests] = useState(0);
  const [contact, setContact] = useState("");
  const [guestDetails, setGuestDetails] = useState<string>("");
  const register = useRegister(eventId);

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        register.mutate(
          {
            numberOfGuests: guests,
            contact,
            guestDetails: guestDetails ? JSON.parse(guestDetails) : undefined,
          },
          {
            onSuccess: () => onSuccess?.(),
          }
        );
      }}
      className="space-y-3"
    >
      <div>
        <label className="block text-sm font-medium">Number of friends</label>
        <input
          type="number"
          min={0}
          max={5}
          value={guests}
          onChange={(e) => setGuests(Number(e.target.value))}
          className="w-full rounded border p-2"
        />
      </div>
      <div>
        <label className="block text-sm font-medium">Contact</label>
        <input
          value={contact}
          onChange={(e) => setContact(e.target.value)}
          className="w-full rounded border p-2"
        />
      </div>
      <div>
        <label className="block text-sm font-medium">Guest details (JSON)</label>
        <textarea
          value={guestDetails}
          onChange={(e) => setGuestDetails(e.target.value)}
          className="h-24 w-full rounded border p-2"
        />
      </div>
      <button
        type="submit"
        className="rounded bg-blue-600 px-4 py-2 text-white disabled:opacity-50"
        disabled={register.isPending}
      >
        {register.isPending ? "Submitting..." : "Register"}
      </button>
      {register.isError && (
        <p className="text-sm text-red-600">
          {(register.error as any)?.message ?? "Registration failed"}
        </p>
      )}
    </form>
  );
}

export default RegistrationForm;
