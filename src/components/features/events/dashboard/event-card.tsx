import { format } from "date-fns";
import {
  PencilIcon,
  TrashIcon,
  EyeIcon,
  EyeSlashIcon,
  MapPinIcon,
  CalendarIcon,
  UsersIcon,
  CurrencyDollarIcon,
  GlobeAltIcon,
} from "@heroicons/react/24/outline";

import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { EventCardProps } from "./event-dashboard.types";

export function EventCard({ event, onEdit, onDelete, onToggleStatus }: EventCardProps) {
  const statusColors = {
    DRAFT: "bg-yellow-100 text-yellow-800",
    PUBLISHED: "bg-green-100 text-green-800",
    CANCELLED: "bg-red-100 text-red-800",
  };

  const typeColors = {
    CONFERENCE: "bg-blue-100 text-blue-800",
    WORKSHOP: "bg-purple-100 text-purple-800",
    WEBINAR: "bg-indigo-100 text-indigo-800",
    NETWORKING: "bg-pink-100 text-pink-800",
    SOCIAL: "bg-orange-100 text-orange-800",
    OTHER: "bg-gray-100 text-gray-800",
  };

  const formatDate = (date: Date) => {
    return format(new Date(date), "MMM dd, yyyy • HH:mm");
  };

  const getLocationDisplay = () => {
    if (event.isOnline) {
      return (
        <div className="flex items-center gap-1 text-sm text-gray-600">
          <GlobeAltIcon className="h-4 w-4" />
          Online Event
        </div>
      );
    }

    return (
      <div className="flex items-center gap-1 text-sm text-gray-600">
        <MapPinIcon className="h-4 w-4" />
        {event.venue
          ? `${event.venue}${event.city ? `, ${event.city}` : ""}`
          : event.city || "Location TBD"}
      </div>
    );
  };

  const canDelete = event.registrationCount === 0 && event.waitingListCount === 0;

  return (
    <div className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm transition-shadow hover:shadow-md">
      {/* Header */}
      <div className="mb-4 flex items-start justify-between">
        <div className="min-w-0 flex-1">
          <div className="mb-2 flex items-center gap-3">
            <h3 className="truncate text-lg font-semibold text-gray-900">{event.title}</h3>
            <Badge className={statusColors[event.status as keyof typeof statusColors]}>
              {event.status}
            </Badge>
            <Badge className={typeColors[event.type as keyof typeof typeColors]}>
              {event.type}
            </Badge>
          </div>

          <div className="flex items-center gap-1 text-sm text-gray-600">
            <CalendarIcon className="h-4 w-4" />
            {formatDate(event.startDate)}
            {event.endDate && (
              <>
                <span className="mx-1">→</span>
                {formatDate(event.endDate)}
              </>
            )}
          </div>
        </div>

        {event.isPastEvent && <Badge className="ml-2 bg-gray-100 text-gray-600">Past Event</Badge>}
      </div>

      {/* Details Grid */}
      <div className="mb-4 grid grid-cols-2 gap-4 text-sm md:grid-cols-4">
        <div>
          <div className="mb-1 flex items-center gap-1 text-gray-600">
            <UsersIcon className="h-4 w-4" />
            Capacity
          </div>
          <div className="font-medium">
            {event.registrationCount}/{event.capacity}
            {event.waitingListCount > 0 && (
              <span className="ml-1 text-gray-500">(+{event.waitingListCount} waiting)</span>
            )}
          </div>
        </div>

        <div>
          <div className="mb-1 text-gray-600">Available Spots</div>
          <div
            className={`font-medium ${
              event.availableSpots === 0 ? "text-red-600" : "text-green-600"
            }`}
          >
            {event.availableSpots}
          </div>
        </div>

        <div>
          <div className="mb-1 flex items-center gap-1 text-gray-600">
            <CurrencyDollarIcon className="h-4 w-4" />
            Price
          </div>
          <div className="font-medium">
            {event.price ? `${event.price} ${event.currency || "CZK"}` : "Free"}
          </div>
        </div>

        <div>
          <div className="mb-1 text-gray-600">Registration</div>
          <div
            className={`font-medium ${
              event.isRegistrationOpen ? "text-green-600" : "text-red-600"
            }`}
          >
            {event.isRegistrationOpen ? "Open" : "Closed"}
          </div>
        </div>
      </div>

      {/* Location */}
      <div className="mb-4">{getLocationDisplay()}</div>

      {/* Actions */}
      <div className="flex flex-wrap gap-2">
        <Button
          variant="outline"
          size="sm"
          onClick={() => onEdit(event.id)}
          className="flex items-center gap-2"
        >
          <PencilIcon className="h-4 w-4" />
          Edit
        </Button>

        <Button
          variant="outline"
          size="sm"
          onClick={() => onToggleStatus(event.id, event.status)}
          className="flex items-center gap-2"
        >
          {event.status === "PUBLISHED" ? (
            <>
              <EyeSlashIcon className="h-4 w-4" />
              Unpublish
            </>
          ) : (
            <>
              <EyeIcon className="h-4 w-4" />
              Publish
            </>
          )}
        </Button>

        {canDelete && (
          <Button
            variant="outline"
            size="sm"
            onClick={() => onDelete(event.id)}
            className="flex items-center gap-2 text-red-600 hover:border-red-300 hover:text-red-700"
          >
            <TrashIcon className="h-4 w-4" />
            Delete
          </Button>
        )}

        {!canDelete && (
          <div className="mt-1 flex items-center text-xs text-gray-500">
            Cannot delete: event has registrations
          </div>
        )}
      </div>
    </div>
  );
}
