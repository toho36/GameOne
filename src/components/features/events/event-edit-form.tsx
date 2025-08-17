"use client";

import React, { useState, useEffect, useCallback } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { AlertTriangle, Save, X } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Form } from "@/components/ui/form";
import { FormErrorBoundary } from "@/components/ui/form-error-boundary";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { eventFormSchema, type EventFormData } from "@/lib/schemas/event-schemas";
import type { Event, Registration } from "@prisma/client";

// Lazy-loaded step components for better performance
const BasicInfoStep = React.lazy(() =>
  import("./steps/basic-info-step").then((m) => ({ default: m.BasicInfoStep }))
);
const SchedulingStep = React.lazy(() =>
  import("./steps/scheduling-step").then((m) => ({ default: m.SchedulingStep }))
);
const LocationStep = React.lazy(() =>
  import("./steps/location-step").then((m) => ({ default: m.LocationStep }))
);
const RegistrationStep = React.lazy(() =>
  import("./steps/registration-step").then((m) => ({ default: m.RegistrationStep }))
);
const PaymentStep = React.lazy(() =>
  import("./steps/payment-step").then((m) => ({ default: m.PaymentStep }))
);
const ReviewStep = React.lazy(() =>
  import("./steps/review-step").then((m) => ({ default: m.ReviewStep }))
);

// Loading component for step transitions
const StepLoader = () => (
  <div className="flex items-center justify-center py-12">
    <div className="space-y-4 text-center">
      <div className="mx-auto h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent"></div>
      <p className="text-sm text-muted-foreground">Loading step...</p>
    </div>
  </div>
);

interface EventEditFormProps {
  event: Event & { registrations?: Registration[] };
  locale: string;
  bankAccounts?: Array<{ id: string; name: string; accountNumber: string }>;
  categories?: Array<{ id: string; name: string }>;
}

const FORM_STEPS = [
  { id: "basic", title: "Basic Information", component: BasicInfoStep },
  { id: "scheduling", title: "Date & Time", component: SchedulingStep },
  { id: "location", title: "Location", component: LocationStep },
  { id: "registration", title: "Registration", component: RegistrationStep },
  { id: "payment", title: "Payment", component: PaymentStep },
  { id: "review", title: "Review", component: ReviewStep },
] as const;

