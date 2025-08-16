"use client";

import React, { useState, lazy, Suspense } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";
import { ChevronLeft, ChevronRight, Save } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Form } from "@/components/ui/form";
import { FormErrorBoundary } from "@/components/ui/form-error-boundary";
import { useToast } from "@/hooks/use-toast";
import { eventFormSchema, type EventFormData } from "@/lib/schemas/event-schemas";

// Lazy-loaded step components for better performance
const BasicInfoStep = lazy(() =>
  import("./steps/basic-info-step").then((m) => ({ default: m.BasicInfoStep }))
);
const SchedulingStep = lazy(() =>
  import("./steps/scheduling-step").then((m) => ({ default: m.SchedulingStep }))
);
const LocationStep = lazy(() =>
  import("./steps/location-step").then((m) => ({ default: m.LocationStep }))
);
const RegistrationStep = lazy(() =>
  import("./steps/registration-step").then((m) => ({ default: m.RegistrationStep }))
);
const PaymentStep = lazy(() =>
  import("./steps/payment-step").then((m) => ({ default: m.PaymentStep }))
);
const ReviewStep = lazy(() =>
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

interface EventCreateFormProps {
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

export function EventCreateForm({
  locale,
  bankAccounts = [],
  categories = [],
}: EventCreateFormProps) {
  const [currentStep, setCurrentStep] = useState(0);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const router = useRouter();
  const { toast } = useToast();

  const form = useForm<EventFormData>({
    resolver: zodResolver(eventFormSchema) as any,
    defaultValues: {
      title: "",
      description: undefined,
      shortDescription: undefined,
      type: "MEETUP",
      startDate: "",
      endDate: undefined,
      capacity: 50,
      timezone: "Europe/Bratislava",
      country: "Slovakia",
      currency: "EUR",
      isOnline: false,
      requiresApproval: false,
      allowWaitingList: true,
      requiresPayment: false,
      tags: [],
      translations: undefined,
      venue: undefined,
      address: undefined,
      city: undefined,
      onlineUrl: undefined,
      registrationStartDate: undefined,
      registrationEndDate: undefined,
      maxWaitingList: undefined,
      price: undefined,
      bankAccountId: undefined,
      categoryId: undefined,
      imageUrl: undefined,
      websiteUrl: undefined,
    },
    mode: "onChange",
  });

  const { watch, trigger, getValues } = form;
  const watchedValues = watch();

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

  const handleNext = async () => {
    const isValid = await validateCurrentStep();
    if (!isValid) {
      toast({
        title: "Validation Error",
        description: "Please fix the errors before continuing.",
        variant: "destructive",
      });
      return;
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
            title: "Validation Error",
            description: `Please complete step ${i + 1} before proceeding.`,
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
      const response = await fetch("/api/events", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to create event");
      }

      await response.json();

      toast({
        title: "Success",
        description: "Event created successfully!",
      });

      // Redirect to event management dashboard
      router.push(`/${locale}/dashboard/events`);
    } catch (error) {
      // Error is already handled by toast notification
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to create event",
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

  const CurrentStepComponent = FORM_STEPS[currentStep]?.component;

  return (
    <div className="mx-auto max-w-4xl p-6">
      <Card>
        <CardHeader>
          <CardTitle className="text-2xl font-bold">Create New Event</CardTitle>

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
                  fallbackTitle="Step Loading Error"
                  fallbackMessage={`Failed to load ${FORM_STEPS[currentStep]?.title} step. Please try again or contact support.`}
                  onRetry={() => window.location.reload()}
                >
                  <Suspense fallback={<StepLoader />}>
                    <CurrentStepComponent
                      form={form}
                      locale={locale}
                      bankAccounts={bankAccounts}
                      categories={categories}
                      formData={watchedValues as EventFormData}
                    />
                  </Suspense>
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
                    <ChevronLeft className="mr-2 h-4 w-4" />
                    Previous
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
                    Save Draft
                  </Button>

                  {currentStep < FORM_STEPS.length - 1 ? (
                    <Button type="button" onClick={handleNext}>
                      Next
                      <ChevronRight className="ml-2 h-4 w-4" />
                    </Button>
                  ) : (
                    <Button type="submit" disabled={isSubmitting}>
                      {isSubmitting ? "Creating..." : "Create Event"}
                    </Button>
                  )}
                </div>
              </div>
            </form>
          </Form>
        </CardContent>
      </Card>
    </div>
  );
}
