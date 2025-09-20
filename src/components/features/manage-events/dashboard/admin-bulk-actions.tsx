"use client";

import { useState } from "react";
import {
  XMarkIcon,
  TrashIcon,
  EyeIcon,
  EyeSlashIcon,
  ExclamationTriangleIcon,
} from "@heroicons/react/24/outline";

import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { postJson } from "@/lib/api/client";
import { normalizeApiError } from "@/lib/api/errors";
import { logger } from "@/lib/logger";

interface AdminBulkActionsProps {
  selectedEvents: string[];
  onClearSelection: () => void;
  onRefresh: () => void;
  isAdmin: boolean;
}

export function AdminBulkActions({
  selectedEvents,
  onClearSelection,
  onRefresh,
  isAdmin,
}: AdminBulkActionsProps) {
  const [isProcessing, setIsProcessing] = useState(false);
  const [action, setAction] = useState<string | null>(null);

  if (!isAdmin || selectedEvents.length === 0) {
    return null;
  }

  const handleBulkAction = async (actionType: string) => {
    if (selectedEvents.length === 0) return;

    setIsProcessing(true);
    setAction(actionType);

    try {
      const promises = selectedEvents.map((eventId) => {
        switch (actionType) {
          case "publish":
            return postJson(`/api/events/${eventId}/publish`, { action: "publish" });
          case "unpublish":
            return postJson(`/api/events/${eventId}/publish`, { action: "unpublish" });
          case "delete":
            return fetch(`/api/events/${eventId}`, { method: "DELETE" });
          default:
            return Promise.resolve();
        }
      });

      await Promise.all(promises);
      onRefresh();
      onClearSelection();
    } catch (error) {
      const message = normalizeApiError(error);
      logger.error(`Bulk ${actionType} failed`, message);
      // eslint-disable-next-line no-alert
      alert(`Bulk ${actionType} failed: ${message}`);
    } finally {
      setIsProcessing(false);
      setAction(null);
    }
  };

  const getActionIcon = (actionType: string) => {
    switch (actionType) {
      case "publish":
        return <EyeIcon className="h-4 w-4" />;
      case "unpublish":
        return <EyeSlashIcon className="h-4 w-4" />;
      case "delete":
        return <TrashIcon className="h-4 w-4" />;
      default:
        return null;
    }
  };

  return (
    <div className="rounded-lg border border-blue-200 bg-blue-50 p-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Badge variant="secondary" className="flex items-center gap-1">
            <ExclamationTriangleIcon className="h-3 w-3" />
            Admin Actions
          </Badge>
          <span className="text-sm font-medium text-blue-800">
            {selectedEvents.length} event{selectedEvents.length > 1 ? "s" : ""} selected
          </span>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => handleBulkAction("publish")}
            disabled={isProcessing}
            className="flex items-center gap-2"
          >
            {getActionIcon("publish")}
            Publish All
          </Button>

          <Button
            variant="outline"
            size="sm"
            onClick={() => handleBulkAction("unpublish")}
            disabled={isProcessing}
            className="flex items-center gap-2"
          >
            {getActionIcon("unpublish")}
            Unpublish All
          </Button>

          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              if (
                // eslint-disable-next-line no-alert
                confirm(
                  `Are you sure you want to delete ${selectedEvents.length} events? This action cannot be undone.`
                )
              ) {
                handleBulkAction("delete");
              }
            }}
            disabled={isProcessing}
            className="flex items-center gap-2 text-red-600 hover:border-red-300 hover:text-red-700"
          >
            {getActionIcon("delete")}
            Delete All
          </Button>

          <Button
            variant="ghost"
            size="sm"
            onClick={onClearSelection}
            disabled={isProcessing}
            className="flex items-center gap-2"
          >
            <XMarkIcon className="h-4 w-4" />
            Clear
          </Button>
        </div>
      </div>

      {isProcessing && (
        <div className="mt-3 flex items-center gap-2 text-sm text-blue-700">
          <div className="h-4 w-4 animate-spin rounded-full border-2 border-blue-600 border-t-transparent"></div>
          Processing {action}...
        </div>
      )}
    </div>
  );
}