export function EventEditForm({
  event,
  locale,
  bankAccounts = [],
  categories = [],
}: EventEditFormProps) {
  const [currentStep, setCurrentStep] = useState(0);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [showUnsavedChangesDialog, setShowUnsavedChangesDialog] = useState(false);
  const [showCapacityWarning, setShowCapacityWarning] = useState(false);
  const [capacityWarning, setCapacityWarning] = useState<string>("");
  const [pendingNavigation, setPendingNavigation] = useState<string | null>(null);
  const router = useRouter();
  const { toast } = useToast();
  const t = useTranslations("EventEdit");

  // Convert event data to form format
  const convertEventToFormData = useCallback((eventData: Event): EventFormData => {
    if (!eventData) {
      throw new Error("Event data is required for form initialization");
    }

    return {
      title: eventData.title || "",
      description: eventData.description || undefined,
      shortDescription: eventData.shortDescription || undefined,
      type: eventData.type,
      startDate: eventData.startDate.toISOString(),
      endDate: eventData.endDate?.toISOString() || undefined,
      timezone: eventData.timezone,
      capacity: eventData.capacity,
      registrationStartDate: eventData.registrationStartDate?.toISOString() || undefined,
      registrationEndDate: eventData.registrationEndDate?.toISOString() || undefined,
      requiresApproval: eventData.requiresApproval,
      allowWaitingList: eventData.allowWaitingList,
      maxWaitingList: eventData.maxWaitingList || undefined,
      venue: eventData.venue || undefined,
      address: eventData.address || undefined,
      city: eventData.city || undefined,
      country: eventData.country || "Slovakia",
      isOnline: eventData.isOnline,
      onlineUrl: eventData.onlineUrl || undefined,
      requiresPayment: eventData.requiresPayment,
      price: eventData.price ? Number(eventData.price) : undefined,
      currency: eventData.currency,
      bankAccountId: eventData.bankAccountId || undefined,
      categoryId: eventData.categoryId || undefined,
      tags: eventData.tags,
      imageUrl: eventData.imageUrl || undefined,
      websiteUrl: eventData.websiteUrl || undefined,
      translations: (eventData.translations as Record<string, any>) || undefined,
    };
  }, []);

  const form = useForm<EventFormData>({
    // Type assertion needed due to strictOptionalProperties incompatibility
    resolver: zodResolver(eventFormSchema) as any,
    defaultValues: convertEventToFormData(event),
    mode: "onChange",
  });

  const { watch, trigger, getValues } = form;
  const watchedValues = watch();

  // Track form changes
  useEffect(() => {
    const originalData = convertEventToFormData(event);
    const currentData = getValues();

    const hasChanges = JSON.stringify(originalData) !== JSON.stringify(currentData);
    setHasUnsavedChanges(hasChanges);
  }, [watchedValues, event, convertEventToFormData, getValues]);

  // Step validation mapping
  const stepValidationFields: Record<number, (keyof EventFormData)[]> = {
    0: ["title", "description", "shortDescription", "type"],
    1: ["startDate", "endDate", "timezone"],
    2: ["venue", "address", "city", "country", "isOnline", "onlineUrl"],
    3: [
      "capacity",
      "registrationStartDate",
      "registrationEndDate",
      "requiresApproval",
      "allowWaitingList",
      "maxWaitingList",
    ],
    4: ["requiresPayment", "price", "currency", "bankAccountId"],
    5: [], // Review step - no specific validation
  };

  const validateCurrentStep = async (): Promise<boolean> => {
    const fieldsToValidate = stepValidationFields[currentStep];
    if (!fieldsToValidate || fieldsToValidate.length === 0) return true;

    const result = await trigger(fieldsToValidate);
    return result;
  };

  // Check capacity changes impact
  const checkCapacityImpact = useCallback(
    (newCapacity: number) => {
      const confirmedRegistrations =
        event.registrations?.filter((r) => r.status === "CONFIRMED").length || 0;

      if (newCapacity < confirmedRegistrations) {
        const warning = `Reducing capacity from ${event.capacity} to ${newCapacity} will affect ${confirmedRegistrations - newCapacity} confirmed registrations. Some attendees may need to be moved to the waiting list or contacted for cancellation.`;
        setCapacityWarning(warning);
        setShowCapacityWarning(true);
        return false;
      }
      return true;
    },
    [event.capacity, event.registrations]
  );

  const handleNext = async () => {
    const isValid = await validateCurrentStep();
    if (!isValid) {
      toast({
        title: t("validationError.title"),
        description: t("validationError.description"),
        variant: "destructive",
      });
      return;
    }

    // Check capacity impact for registration step
    if (currentStep === 2) {
      // Location step, next is registration
      const newCapacity = getValues("capacity");
      if (newCapacity !== event.capacity) {
        if (!checkCapacityImpact(newCapacity)) {
          return; // Stop if capacity warning is shown
        }
      }
    }

    if (currentStep < FORM_STEPS.length - 1) {
      setCurrentStep(currentStep + 1);
    }
  };

  const handlePrevious = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleStepClick = async (stepIndex: number) => {
    // Allow going back to previous steps without validation
    if (stepIndex < currentStep) {
      setCurrentStep(stepIndex);
      return;
    }

    // For forward navigation, validate all steps up to the target
    for (let i = currentStep; i < stepIndex; i++) {
      const fieldsToValidate = stepValidationFields[i];
      if (fieldsToValidate && fieldsToValidate.length > 0) {
        const isValid = await trigger(fieldsToValidate);
        if (!isValid) {
          toast({
            title: t("validationError.title"),
            description: t("validationError.stepError", { step: i + 1 }),
            variant: "destructive",
          });
          return;
        }
      }
    }

    setCurrentStep(stepIndex);
  };

  const handleSubmit = async (data: EventFormData) => {
    setIsSubmitting(true);

    try {
      const response = await fetch(`/api/events/${event.id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to update event");
      }

      const result = await response.json();

      // Show warnings if any
      if (result.warnings && result.warnings.length > 0) {
        toast({
          title: t("updateSuccess.title"),
          description: t("updateSuccess.description"),
        });

        // Show warnings in a separate toast
        result.warnings.forEach((warning: string) => {
          toast({
            title: t("updateWarning.title"),
            description: warning,
            variant: "destructive",
          });
        });
      } else {
        toast({
          title: t("updateSuccess.title"),
          description: t("updateSuccess.description"),
        });
      }

      // Reset unsaved changes flag
      setHasUnsavedChanges(false);

      // Redirect to event management dashboard
      router.push(`/${locale}/events`);
    } catch (error) {
      toast({
        title: t("updateError.title"),
        description: error instanceof Error ? error.message : t("updateError.description"),
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSaveDraft = async () => {
    const data = getValues();
    // Save as draft with minimal validation
    await handleSubmit({ ...data, status: "DRAFT" } as EventFormData);
  };

  const handleNavigation = (url: string) => {
    if (hasUnsavedChanges) {
      setPendingNavigation(url);
      setShowUnsavedChangesDialog(true);
    } else {
      router.push(url);
    }
  };

  const confirmNavigation = () => {
    if (pendingNavigation) {
      setShowUnsavedChangesDialog(false);
      setPendingNavigation(null);
      router.push(pendingNavigation);
    }
  };

  const cancelNavigation = () => {
    setShowUnsavedChangesDialog(false);
    setPendingNavigation(null);
  };

  const CurrentStepComponent = FORM_STEPS[currentStep]?.component;

  return (
    <>
      <div className="mx-auto max-w-4xl p-6">
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="text-2xl font-bold">{t("title")}</CardTitle>
              <Button
                variant="outline"
                onClick={() => handleNavigation(`/${locale}/events`)}
                className="flex items-center gap-2"
              >
                <X className="h-4 w-4" />
                {t("cancel")}
              </Button>
            </div>

            {/* Unsaved Changes Warning */}
            {hasUnsavedChanges && (
              <Alert className="mt-4 border-amber-200 bg-amber-50">
                <AlertTriangle className="h-4 w-4 text-amber-600" />
                <AlertDescription className="text-amber-800">
                  {t("unsavedChanges")}
                </AlertDescription>
              </Alert>
            )}

            {/* Step Navigation */}
            <div className="mt-6 flex items-center justify-between">
              {FORM_STEPS.map((step, index) => (
                <div key={step.id} className="flex items-center">
                  <button
                    type="button"
                    onClick={() => handleStepClick(index)}
                    className={`flex h-8 w-8 items-center justify-center rounded-full text-sm font-medium transition-colors duration-200 ${
                      index === currentStep
                        ? "bg-primary text-primary-foreground"
                        : index < currentStep
                          ? "bg-green-500 text-white"
                          : "bg-muted text-muted-foreground"
                    } ${index <= currentStep ? "cursor-pointer hover:opacity-80" : "cursor-not-allowed"} `}
                    disabled={index > currentStep}
                  >
                    {index < currentStep ? "✓" : index + 1}
                  </button>
                  <span className={`ml-2 text-sm ${index === currentStep ? "font-medium" : ""}`}>
                    {step.title}
                  </span>
                  {index < FORM_STEPS.length - 1 && (
                    <div
                      className={`mx-4 h-px w-8 ${index < currentStep ? "bg-green-500" : "bg-muted"}`}
                    />
                  )}
                </div>
              ))}
            </div>
          </CardHeader>

          <CardContent>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">
                {/* Current Step Content */}
                {CurrentStepComponent && (
                  <FormErrorBoundary
                    fallbackTitle={t("stepError.title")}
                    fallbackMessage={t("stepError.description", {
                      step: FORM_STEPS[currentStep]?.title || "Unknown",
                    })}
                    onRetry={() => window.location.reload()}
                  >
                    <React.Suspense fallback={<StepLoader />}>
                      <CurrentStepComponent
                        form={form}
                        locale={locale}
                        bankAccounts={bankAccounts}
                        categories={categories}
                        formData={watchedValues as EventFormData}
                      />
                    </React.Suspense>
                  </FormErrorBoundary>
                )}

                {/* Navigation Buttons */}
                <div className="flex items-center justify-between border-t pt-6">
                  <div className="flex gap-2">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={handlePrevious}
                      disabled={currentStep === 0}
                    >
                      {t("previous")}
                    </Button>
                  </div>

                  <div className="flex gap-2">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={handleSaveDraft}
                      disabled={isSubmitting}
                    >
                      <Save className="mr-2 h-4 w-4" />
                      {t("saveDraft")}
                    </Button>

                    {currentStep < FORM_STEPS.length - 1 ? (
                      <Button type="button" onClick={handleNext}>
                        {t("next")}
                      </Button>
                    ) : (
                      <Button type="submit" disabled={isSubmitting}>
                        {isSubmitting ? t("updating") : t("updateEvent")}
                      </Button>
                    )}
                  </div>
                </div>
              </form>
            </Form>
          </CardContent>
        </Card>
      </div>

      {/* Unsaved Changes Dialog */}
      <Dialog open={showUnsavedChangesDialog} onOpenChange={setShowUnsavedChangesDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t("unsavedChangesDialog.title")}</DialogTitle>
            <DialogDescription>{t("unsavedChangesDialog.description")}</DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={cancelNavigation}>
              {t("unsavedChangesDialog.cancel")}
            </Button>
            <Button variant="destructive" onClick={confirmNavigation}>
              {t("unsavedChangesDialog.leave")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Capacity Warning Dialog */}
      <Dialog open={showCapacityWarning} onOpenChange={setShowCapacityWarning}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t("capacityWarning.title")}</DialogTitle>
            <DialogDescription>{capacityWarning}</DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowCapacityWarning(false)}>
              {t("capacityWarning.cancel")}
            </Button>
            <Button
              onClick={() => {
                setShowCapacityWarning(false);
                setCurrentStep(currentStep + 1);
              }}
            >
              {t("capacityWarning.continue")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
