"use client";

import React, { useState } from "react";
import { useTranslations } from "next-intl";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Clock, Users, AlertCircle } from "lucide-react";
import Link from "next/link";
import { postJson } from "@/lib/api/client";
import { normalizeApiError } from "@/lib/api/errors";

interface WaitingListPositionProps {
  eventId: string;
}

export function WaitingListPosition({ eventId }: WaitingListPositionProps) {
  const t = useTranslations("WaitingList");
  const [isJoining, setIsJoining] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const [formData, setFormData] = useState({
    specialRequirements: "",
    emergencyContact: {
      name: "",
      relationship: "",
      phone: "",
      email: "",
    },
    acceptedTerms: false,
  });

  const handleInputChange = (field: string, value: any) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleEmergencyContactChange = (field: string, value: string) => {
    setFormData((prev) => ({
      ...prev,
      emergencyContact: {
        ...prev.emergencyContact,
        [field]: value,
      },
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.acceptedTerms) {
      setError(t("errors.termsRequired"));
      return;
    }

    if (!formData.emergencyContact.name.trim()) {
      setError(t("errors.emergencyContactNameRequired"));
      return;
    }

    if (!formData.emergencyContact.phone.trim()) {
      setError(t("errors.emergencyContactPhoneRequired"));
      return;
    }

    setIsJoining(true);
    setError(null);

    try {
      await postJson(`/api/events/${eventId}/waiting-list`, {
        eventId,
        specialRequirements: formData.specialRequirements,
        emergencyContact: formData.emergencyContact,
        acceptedTerms: formData.acceptedTerms,
      });

      setSuccess(true);
    } catch (err) {
      setError(normalizeApiError(err));
    } finally {
      setIsJoining(false);
    }
  };

  if (success) {
    return (
      <Card className="border-green-200 bg-green-50">
        <CardContent className="pt-6">
          <div className="text-center">
            <div className="mb-2 text-2xl font-bold text-green-900">{t("success.title")}</div>
            <p className="text-green-700">{t("success.description")}</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Clock className="h-5 w-5" />
          {t("title")}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-6">
          {error && (
            <div className="flex items-center gap-2 rounded-md bg-red-50 p-3 text-red-700">
              <AlertCircle className="h-4 w-4" />
              <span>{error}</span>
            </div>
          )}

          <div className="rounded-lg bg-blue-50 p-4">
            <div className="flex items-center gap-2 text-blue-800">
              <Users className="h-4 w-4" />
              <span className="text-sm font-medium">{t("info.title")}</span>
            </div>
            <p className="mt-1 text-sm text-blue-700">{t("info.description")}</p>
          </div>

          {/* Special Requirements */}
          <div>
            <label className="block text-sm font-medium text-gray-700">
              {t("specialRequirements.label")}
            </label>
            <Textarea
              value={formData.specialRequirements}
              onChange={(e) => handleInputChange("specialRequirements", e.target.value)}
              placeholder={t("specialRequirements.placeholder")}
              rows={3}
              className="mt-1"
            />
          </div>

          {/* Emergency Contact */}
          <div className="space-y-4">
            <label className="block text-sm font-medium text-gray-700">
              {t("emergencyContact.label")}
            </label>

            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  {t("emergencyContact.name")} *
                </label>
                <Input
                  value={formData.emergencyContact.name}
                  onChange={(e) => handleEmergencyContactChange("name", e.target.value)}
                  placeholder={t("emergencyContact.namePlaceholder")}
                  className="mt-1"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">
                  {t("emergencyContact.relationship")} *
                </label>
                <Input
                  value={formData.emergencyContact.relationship}
                  onChange={(e) => handleEmergencyContactChange("relationship", e.target.value)}
                  placeholder={t("emergencyContact.relationshipPlaceholder")}
                  className="mt-1"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">
                  {t("emergencyContact.phone")} *
                </label>
                <Input
                  type="tel"
                  value={formData.emergencyContact.phone}
                  onChange={(e) => handleEmergencyContactChange("phone", e.target.value)}
                  placeholder={t("emergencyContact.phonePlaceholder")}
                  className="mt-1"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">
                  {t("emergencyContact.email")}
                </label>
                <Input
                  type="email"
                  value={formData.emergencyContact.email}
                  onChange={(e) => handleEmergencyContactChange("email", e.target.value)}
                  placeholder={t("emergencyContact.emailPlaceholder")}
                  className="mt-1"
                />
              </div>
            </div>
          </div>

          {/* Terms and Conditions */}
          <div className="flex items-start gap-3">
            <input
              type="checkbox"
              id="acceptedTerms"
              checked={formData.acceptedTerms}
              onChange={(e) => handleInputChange("acceptedTerms", e.target.checked)}
              className="mt-1 h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary"
              required
            />
            <label htmlFor="acceptedTerms" className="text-sm text-gray-700">
              {t("terms.accept")}{" "}
              <Link href="/terms" className="text-primary hover:underline">
                {t("terms.link")}
              </Link>
            </label>
          </div>

          {/* Submit Button */}
          <Button type="submit" className="w-full" disabled={isJoining}>
            {isJoining ? t("submit.joining") : t("submit.join")}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
