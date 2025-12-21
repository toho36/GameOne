"use client";

import React, { useState } from "react";
import { useTranslations } from "next-intl";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { User } from "lucide-react";
import type { CreateRegistrationRequest, ContactInfo } from "@/types/features/event-registration";

interface RegistrationFormProps {
  event: {
    id: string;
    title: string;
    price?: number;
    currency: string;
  };
   
  onSubmit: (formData: CreateRegistrationRequest) => Promise<void>;
}

export function RegistrationForm({ event, onSubmit }: RegistrationFormProps) {
  const t = useTranslations("RegistrationForm");

  const [formData, setFormData] = useState<CreateRegistrationRequest>({
    eventId: event.id,
    numberOfGuests: 1,
    guestDetails: [],
    contact: {
      name: "",
      phone: "",
      email: "",
    },
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleContactChange = (field: keyof ContactInfo, value: string) => {
    setFormData((prev) => ({
      ...prev,
      contact: {
        ...(prev.contact as ContactInfo),
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
    <form onSubmit={handleSubmit} className="space-y-6" noValidate>
      {error && (
        <div role="alert">
          <Alert variant="error">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        </div>
      )}

      {/* Registration Summary */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <User className="h-5 w-5" aria-hidden="true" />
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

      {/* Contact */}
      <div className="space-y-4">
        <Label className="text-sm font-medium text-gray-700">{t("contact.label")}</Label>

        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <div>
            <Label htmlFor="contact-name" className="text-sm font-medium text-gray-700">
              {t("contact.name")} <span aria-hidden="true">*</span>
              <span className="sr-only">{t("required")}</span>
            </Label>
            <Input
              id="contact-name"
              value={(formData.contact as ContactInfo | undefined)?.name || ""}
              onChange={(e) => handleContactChange("name", e.target.value)}
              placeholder={t("contact.namePlaceholder")}
              className="mt-1"
              required
              aria-required="true"
            />
          </div>

          <div>
            <Label htmlFor="contact-phone" className="text-sm font-medium text-gray-700">
              {t("contact.phone")} <span aria-hidden="true">*</span>
              <span className="sr-only">{t("required")}</span>
            </Label>
            <Input
              id="contact-phone"
              type="tel"
              value={(formData.contact as ContactInfo | undefined)?.phone || ""}
              onChange={(e) => handleContactChange("phone", e.target.value)}
              placeholder={t("contact.phonePlaceholder")}
              className="mt-1"
              required
              aria-required="true"
            />
          </div>

          <div>
            <Label htmlFor="contact-email" className="text-sm font-medium text-gray-700">
              {t("contact.email")}
            </Label>
            <Input
              id="contact-email"
              type="email"
              value={(formData.contact as ContactInfo | undefined)?.email || ""}
              onChange={(e) => handleContactChange("email", e.target.value)}
              placeholder={t("contact.emailPlaceholder")}
              className="mt-1"
            />
          </div>
        </div>
      </div>

      {/* Submit Button */}
      <Button type="submit" className="w-full" disabled={loading} aria-busy={loading}>
        {loading ? t("submit.loading") : t("submit.register")}
      </Button>
    </form>
  );
}
