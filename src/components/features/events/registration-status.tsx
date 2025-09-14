"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Label } from "@/components/ui/label";
import { CheckCircle, Clock, AlertCircle, XCircle, Users } from "lucide-react";
import { format } from "date-fns";
import type { RegistrationStatusResponse } from "@/types/features/event-registration";

interface RegistrationStatusProps {
  status: RegistrationStatusResponse;
  onPaymentClaimed: () => void;
}

export function RegistrationStatus({ status, onPaymentClaimed }: RegistrationStatusProps) {
  const formatDate = (date: Date) => format(date, "PPP p");
  const formatRelativeDate = (date: Date) => {
    const now = new Date();
    const diffTime = date.getTime() - now.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays < 0) return "Expired";
    if (diffDays === 0) return "Today";
    if (diffDays === 1) return "Tomorrow";
    return `In ${diffDays} days`;
  };

  const getStatusIcon = () => {
    switch (status.registration.status) {
      case "CONFIRMED":
        return <CheckCircle className="h-5 w-5 text-green-600" />;
      case "PENDING":
        return <Clock className="h-5 w-5 text-yellow-600" />;
      case "WAITLISTED":
        return <AlertCircle className="h-5 w-5 text-orange-600" />;
      case "CANCELLED":
        return <XCircle className="h-5 w-5 text-red-600" />;
      default:
        return <Clock className="h-5 w-5 text-gray-600" />;
    }
  };

  const getStatusColor = () => {
    switch (status.registration.status) {
      case "CONFIRMED":
        return "bg-green-100 text-green-800 border-green-200";
      case "PENDING":
        return "bg-yellow-100 text-yellow-800 border-yellow-200";
      case "WAITLISTED":
        return "bg-orange-100 text-orange-800 border-orange-200";
      case "CANCELLED":
        return "bg-red-100 text-red-800 border-red-200";
      default:
        return "bg-gray-100 text-gray-800 border-gray-200";
    }
  };

  const getPaymentStatusColor = () => {
    switch (status.payment.status) {
      case "PAYMENT_VERIFIED":
        return "bg-green-100 text-green-800 border-green-200";
      case "PAYMENT_SENT_AWAITING_VERIFICATION":
        return "bg-blue-100 text-blue-800 border-blue-200";
      case "PENDING_VERIFICATION":
        return "bg-yellow-100 text-yellow-800 border-yellow-200";
      case "PAYMENT_FAILED":
        return "bg-red-100 text-red-800 border-red-200";
      default:
        return "bg-gray-100 text-gray-800 border-gray-200";
    }
  };

  return (
    <div className="space-y-6">
      {/* Registration Summary */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            {getStatusIcon()}
            Registration Status
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <div>
              <Label className="text-sm font-medium text-gray-700">Status</Label>
              <Badge className={`mt-1 ${getStatusColor()}`}>{status.registration.status}</Badge>
            </div>

            <div>
              <Label className="text-sm font-medium text-gray-700">Payment Status</Label>
              <Badge className={`mt-1 ${getPaymentStatusColor()}`}>{status.payment.status}</Badge>
            </div>

            <div>
              <Label className="text-sm font-medium text-gray-700">Registered At</Label>
              <div className="mt-1 text-gray-900">{formatDate(status.registration.createdAt)}</div>
            </div>

            <div>
              <Label className="text-sm font-medium text-gray-700">Guests</Label>
              <div className="mt-1 flex items-center gap-2 text-gray-900">
                <Users className="h-4 w-4" />
                {status.registration.numberOfGuests}
              </div>
            </div>
          </div>

          {status.registration.notes && (
            <div>
              <Label className="text-sm font-medium text-gray-700">Notes</Label>
              <div className="mt-1 text-gray-900">{status.registration.notes}</div>
            </div>
          )}

          {status.registration.specialRequirements && (
            <div>
              <Label className="text-sm font-medium text-gray-700">Special Requirements</Label>
              <div className="mt-1 text-gray-900">{status.registration.specialRequirements}</div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Payment Information */}
      <Card>
        <CardHeader>
          <CardTitle>Payment Details</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <div>
              <Label className="text-sm font-medium text-gray-700">Amount</Label>
              <div className="mt-1 text-2xl font-bold text-gray-900">
                {status.payment.amount} {status.payment.currency}
              </div>
            </div>

            <div>
              <Label className="text-sm font-medium text-gray-700">Method</Label>
              <div className="mt-1 text-gray-900">{status.payment.method}</div>
            </div>

            {status.payment.transactionId && (
              <div>
                <Label className="text-sm font-medium text-gray-700">Transaction ID</Label>
                <div className="mt-1 font-mono text-gray-900">{status.payment.transactionId}</div>
              </div>
            )}

            {status.payment.claimedAt && (
              <div>
                <Label className="text-sm font-medium text-gray-700">Claimed At</Label>
                <div className="mt-1 text-gray-900">{formatDate(status.payment.claimedAt)}</div>
              </div>
            )}
          </div>

          {status.payment.notes && (
            <div>
              <Label className="text-sm font-medium text-gray-700">Payment Notes</Label>
              <div className="mt-1 text-gray-900">{status.payment.notes}</div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Action Required */}
      {status.payment.status === "PENDING_VERIFICATION" && (
        <Alert>
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            <div className="space-y-2">
              <p>
                Your registration is pending payment verification. Please complete the payment to
                confirm your spot.
              </p>
              <Button onClick={onPaymentClaimed} variant="outline" size="sm">
                View Payment Details
              </Button>
            </div>
          </AlertDescription>
        </Alert>
      )}

      {status.payment.status === "PAYMENT_SENT_AWAITING_VERIFICATION" && (
        <Alert>
          <Clock className="h-4 w-4" />
          <AlertDescription>
            <div className="space-y-2">
              <p>
                Payment has been sent and is awaiting verification by our team. This usually takes
                1-2 business days.
              </p>
              <p className="text-sm text-gray-600">
                You will receive a confirmation email once your payment is verified.
              </p>
            </div>
          </AlertDescription>
        </Alert>
      )}

      {status.payment.status === "PAYMENT_VERIFIED" && (
        <Alert className="border-green-200 bg-green-50">
          <CheckCircle className="h-4 w-4 text-green-600" />
          <AlertDescription className="text-green-800">
            <div className="space-y-2">
              <p>Payment verified! Your registration is confirmed.</p>
              <p className="text-sm">
                Check your email for event details and any additional information.
              </p>
            </div>
          </AlertDescription>
        </Alert>
      )}

      {/* Cancellation Information */}
      {status.cancellationDeadline && (
        <Card className="border-orange-200 bg-orange-50">
          <CardHeader>
            <CardTitle className="text-orange-800">Cancellation Policy</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <p className="text-orange-700">
                You can cancel your registration until{" "}
                <span className="font-semibold">{formatDate(status.cancellationDeadline)}</span> (
                {formatRelativeDate(status.cancellationDeadline)})
              </p>
              {status.canCancel && (
                <Button variant="outline" size="sm" className="border-orange-300 text-orange-700">
                  Cancel Registration
                </Button>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Waiting List Information */}
      {status.waitingList && (
        <Card className="border-orange-200 bg-orange-50">
          <CardHeader>
            <CardTitle className="text-orange-800">Waiting List Position</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <p className="text-orange-700">
                You are currently on the waiting list in position{" "}
                <span className="font-semibold">{status.waitingList.position}</span>
              </p>
              <p className="text-sm text-orange-600">
                We will notify you if a spot becomes available.
              </p>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
