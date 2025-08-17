"use client";

import { useState, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { LoadingSpinner } from "@/components/ui/loading-spinner";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import {
  Check,
  X,
  MessageSquare,
  Clock,
  User,
  Calendar,
  AlertTriangle,
  Shield,
  Mail,
  Eye,
  History,
} from "lucide-react";
import type { Event, User as PrismaUser } from "@prisma/client";
import { EventStatus } from "@prisma/client";
import { cn } from "@/lib/utils";

interface EventModerationPanelProps {
  eventId: string;
  className?: string;
  // eslint-disable-next-line no-unused-vars
  onStatusChange?: (status: EventStatus) => void;
}

interface ExtendedEvent extends Event {
  creator: Pick<PrismaUser, "id" | "name" | "email">;
  moderationNotes?: ModerationNote[];
  moderationHistory?: ModerationAction[];
  _count?: {
    registrations: number;
  };
}

interface ModerationNote {
  id: string;
  content: string;
  authorId: string;
  author: Pick<PrismaUser, "id" | "name" | "email">;
  createdAt: Date;
  isInternal: boolean;
}

interface ModerationAction {
  id: string;
  action: "APPROVE" | "REJECT" | "REQUEST_CHANGES" | "SUSPEND" | "RESTORE";
  reason?: string;
  performedById: string;
  performedBy: Pick<PrismaUser, "id" | "name" | "email">;
  createdAt: Date;
  oldStatus?: EventStatus;
  newStatus?: EventStatus;
}

export function EventModerationPanel({
  eventId,
  className,
  onStatusChange,
}: EventModerationPanelProps) {
  // const t = useTranslations("EventModeration");

  const [event, setEvent] = useState<ExtendedEvent | null>(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [adminNote, setAdminNote] = useState("");
  const [rejectionReason, setRejectionReason] = useState("");
  const [showHistory, setShowHistory] = useState(false);

  const fetchEventDetails = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await fetch(`/api/admin/events/${eventId}/moderation`);
      if (!response.ok) {
        throw new Error("Failed to fetch event details");
      }

      const data = await response.json();
      setEvent(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unknown error");
    } finally {
      setLoading(false);
    }
  }, [eventId]);

  useEffect(() => {
    fetchEventDetails();
  }, [eventId, fetchEventDetails]);

  const handleModerationAction = async (action: ModerationAction["action"], reason?: string) => {
    if (!event) return;

    setActionLoading(true);
    try {
      const response = await fetch(`/api/admin/events/${eventId}/moderation`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          action,
          reason,
          adminNote: adminNote.trim() || undefined,
        }),
      });

      if (!response.ok) {
        throw new Error("Moderation action failed");
      }

      const updatedEvent = await response.json();
      setEvent(updatedEvent);
      setAdminNote("");
      setRejectionReason("");

      if (onStatusChange) {
        onStatusChange(updatedEvent.status);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Action failed");
    } finally {
      setActionLoading(false);
    }
  };

  const handleAddNote = async (isInternal: boolean = true) => {
    if (!adminNote.trim() || !event) return;

    setActionLoading(true);
    try {
      const response = await fetch(`/api/admin/events/${eventId}/notes`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          content: adminNote.trim(),
          isInternal,
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to add note");
      }

      await fetchEventDetails();
      setAdminNote("");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to add note");
    } finally {
      setActionLoading(false);
    }
  };

  const getStatusBadgeColor = (status: EventStatus) => {
    switch (status) {
      case "PUBLISHED":
        return "bg-green-100 text-green-800";
      case "DRAFT":
        return "bg-gray-100 text-gray-800";
      case "PENDING_APPROVAL":
        return "bg-yellow-100 text-yellow-800";
      case "REJECTED":
        return "bg-red-100 text-red-800";
      case "CANCELLED":
        return "bg-red-100 text-red-800";
      case "SUSPENDED":
        return "bg-orange-100 text-orange-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const canApprove = event?.status === "PENDING_APPROVAL" || event?.status === "DRAFT";
  const canReject = event?.status === "PENDING_APPROVAL" || event?.status === "DRAFT";
  const canSuspend = event?.status === "PUBLISHED";
  const canRestore = event?.status === "SUSPENDED" || event?.status === "REJECTED";

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <LoadingSpinner className="h-8 w-8" />
        <span className="ml-2 text-gray-600">Loading moderation panel...</span>
      </div>
    );
  }

  if (error || !event) {
    return (
      <Card className={className}>
        <CardContent className="pt-6">
          <div className="text-center">
            <AlertTriangle className="mx-auto mb-2 h-8 w-8 text-red-500" />
            <div className="font-medium text-red-600">{error || "Event not found"}</div>
            <Button onClick={fetchEventDetails} variant="outline" size="sm" className="mt-2">
              Retry
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className={cn("space-y-6", className)}>
      {/* Event Overview */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5 text-blue-600" />
            Event Moderation
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2">
              <div>
                <h3 className="font-semibold text-gray-900">{event.title}</h3>
                <p className="mt-1 text-sm text-gray-600">
                  Created by {event.creator.name || "Unknown"} ({event.creator.email})
                </p>
                <div className="mt-2 flex items-center gap-2">
                  <Calendar className="h-4 w-4 text-gray-400" />
                  <span className="text-sm text-gray-600">
                    {new Date(event.startDate).toLocaleDateString()} at{" "}
                    {new Date(event.startDate).toLocaleTimeString([], {
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </span>
                </div>
              </div>

              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <Badge className={getStatusBadgeColor(event.status)}>{event.status}</Badge>
                </div>
                <div className="text-sm text-gray-600">
                  <div>Capacity: {event.capacity}</div>
                  <div>Registrations: {event._count?.registrations || 0}</div>
                  <div>Type: {event.type}</div>
                </div>
              </div>
            </div>

            {/* Quick Actions */}
            <div className="flex items-center gap-2 border-t pt-4">
              <Button
                size="sm"
                variant="ghost"
                onClick={() => window.open(`/events/${event.id}`, "_blank")}
                className="flex items-center gap-1"
              >
                <Eye className="h-4 w-4" />
                View Event
              </Button>
              <Button
                size="sm"
                variant="ghost"
                onClick={() => window.open(`mailto:${event.creator.email}`, "_blank")}
                className="flex items-center gap-1"
              >
                <Mail className="h-4 w-4" />
                Contact Creator
              </Button>
              <Button
                size="sm"
                variant="ghost"
                onClick={() => setShowHistory(!showHistory)}
                className="flex items-center gap-1"
              >
                <History className="h-4 w-4" />
                {showHistory ? "Hide" : "Show"} History
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Moderation Actions */}
      <Card>
        <CardHeader>
          <CardTitle>Moderation Actions</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {/* Admin Note */}
            <div>
              <Label htmlFor="adminNote">Admin Note</Label>
              <Textarea
                id="adminNote"
                placeholder="Add internal note about this event..."
                value={adminNote}
                onChange={(e) => setAdminNote(e.target.value)}
                className="mt-1"
                rows={3}
              />
              <div className="mt-2 flex gap-2">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => handleAddNote(true)}
                  disabled={!adminNote.trim() || actionLoading}
                  className="flex items-center gap-1"
                >
                  <MessageSquare className="h-4 w-4" />
                  Add Internal Note
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => handleAddNote(false)}
                  disabled={!adminNote.trim() || actionLoading}
                  className="flex items-center gap-1"
                >
                  <Mail className="h-4 w-4" />
                  Send to Creator
                </Button>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex flex-wrap gap-2 border-t pt-4">
              {canApprove && (
                <Button
                  onClick={() => handleModerationAction("APPROVE")}
                  disabled={actionLoading}
                  className="flex items-center gap-1 bg-green-600 hover:bg-green-700"
                >
                  <Check className="h-4 w-4" />
                  Approve Event
                </Button>
              )}

              {canReject && (
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button
                      variant="destructive"
                      disabled={actionLoading}
                      className="flex items-center gap-1"
                    >
                      <X className="h-4 w-4" />
                      Reject Event
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>Reject Event</AlertDialogTitle>
                      <AlertDialogDescription>
                        Please provide a reason for rejecting this event. This will be sent to the
                        creator.
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <div className="my-4">
                      <Label htmlFor="rejectionReason">Rejection Reason</Label>
                      <Textarea
                        id="rejectionReason"
                        placeholder="Explain why this event is being rejected..."
                        value={rejectionReason}
                        onChange={(e) => setRejectionReason(e.target.value)}
                        className="mt-1"
                        rows={4}
                      />
                    </div>
                    <AlertDialogFooter>
                      <AlertDialogCancel>Cancel</AlertDialogCancel>
                      <AlertDialogAction
                        onClick={() => handleModerationAction("REJECT", rejectionReason)}
                        disabled={!rejectionReason.trim()}
                        className="bg-red-600 hover:bg-red-700"
                      >
                        Reject Event
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              )}

              {canSuspend && (
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button
                      variant="outline"
                      disabled={actionLoading}
                      className="flex items-center gap-1 border-orange-500 text-orange-600 hover:bg-orange-50"
                    >
                      <AlertTriangle className="h-4 w-4" />
                      Suspend Event
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>Suspend Event</AlertDialogTitle>
                      <AlertDialogDescription>
                        This will temporarily suspend the event. Registrations will be paused and
                        the event will not be visible to users.
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>Cancel</AlertDialogCancel>
                      <AlertDialogAction
                        onClick={() => handleModerationAction("SUSPEND")}
                        className="bg-orange-600 hover:bg-orange-700"
                      >
                        Suspend Event
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              )}

              {canRestore && (
                <Button
                  onClick={() => handleModerationAction("RESTORE")}
                  disabled={actionLoading}
                  variant="outline"
                  className="flex items-center gap-1 border-green-500 text-green-600 hover:bg-green-50"
                >
                  <Check className="h-4 w-4" />
                  Restore Event
                </Button>
              )}

              <Button
                onClick={() => handleModerationAction("REQUEST_CHANGES")}
                disabled={actionLoading}
                variant="outline"
                className="flex items-center gap-1"
              >
                <MessageSquare className="h-4 w-4" />
                Request Changes
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Admin Notes */}
      {event.moderationNotes && event.moderationNotes.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Admin Notes</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {event.moderationNotes.map((note) => (
                <div key={note.id} className="rounded-lg border-l-4 border-blue-500 bg-gray-50 p-3">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <p className="text-sm text-gray-900">{note.content}</p>
                      <div className="mt-2 flex items-center gap-2 text-xs text-gray-500">
                        <User className="h-3 w-3" />
                        <span>{note.author.name || "Unknown"}</span>
                        <Clock className="ml-2 h-3 w-3" />
                        <span>{new Date(note.createdAt).toLocaleString()}</span>
                        {note.isInternal && (
                          <Badge variant="secondary" className="ml-2 text-xs">
                            Internal
                          </Badge>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Moderation History */}
      {showHistory && event.moderationHistory && event.moderationHistory.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Moderation History</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {event.moderationHistory.map((action) => (
                <div key={action.id} className="rounded-lg bg-gray-50 p-3">
                  <div className="flex items-start justify-between">
                    <div>
                      <div className="flex items-center gap-2">
                        <Badge variant="outline">{action.action}</Badge>
                        {action.oldStatus && action.newStatus && (
                          <span className="text-sm text-gray-600">
                            {action.oldStatus} → {action.newStatus}
                          </span>
                        )}
                      </div>
                      {action.reason && (
                        <p className="mt-1 text-sm text-gray-700">{action.reason}</p>
                      )}
                      <div className="mt-2 flex items-center gap-2 text-xs text-gray-500">
                        <User className="h-3 w-3" />
                        <span>{action.performedBy.name || "Unknown"}</span>
                        <Clock className="ml-2 h-3 w-3" />
                        <span>{new Date(action.createdAt).toLocaleString()}</span>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
