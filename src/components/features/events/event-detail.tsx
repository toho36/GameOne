import { format } from "date-fns";
import { Calendar, MapPin, Users, Tag, Clock } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { PublicEvent } from "@/types/features/event-registration";

interface EventDetailProps {
  event: PublicEvent;
}

export function EventDetail({ event }: EventDetailProps) {
  const formatDate = (date: Date) => format(date, "PPP");
  const formatTime = (date: Date) => format(date, "p");
  const formatDateTime = (date: Date) => format(date, "PPP p");

  const isRegistrationOpen = event.registrationOpen;
  const hasAvailableSpots = event.availableSpots !== undefined && event.availableSpots > 0;

  return (
    <div className="space-y-6">
      {/* Event Header */}
      <div className="text-center">
        {event.category && (
          <Badge variant="secondary" className="mb-4">
            {event.category.name}
          </Badge>
        )}

        <h1 className="mb-4 text-4xl font-bold text-gray-900">{event.title}</h1>

        {event.shortDescription && (
          <p className="mx-auto max-w-3xl text-xl text-gray-600">{event.shortDescription}</p>
        )}
      </div>

      {/* Event Information Grid */}
      <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-4">
        {/* Date & Time */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-sm font-medium text-gray-600">
              <Calendar className="h-4 w-4" />
              Date & Time
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-1">
              <p className="font-semibold text-gray-900">{formatDate(event.startDate)}</p>
              <p className="text-sm text-gray-600">
                {formatTime(event.startDate)} - {event.endDate ? formatTime(event.endDate) : ""}
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Location */}
        {event.venue && (
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-sm font-medium text-gray-600">
                <MapPin className="h-4 w-4" />
                Location
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="font-semibold text-gray-900">{event.venue}</p>
            </CardContent>
          </Card>
        )}

        {/* Capacity */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-sm font-medium text-gray-600">
              <Users className="h-4 w-4" />
              Capacity
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-1">
              <p className="font-semibold text-gray-900">
                {event.confirmedParticipants}
                {event.capacity && ` / ${event.capacity}`}
              </p>
              {event.availableSpots !== undefined && (
                <p className={`text-sm ${hasAvailableSpots ? "text-green-600" : "text-red-600"}`}>
                  {hasAvailableSpots ? `${event.availableSpots} spots left` : "Full"}
                </p>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Price */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-sm font-medium text-gray-600">
              <Tag className="h-4 w-4" />
              Price
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="font-semibold text-gray-900">
              {event.price ? `${event.price} ${event.currency}` : "Free"}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Registration Status */}
      <Card className="border-2">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Clock className="h-5 w-5" />
            Registration Status
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-gray-600">Registration:</span>
              <Badge variant={isRegistrationOpen ? "default" : "secondary"}>
                {isRegistrationOpen ? "Open" : "Closed"}
              </Badge>
            </div>

            {event.registrationStartDate && (
              <div className="flex items-center justify-between">
                <span className="text-gray-600">Opens:</span>
                <span className="font-medium">{formatDateTime(event.registrationStartDate)}</span>
              </div>
            )}

            {event.registrationEndDate && (
              <div className="flex items-center justify-between">
                <span className="text-gray-600">Closes:</span>
                <span className="font-medium">{formatDateTime(event.registrationEndDate)}</span>
              </div>
            )}

            <div className="flex items-center justify-between">
              <span className="text-gray-600">Available Spots:</span>
              <span
                className={`font-medium ${hasAvailableSpots ? "text-green-600" : "text-red-600"}`}
              >
                {event.availableSpots !== undefined ? event.availableSpots : "Unlimited"}
              </span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Description */}
      <Card>
        <CardHeader>
          <CardTitle>About This Event</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="prose prose-gray max-w-none">
            <p className="leading-relaxed text-gray-700">{event.description}</p>
          </div>
        </CardContent>
      </Card>

      {/* Tags */}
      {event.tags.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Tags</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-2">
              {event.tags.map((tag) => (
                <Badge key={tag} variant="outline">
                  {tag}
                </Badge>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Additional Information */}
      <Card>
        <CardHeader>
          <CardTitle>Additional Information</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3 text-sm text-gray-600">
            <div className="flex items-center justify-between">
              <span>Approval Required:</span>
              <span className="font-medium">{event.requiresApproval ? "Yes" : "No"}</span>
            </div>

            <div className="flex items-center justify-between">
              <span>Event Type:</span>
              <span className="font-medium">Public</span>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
