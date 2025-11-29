"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Calendar, MapPin, Users, Clock } from "lucide-react";
import { format } from "date-fns";
import type { PublicEvent } from "@/types/features/event-registration";

interface EventCardProps {
  event: PublicEvent;
  variant?: "default" | "compact" | "detailed";
  onClick?: () => void;
}

export function EventCard({ event, variant = "default", onClick }: EventCardProps) {
  const formatDate = (date: Date) => format(date, "PPP");
  const formatTime = (date: Date) => format(date, "p");
  const formatDateTime = (date: Date) => format(date, "PPP p");

  const isRegistrationOpen = event.registrationOpen;
  const hasAvailableSpots = event.availableSpots !== undefined && event.availableSpots > 0;
  const isSoldOut = event.availableSpots !== undefined && event.availableSpots === 0;

  const getStatusBadge = () => {
    if (isSoldOut) {
      return <Badge variant="destructive">Sold Out</Badge>;
    }
    if (!isRegistrationOpen) {
      return <Badge variant="secondary">Registration Closed</Badge>;
    }
    if (hasAvailableSpots) {
      return <Badge variant="default">Open</Badge>;
    }
    return <Badge variant="outline">Limited</Badge>;
  };

  const getPriceDisplay = () => {
    if (!event.price || event.price === 0) {
      return "Free";
    }
    return `${event.price} ${event.currency}`;
  };

  const handleCardClick = () => {
    if (onClick) {
      onClick();
    }
  };

  if (variant === "compact") {
    return (
      <Card
        className={`cursor-pointer transition-all duration-200 hover:shadow-md ${
          onClick ? "hover:scale-[1.02]" : ""
        }`}
        onClick={handleCardClick}
      >
        <CardContent className="p-4">
          <div className="mb-2 flex items-start justify-between">
            <div className="min-w-0 flex-1">
              <h3 className="mb-1 truncate font-semibold text-gray-900">{event.title}</h3>
              <div className="mb-2 flex items-center gap-2 text-sm text-gray-600">
                <Calendar className="h-4 w-4" />
                <span>{formatDate(event.startDate)}</span>
              </div>
            </div>
            <div className="flex flex-col items-end gap-2">
              {getStatusBadge()}
              <div className="text-sm font-medium text-gray-900">{getPriceDisplay()}</div>
            </div>
          </div>

          {event.venue && (
            <div className="mb-2 flex items-center gap-2 text-sm text-gray-600">
              <MapPin className="h-4 w-4" />
              <span className="truncate">{event.venue}</span>
            </div>
          )}

          {event.tags && event.tags.length > 0 && (
            <div className="flex flex-wrap gap-1">
              {event.tags.slice(0, 3).map((tag, index) => (
                <Badge key={index} variant="outline" className="text-xs">
                  {tag}
                </Badge>
              ))}
              {event.tags.length > 3 && (
                <Badge variant="outline" className="text-xs">
                  +{event.tags.length - 3}
                </Badge>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    );
  }

  if (variant === "detailed") {
    return (
      <Card
        className={`cursor-pointer transition-all duration-200 hover:shadow-lg ${
          onClick ? "hover:scale-[1.01]" : ""
        }`}
        onClick={handleCardClick}
      >
        <CardHeader className="pb-3">
          <div className="flex items-start justify-between">
            <div className="min-w-0 flex-1">
              <CardTitle className="mb-2 line-clamp-2 text-xl font-bold text-gray-900">
                {event.title}
              </CardTitle>
              <div className="flex items-center gap-4 text-sm text-gray-600">
                <div className="flex items-center gap-1">
                  <Calendar className="h-4 w-4" />
                  <span>{formatDateTime(event.startDate)}</span>
                </div>
                {event.venue && (
                  <div className="flex items-center gap-1">
                    <MapPin className="h-4 w-4" />
                    <span>{event.venue}</span>
                  </div>
                )}
              </div>
            </div>
            <div className="flex flex-col items-end gap-2">
              {getStatusBadge()}
              <div className="text-lg font-bold text-gray-900">{getPriceDisplay()}</div>
            </div>
          </div>
        </CardHeader>

        <CardContent className="pt-0">
          {event.shortDescription && (
            <p className="mb-4 line-clamp-3 text-gray-700">{event.shortDescription}</p>
          )}

          <div className="mb-4 grid grid-cols-2 gap-4 md:grid-cols-4">
            <div className="text-center">
              <div className="text-lg font-semibold text-gray-900">
                {event.availableSpots !== undefined ? event.availableSpots : "∞"}
              </div>
              <div className="text-xs text-gray-600">Available Spots</div>
            </div>

            <div className="text-center">
              <div className="text-lg font-semibold text-gray-900">{event.capacity}</div>
              <div className="text-xs text-gray-600">Capacity</div>
            </div>

            <div className="text-center">
              <div className="text-lg font-semibold text-gray-900">
                {event.confirmedParticipants}
              </div>
              <div className="text-xs text-gray-600">Registered</div>
            </div>

            <div className="text-center">
              <div className="text-lg font-semibold text-gray-900">
                {event.averageRating ? `${event.averageRating}/5` : "N/A"}
              </div>
              <div className="text-xs text-gray-600">Rating</div>
            </div>
          </div>

          {event.tags && event.tags.length > 0 && (
            <div className="mb-4 flex flex-wrap gap-2">
              {event.tags.map((tag, index) => (
                <Badge key={index} variant="outline">
                  {tag}
                </Badge>
              ))}
            </div>
          )}

          <div className="flex items-center justify-between border-t border-gray-200 pt-3">
            <div className="flex items-center gap-2 text-sm text-gray-600">
              <Clock className="h-4 w-4" />
              <span>
                {event.registrationEndDate
                  ? `Registration ends ${formatDate(event.registrationEndDate)}`
                  : "Registration open until event starts"}
              </span>
            </div>

            {onClick && (
              <Button className="hover:text-primary-dark inline-flex items-center gap-2 text-sm font-medium text-primary transition-colors">
                <span>View Details</span>
              </Button>
            )}
          </div>
        </CardContent>
      </Card>
    );
  }

  // Default variant
  return (
    <Card
      className={`cursor-pointer transition-all duration-200 hover:shadow-md ${
        onClick ? "hover:scale-[1.02]" : ""
      } focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary`}
      onClick={handleCardClick}
      onKeyDown={(e) => {
        if (onClick && (e.key === "Enter" || e.key === " ")) {
          e.preventDefault();
          onClick();
        }
      }}
      tabIndex={onClick ? 0 : undefined}
      role={onClick ? "button" : undefined}
      aria-label={onClick ? `View details for ${event.title}` : undefined}
    >
      <CardHeader className="pb-3">
        <div className="mb-2 flex items-start justify-between">
          <div className="min-w-0 flex-1">
            <CardTitle
              className="mb-1 line-clamp-2 font-semibold text-gray-900"
              title={event.title}
            >
              {event.title}
            </CardTitle>
            <div className="flex items-center gap-2 text-sm text-gray-600">
              <Calendar className="h-4 w-4" aria-hidden="true" />
              <span>{formatDate(event.startDate)}</span>
              <span aria-hidden="true">•</span>
              <span className="sr-only">at</span>
              <span>{formatTime(event.startDate)}</span>
            </div>
          </div>
          <div className="flex flex-col items-end gap-2">
            {getStatusBadge()}
            <div className="text-sm font-medium text-gray-900">{getPriceDisplay()}</div>
          </div>
        </div>
      </CardHeader>

      <CardContent className="pt-0">
        {event.shortDescription && (
          <p className="mb-3 line-clamp-2 text-gray-700" title={event.shortDescription}>
            {event.shortDescription}
          </p>
        )}

        <div className="mb-3 space-y-2">
          {event.venue && (
            <div className="flex items-center gap-2 text-sm text-gray-600">
              <MapPin className="h-4 w-4" aria-hidden="true" />
              <span className="truncate" title={event.venue}>
                {event.venue}
              </span>
            </div>
          )}

          <div className="flex items-center gap-2 text-sm text-gray-600">
            <Users className="h-4 w-4" aria-hidden="true" />
            <span>
              {event.availableSpots !== undefined
                ? `${event.availableSpots} spots left`
                : `${event.confirmedParticipants} registered`}
            </span>
          </div>
        </div>

        {event.tags && event.tags.length > 0 && (
          <div className="mb-3 flex flex-wrap gap-1">
            {event.tags.slice(0, 3).map((tag, index) => (
              <Badge key={index} variant="outline" className="text-xs">
                {tag}
              </Badge>
            ))}
            {event.tags.length > 3 && (
              <Badge variant="outline" className="text-xs">
                +{event.tags.length - 3}
              </Badge>
            )}
          </div>
        )}

        <div className="flex items-center justify-between border-t border-gray-200 pt-3">
          <div className="text-xs text-gray-500">
            {event.registrationEndDate
              ? `Registration ends ${formatDate(event.registrationEndDate)}`
              : "Registration open"}
          </div>

          {onClick && (
            <Button
              className="hover:text-primary-dark inline-flex items-center gap-1 text-xs font-medium text-primary transition-colors"
              tabIndex={-1} // Prevent double tab stop since card is clickable
              aria-hidden="true" // Hidden because card itself is the button
            >
              <span>Details</span>
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
