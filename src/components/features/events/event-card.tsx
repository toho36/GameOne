import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useTranslations } from "next-intl";
import { format } from "date-fns";
import { Calendar, MapPin, Users, MoreHorizontal, Edit, Eye, Settings, Trash2 } from "lucide-react";
import type { Event, Registration } from "@prisma/client";

interface EventCardProps {
  event: Event & {
    registrations?: Registration[];
    category?: { name: string; color?: string };
  };
  // eslint-disable-next-line no-unused-vars
  onEdit?: (eventId: string) => void;
  // eslint-disable-next-line no-unused-vars
  onView?: (eventId: string) => void;
  // eslint-disable-next-line no-unused-vars
  onManage?: (eventId: string) => void;
  // eslint-disable-next-line no-unused-vars
  onDelete?: (eventId: string) => void;
  className?: string;
}

export function EventCard({
  event,
  onEdit,
  onView,
  onManage,
  onDelete,
  className,
}: EventCardProps) {
  const t = useTranslations("EventCard");

  // Calculate registration metrics
  const confirmedRegistrations =
    event.registrations?.filter((r) => r.status === "CONFIRMED").length || 0;
  const waitingListCount = event.registrations?.filter((r) => r.status === "PENDING").length || 0;
  const availableSpots = event.capacity - confirmedRegistrations;
  const isFull = availableSpots <= 0;

  // Format dates
  const formatDate = (date: Date) => format(new Date(date), "MMM dd, yyyy");

  // Get status badge variant
  const getStatusVariant = (status: string) => {
    switch (status) {
      case "DRAFT":
        return "secondary";
      case "PUBLISHED":
        return "default";
      case "CANCELLED":
        return "destructive";
      case "COMPLETED":
        return "outline";
      case "POSTPONED":
        return "secondary";
      default:
        return "secondary";
    }
  };

  // Get status color
  const getStatusColor = (status: string) => {
    switch (status) {
      case "DRAFT":
        return "bg-gray-100 text-gray-800";
      case "PUBLISHED":
        return "bg-green-100 text-green-800";
      case "CANCELLED":
        return "bg-red-100 text-red-800";
      case "COMPLETED":
        return "bg-blue-100 text-blue-800";
      case "POSTPONED":
        return "bg-yellow-100 text-yellow-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  return (
    <Card className={cn("transition-all duration-200 hover:shadow-md", className)}>
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <div className="mb-2 flex items-center gap-2">
              <Badge
                variant={getStatusVariant(event.status)}
                className={getStatusColor(event.status)}
              >
                {t(`status.${event.status.toLowerCase()}`)}
              </Badge>
              {event.category && (
                <Badge variant="outline" className="text-xs">
                  {event.category.name}
                </Badge>
              )}
            </div>
            <h3 className="line-clamp-2 text-lg font-semibold text-gray-900">{event.title}</h3>
            {event.shortDescription && (
              <p className="mt-1 line-clamp-2 text-sm text-gray-600">{event.shortDescription}</p>
            )}
          </div>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                <MoreHorizontal className="h-4 w-4" />
                <span className="sr-only">Open menu</span>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              {onView && (
                <DropdownMenuItem onClick={() => onView(event.id)}>
                  <Eye className="mr-2 h-4 w-4" />
                  {t("actions.view")}
                </DropdownMenuItem>
              )}
              {onEdit && (
                <DropdownMenuItem onClick={() => onEdit(event.id)}>
                  <Edit className="mr-2 h-4 w-4" />
                  {t("actions.edit")}
                </DropdownMenuItem>
              )}
              {onManage && (
                <DropdownMenuItem onClick={() => onManage(event.id)}>
                  <Settings className="mr-2 h-4 w-4" />
                  {t("actions.manage")}
                </DropdownMenuItem>
              )}
              {onDelete && (
                <DropdownMenuItem
                  onClick={() => onDelete(event.id)}
                  className="text-red-600 focus:text-red-600"
                >
                  <Trash2 className="mr-2 h-4 w-4" />
                  {t("actions.delete")}
                </DropdownMenuItem>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </CardHeader>

      <CardContent className="pb-3">
        <div className="space-y-3">
          {/* Date and Time */}
          <div className="flex items-center gap-2 text-sm text-gray-600">
            <Calendar className="h-4 w-4" />
            <span>
              {t("dates.starts", { date: formatDate(event.startDate) })}
              {event.endDate && (
                <>
                  {" - "}
                  {t("dates.ends", { date: formatDate(event.endDate) })}
                </>
              )}
            </span>
          </div>

          {/* Location */}
          {!event.isOnline && event.venue && (
            <div className="flex items-center gap-2 text-sm text-gray-600">
              <MapPin className="h-4 w-4" />
              <span className="line-clamp-1">{event.venue}</span>
            </div>
          )}

          {/* Online indicator */}
          {event.isOnline && (
            <div className="flex items-center gap-2 text-sm text-blue-600">
              <div className="h-2 w-2 rounded-full bg-blue-500" />
              <span>Online Event</span>
            </div>
          )}

          {/* Registration metrics */}
          <div className="flex items-center gap-2 text-sm text-gray-600">
            <Users className="h-4 w-4" />
            <span>
              {t("metrics.registrations", { count: confirmedRegistrations })}
              {event.capacity && (
                <>
                  {" / "}
                  {t("metrics.capacity", { capacity: event.capacity })}
                </>
              )}
            </span>
          </div>

          {/* Capacity status */}
          {event.capacity && (
            <div className="flex items-center justify-between">
              <div className="mr-3 h-2 flex-1 rounded-full bg-gray-200">
                <div
                  className={cn(
                    "h-2 rounded-full transition-all duration-300",
                    isFull ? "bg-red-500" : "bg-green-500"
                  )}
                  style={{
                    width: `${Math.min((confirmedRegistrations / event.capacity) * 100, 100)}%`,
                  }}
                />
              </div>
              <span className="text-xs text-gray-500">
                {isFull ? t("metrics.full") : t("metrics.available", { available: availableSpots })}
              </span>
            </div>
          )}

          {/* Waiting list */}
          {event.allowWaitingList && waitingListCount > 0 && (
            <div className="text-sm text-amber-600">
              {t("metrics.waitingList", { count: waitingListCount })}
            </div>
          )}

          {/* Price */}
          {event.requiresPayment && event.price && (
            <div className="text-sm font-medium text-gray-900">
              {event.price.toString()} {event.currency}
            </div>
          )}
        </div>
      </CardContent>

      <CardFooter className="pt-0">
        <div className="flex w-full gap-2">
          {onView && (
            <Button variant="outline" size="sm" onClick={() => onView(event.id)} className="flex-1">
              {t("actions.view")}
            </Button>
          )}
          {onEdit && (
            <Button variant="outline" size="sm" onClick={() => onEdit(event.id)} className="flex-1">
              {t("actions.edit")}
            </Button>
          )}
          {onManage && (
            <Button size="sm" onClick={() => onManage(event.id)} className="flex-1">
              {t("actions.manage")}
            </Button>
          )}
        </div>
      </CardFooter>
    </Card>
  );
}
