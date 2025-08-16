"use client";

import React from "react";

import { EventType } from "@prisma/client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { EventFormData } from "@/lib/schemas/event-schemas";

interface ReviewStepProps {
  locale: string;
  bankAccounts?: Array<{ id: string; name: string; accountNumber: string }>;
  categories?: Array<{ id: string; name: string }>;
  formData: EventFormData;
}

const EVENT_TYPE_LABELS: Record<EventType, string> = {
  WORKSHOP: "Workshop",
  SEMINAR: "Seminar",
  CONFERENCE: "Conference",
  MEETUP: "Meetup",
  TRAINING: "Training",
  SOCIAL: "Social Event",
  OTHER: "Other",
};

export function ReviewStep({
  locale,
  bankAccounts = [],
  categories = [],
  formData,
}: ReviewStepProps) {
  const selectedBankAccount = bankAccounts.find((account) => account.id === formData.bankAccountId);
  const selectedCategory = categories.find((category) => category.id === formData.categoryId);

  const formatDateTime = (dateString: string | undefined) => {
    if (!dateString) return "Not set";
    try {
      return new Date(dateString).toLocaleString(locale, {
        timeZone: formData.timezone,
        dateStyle: "full",
        timeStyle: "short",
      });
    } catch {
      return "Invalid date";
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h3 className="mb-4 text-lg font-semibold">Review Your Event</h3>
        <p className="mb-6 text-sm text-muted-foreground">
          Please review all the details before creating your event. You can go back to any step to
          make changes.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* Basic Information */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Basic Information</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div>
              <h4 className="text-sm font-medium text-muted-foreground">Title</h4>
              <p className="font-medium">{formData.title || "Not set"}</p>
            </div>

            <div>
              <h4 className="text-sm font-medium text-muted-foreground">Type</h4>
              <Badge variant="secondary">
                {EVENT_TYPE_LABELS[formData.type as EventType] || formData.type}
              </Badge>
            </div>

            {selectedCategory && (
              <div>
                <h4 className="text-sm font-medium text-muted-foreground">Category</h4>
                <p>{selectedCategory.name}</p>
              </div>
            )}

            {formData.shortDescription && (
              <div>
                <h4 className="text-sm font-medium text-muted-foreground">Short Description</h4>
                <p className="text-sm">{formData.shortDescription}</p>
              </div>
            )}

            {formData.tags && formData.tags.length > 0 && (
              <div>
                <h4 className="text-sm font-medium text-muted-foreground">Tags</h4>
                <div className="flex flex-wrap gap-1">
                  {formData.tags.map((tag, index) => (
                    <Badge key={index} variant="outline" className="text-xs">
                      {tag}
                    </Badge>
                  ))}
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Schedule */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Schedule</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div>
              <h4 className="text-sm font-medium text-muted-foreground">Start Date & Time</h4>
              <p>{formatDateTime(formData.startDate)}</p>
            </div>

            {formData.endDate && (
              <div>
                <h4 className="text-sm font-medium text-muted-foreground">End Date & Time</h4>
                <p>{formatDateTime(formData.endDate)}</p>
              </div>
            )}

            <div>
              <h4 className="text-sm font-medium text-muted-foreground">Timezone</h4>
              <p>{formData.timezone}</p>
            </div>

            {formData.startDate && formData.endDate && (
              <div>
                <h4 className="text-sm font-medium text-muted-foreground">Duration</h4>
                <p>
                  {Math.round(
                    (new Date(formData.endDate).getTime() -
                      new Date(formData.startDate).getTime()) /
                      (1000 * 60 * 60)
                  )}{" "}
                  hours
                </p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Location */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Location</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {formData.isOnline ? (
              <div>
                <Badge variant="secondary">Online Event</Badge>
                {formData.onlineUrl && (
                  <div className="mt-2">
                    <h4 className="text-sm font-medium text-muted-foreground">Join URL</h4>
                    <p className="break-all text-sm">{formData.onlineUrl}</p>
                  </div>
                )}
              </div>
            ) : (
              <div className="space-y-3">
                {formData.venue && (
                  <div>
                    <h4 className="text-sm font-medium text-muted-foreground">Venue</h4>
                    <p>{formData.venue}</p>
                  </div>
                )}

                {formData.address && (
                  <div>
                    <h4 className="text-sm font-medium text-muted-foreground">Address</h4>
                    <p className="text-sm">{formData.address}</p>
                  </div>
                )}

                {(formData.city || formData.country) && (
                  <div>
                    <h4 className="text-sm font-medium text-muted-foreground">Location</h4>
                    <p>{[formData.city, formData.country].filter(Boolean).join(", ")}</p>
                  </div>
                )}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Registration */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Registration</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div>
              <h4 className="text-sm font-medium text-muted-foreground">Capacity</h4>
              <p>{formData.capacity} attendees</p>
            </div>

            <div>
              <h4 className="text-sm font-medium text-muted-foreground">Approval</h4>
              <Badge variant={formData.requiresApproval ? "destructive" : "secondary"}>
                {formData.requiresApproval ? "Required" : "Automatic"}
              </Badge>
            </div>

            <div>
              <h4 className="text-sm font-medium text-muted-foreground">Waiting List</h4>
              <div className="flex items-center gap-2">
                <Badge variant={formData.allowWaitingList ? "secondary" : "outline"}>
                  {formData.allowWaitingList ? "Enabled" : "Disabled"}
                </Badge>
                {formData.allowWaitingList && formData.maxWaitingList && (
                  <span className="text-sm text-muted-foreground">
                    (max {formData.maxWaitingList})
                  </span>
                )}
              </div>
            </div>

            {formData.registrationStartDate && (
              <div>
                <h4 className="text-sm font-medium text-muted-foreground">Registration Opens</h4>
                <p className="text-sm">{formatDateTime(formData.registrationStartDate)}</p>
              </div>
            )}

            {formData.registrationEndDate && (
              <div>
                <h4 className="text-sm font-medium text-muted-foreground">Registration Closes</h4>
                <p className="text-sm">{formatDateTime(formData.registrationEndDate)}</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Payment */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="text-lg">Payment</CardTitle>
          </CardHeader>
          <CardContent>
            {formData.requiresPayment ? (
              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <Badge variant="secondary">Paid Event</Badge>
                  <span className="font-medium">
                    {formData.price} {formData.currency}
                  </span>
                </div>

                {selectedBankAccount && (
                  <div>
                    <h4 className="text-sm font-medium text-muted-foreground">Bank Account</h4>
                    <p>
                      {selectedBankAccount.name} - {selectedBankAccount.accountNumber}
                    </p>
                  </div>
                )}

                <div className="text-sm text-muted-foreground">
                  <p>
                    Attendees will receive payment instructions via email after registration. QR
                    codes for Slovak banking will be automatically generated for CZK/EUR payments.
                  </p>
                </div>
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <Badge variant="secondary">Free Event</Badge>
                <span className="text-sm text-muted-foreground">
                  No payment required for registration
                </span>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Full Description */}
        {formData.description && (
          <Card className="lg:col-span-2">
            <CardHeader>
              <CardTitle className="text-lg">Full Description</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="prose prose-sm max-w-none">
                <p className="whitespace-pre-wrap">{formData.description}</p>
              </div>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Final Notes */}
      <div className="rounded-lg border border-blue-200 bg-blue-50 p-4">
        <div className="flex items-start">
          <div className="flex-shrink-0">
            <svg className="h-5 w-5 text-blue-400" viewBox="0 0 20 20" fill="currentColor">
              <path
                fillRule="evenodd"
                d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z"
                clipRule="evenodd"
              />
            </svg>
          </div>
          <div className="ml-3">
            <h3 className="text-sm font-medium text-blue-800">Ready to Create Your Event?</h3>
            <div className="mt-1 text-sm text-blue-700">
              <p>
                Once you create the event, it will be saved as a draft. You can publish it later
                from your event management dashboard. You can also make changes to any of these
                settings after creation.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
