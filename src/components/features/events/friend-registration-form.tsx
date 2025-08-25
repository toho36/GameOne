"use client";

import React, { useState } from "react";
import { useTranslations } from "next-intl";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { AlertCircle, Plus, X, User } from "lucide-react";
import Link from "next/link";
import type {
  CreateRegistrationRequest,
  GuestInfo,
  EmergencyContact,
} from "@/types/features/event-registration";

interface FriendRegistrationFormProps {
  event: {
    id: string;
    title: string;
    maxGuestsPerRegistration: number;
    price?: number;
    currency: string;
  };
  // eslint-disable-next-line no-unused-vars
  onSubmit: (formData: CreateRegistrationRequest) => Promise<void>;
  onCancel: () => void;
}

export function FriendRegistrationForm({ event, onSubmit, onCancel }: FriendRegistrationFormProps) {
  const t = useTranslations("FriendRegistrationForm");

  const [formData, setFormData] = useState<CreateRegistrationRequest>({
    eventId: event.id,
    numberOfGuests: 1,
    guestDetails: [],
    specialRequirements: "",
    acceptedTerms: false,
    marketingConsent: false,
    emergencyContact: {
      name: "",
      relationship: "",
      phone: "",
      email: "",
    },
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleInputChange = (field: keyof CreateRegistrationRequest, value: any) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleGuestChange = (index: number, field: keyof GuestInfo, value: string) => {
    const newGuests = [...formData.guestDetails];
    if (newGuests[index]) {
      const updatedGuest: GuestInfo = {
        ...newGuests[index]!,
        [field]: value,
        name: newGuests[index]!.name || "",
      };
      newGuests[index] = updatedGuest;
    }
    setFormData((prev) => ({ ...prev, guestDetails: newGuests }));
  };

  const addGuest = () => {
    if (formData.guestDetails.length < event.maxGuestsPerRegistration) {
      setFormData((prev) => ({
        ...prev,
        guestDetails: [
          ...prev.guestDetails,
          {
            name: "",
            email: "",
            phone: "",
            dietaryRestrictions: "",
            specialRequirements: "",
            metadata: {},
          } as GuestInfo,
        ],
      }));
    }
  };

  const removeGuest = (index: number) => {
    setFormData((prev) => ({
      ...prev,
      guestDetails: prev.guestDetails.filter((_, i) => index !== i),
    }));
  };

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
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "Registration failed";
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const totalAmount = event.price ? event.price * formData.numberOfGuests : 0;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <User className="h-5 w-5" />
          {t("title")}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Guest Information */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <Label className="text-base font-medium">{t("guests.title")}</Label>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={addGuest}
                disabled={formData.guestDetails.length >= event.maxGuestsPerRegistration}
              >
                <Plus className="mr-2 h-4 w-4" />
                {t("guests.add")}
              </Button>
            </div>

            {formData.guestDetails.map((guest, index) => (
              <div key={index} className="rounded-lg border p-4">
                <div className="mb-4 flex items-center justify-between">
                  <h4 className="font-medium">
                    {t("guests.guest")} {index + 1}
                  </h4>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => removeGuest(index)}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>

                <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                  <div>
                    <Label htmlFor={`guest-${index}-name`}>{t("guests.name")} *</Label>
                    <Input
                      id={`guest-${index}-name`}
                      value={guest.name}
                      onChange={(e) => handleGuestChange(index, "name", e.target.value)}
                      required
                    />
                  </div>

                  <div>
                    <Label htmlFor={`guest-${index}-email`}>{t("guests.email")}</Label>
                    <Input
                      id={`guest-${index}-email`}
                      type="email"
                      value={guest.email}
                      onChange={(e) => handleGuestChange(index, "email", e.target.value)}
                    />
                  </div>

                  <div>
                    <Label htmlFor={`guest-${index}-phone`}>{t("guests.phone")}</Label>
                    <Input
                      id={`guest-${index}-phone`}
                      type="tel"
                      value={guest.phone}
                      onChange={(e) => handleGuestChange(index, "phone", e.target.value)}
                    />
                  </div>

                  <div>
                    <Label htmlFor={`guest-${index}-dietary`}>{t("guests.dietary")}</Label>
                    <Input
                      id={`guest-${index}-dietary`}
                      value={guest.dietaryRestrictions}
                      onChange={(e) =>
                        handleGuestChange(index, "dietaryRestrictions", e.target.value)
                      }
                      placeholder={t("guests.dietaryPlaceholder")}
                    />
                  </div>

                  <div className="md:col-span-2">
                    <Label htmlFor={`guest-${index}-special`}>{t("guests.special")}</Label>
                    <Textarea
                      id={`guest-${index}-special`}
                      value={guest.specialRequirements}
                      onChange={(e) =>
                        handleGuestChange(index, "specialRequirements", e.target.value)
                      }
                      placeholder={t("guests.specialPlaceholder")}
                      rows={2}
                    />
                  </div>
                </div>
              </div>
            ))}

            {formData.guestDetails.length === 0 && (
              <div className="rounded-lg border-2 border-dashed border-gray-300 p-8 text-center">
                <User className="mx-auto mb-4 h-12 w-12 text-gray-400" />
                <h3 className="mb-2 text-lg font-medium text-gray-900">{t("guests.noGuests")}</h3>
                <p className="mb-4 text-gray-600">{t("guests.noGuestsDescription")}</p>
                <Button type="button" variant="outline" onClick={addGuest}>
                  <Plus className="mr-2 h-4 w-4" />
                  {t("guests.addFirst")}
                </Button>
              </div>
            )}
          </div>

          {/* Emergency Contact */}
          <div className="space-y-4">
            <Label className="text-base font-medium">{t("emergencyContact.title")}</Label>
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <div>
                <Label htmlFor="emergency-name">{t("emergencyContact.name")} *</Label>
                <Input
                  id="emergency-name"
                  value={formData.emergencyContact?.name || ""}
                  onChange={(e) => handleEmergencyContactChange("name", e.target.value)}
                  required
                />
              </div>

              <div>
                <Label htmlFor="emergency-relationship">
                  {t("emergencyContact.relationship")} *
                </Label>
                <Input
                  id="emergency-relationship"
                  value={formData.emergencyContact?.relationship || ""}
                  onChange={(e) => handleEmergencyContactChange("relationship", e.target.value)}
                  required
                />
              </div>

              <div>
                <Label htmlFor="emergency-phone">{t("emergencyContact.phone")} *</Label>
                <Input
                  id="emergency-phone"
                  type="tel"
                  value={formData.emergencyContact?.phone || ""}
                  onChange={(e) => handleEmergencyContactChange("phone", e.target.value)}
                  required
                />
              </div>

              <div>
                <Label htmlFor="emergency-email">{t("emergencyContact.email")}</Label>
                <Input
                  id="emergency-email"
                  type="email"
                  value={formData.emergencyContact?.email || ""}
                  onChange={(e) => handleEmergencyContactChange("email", e.target.value)}
                />
              </div>
            </div>
          </div>

          {/* Special Requirements */}
          <div>
            <Label htmlFor="special-requirements">{t("specialRequirements.title")}</Label>
            <Textarea
              id="special-requirements"
              value={formData.specialRequirements}
              onChange={(e) => handleInputChange("specialRequirements", e.target.value)}
              placeholder={t("specialRequirements.placeholder")}
              rows={3}
            />
          </div>

          {/* Terms and Marketing */}
          <div className="space-y-4">
            <div className="flex items-center space-x-2">
              <Switch
                id="terms"
                checked={formData.acceptedTerms}
                onCheckedChange={(checked) => handleInputChange("acceptedTerms", checked)}
                required
              />
              <Label htmlFor="terms" className="text-sm">
                {t("terms.accept")}{" "}
                <Link href="/terms/" className="text-primary hover:underline">
                  {t("terms.andConditions")}
                </Link>
              </Label>
            </div>

            <div className="flex items-center space-x-2">
              <Switch
                id="marketing"
                checked={formData.marketingConsent}
                onCheckedChange={(checked) => handleInputChange("marketingConsent", checked)}
              />
              <Label htmlFor="marketing" className="text-sm text-gray-600">
                {t("marketing.consent")}
              </Label>
            </div>
          </div>

          {/* Total Amount */}
          {totalAmount > 0 && (
            <div className="rounded-lg bg-gray-50 p-4">
              <div className="flex items-center justify-between">
                <span className="font-medium">{t("total.title")}</span>
                <span className="text-lg font-semibold">
                  {totalAmount.toFixed(2)} {event.currency}
                </span>
              </div>
              <p className="mt-1 text-sm text-gray-600">{t("total.description")}</p>
            </div>
          )}

          {/* Error Display */}
          {error && (
            <Alert variant="error">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {/* Form Actions */}
          <div className="flex justify-end space-x-3">
            <Button type="button" variant="outline" onClick={onCancel}>
              {t("actions.cancel")}
            </Button>
            <Button type="submit" disabled={loading || !formData.acceptedTerms}>
              {loading ? t("actions.submitting") : t("actions.submit")}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
