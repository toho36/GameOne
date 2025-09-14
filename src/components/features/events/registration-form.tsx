"use client";

import React, { useState } from "react";
import { useTranslations } from "next-intl";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { User } from "lucide-react";
import type {
  CreateRegistrationRequest,
  EmergencyContact,
} from "@/types/features/event-registration";

interface RegistrationFormProps {
  event: {
    id: string;
    title: string;
    price?: number;
    currency: string;
  };
  // eslint-disable-next-line no-unused-vars
  onSubmit: (formData: CreateRegistrationRequest) => Promise<void>;
}

export function RegistrationForm({ event, onSubmit }: RegistrationFormProps) {
  const t = useTranslations("RegistrationForm");

  const [formData, setFormData] = useState<CreateRegistrationRequest>({
    eventId: event.id,
    numberOfGuests: 1,
    guestDetails: [],
    emergencyContact: {
      name: "",
      phone: "",
      email: "",
    },
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleEmergencyContactChange = (field: keyof EmergencyContact, value: string) => {
    setFormData((prev) => ({
      ...prev,
      emergencyContact: {
        ...prev.emergencyContact!,
        [field]: value,
      },
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      await onSubmit(formData);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Registration failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {error && (
        <Alert variant="error">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {/* Registration Summary */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <User className="h-5 w-5" />
            {t("summary.title")}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
            <div>
              <div className="text-2xl font-bold text-gray-900">
                {event.price ? `${event.price} ${event.currency}` : t("summary.free")}
              </div>
              <div className="text-sm text-gray-600">{t("summary.price")}</div>
            </div>

            <div>
              <div className="text-2xl font-bold text-gray-900">1</div>
              <div className="text-sm text-gray-600">{t("summary.participants")}</div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Emergency Contact */}
      <div className="space-y-4">
        <Label className="text-sm font-medium text-gray-700">{t("emergencyContact.label")}</Label>

        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <div>
            <Label className="text-sm font-medium text-gray-700">
              {t("emergencyContact.name")} *
            </Label>
            <Input
              value={formData.emergencyContact?.name || ""}
              onChange={(e) => handleEmergencyContactChange("name", e.target.value)}
              placeholder={t("emergencyContact.namePlaceholder")}
              className="mt-1"
              required
            />
          </div>

          <div>
            <Label className="text-sm font-medium text-gray-700">
              {t("emergencyContact.phone")} *
            </Label>
            <Input
              type="tel"
              value={formData.emergencyContact?.phone || ""}
              onChange={(e) => handleEmergencyContactChange("phone", e.target.value)}
              placeholder={t("emergencyContact.phonePlaceholder")}
              className="mt-1"
              required
            />
          </div>

          <div>
            <Label className="text-sm font-medium text-gray-700">
              {t("emergencyContact.email")}
            </Label>
            <Input
              type="email"
              value={formData.emergencyContact?.email || ""}
              onChange={(e) => handleEmergencyContactChange("email", e.target.value)}
              placeholder={t("emergencyContact.emailPlaceholder")}
              className="mt-1"
            />
          </div>
        </div>
      </div>

      {/* Submit Button */}
      <Button type="submit" className="w-full" disabled={loading}>
        {loading ? t("submit.loading") : t("submit.register")}
      </Button>
    </form>
  );
}
