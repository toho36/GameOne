"use client";

import React, { useState, useEffect, useCallback, useMemo } from "react";
import { useTranslations } from "next-intl";
import { AlertTriangle, Users, UserCheck, UserX, AlertCircle } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { logger } from "@/lib/logger";
import type { Event, Registration } from "@prisma/client";

interface WaitingListEntry {
  id: string;
  position: number;
  groupSize: number;
}

interface RegistrationImpactValidatorProps {
  event: Event & {
    registrations?: Registration[];
    waitingList?: WaitingListEntry[];
  };
  newCapacity?: number;
  newStartDate?: Date;
  newEndDate?: Date;
  newRegistrationEndDate?: Date;
  // eslint-disable-next-line no-unused-vars
  onValidationComplete: (isValid: boolean, warnings: string[], criticalIssues: string[]) => void;
  onRollback?: () => void;
}

interface ValidationResult {
  isValid: boolean;
  warnings: string[];
  criticalIssues: string[];
  impactLevel: "safe" | "warning" | "critical";
  affectedRegistrations: number;
  recommendations: string[];
}

export function RegistrationImpactValidator({
  event,
  newCapacity,
  newStartDate,
  newEndDate,
  newRegistrationEndDate,
  onValidationComplete,
  onRollback,
}: RegistrationImpactValidatorProps) {
  const [validationResult, setValidationResult] = useState<ValidationResult | null>(null);
  const [showConfirmationDialog, setShowConfirmationDialog] = useState(false);
  const [showRollbackDialog, setShowRollbackDialog] = useState(false);
  const [hasRollbackData, setHasRollbackData] = useState(false);

  const t = useTranslations("RegistrationImpactValidator");

  // Calculate current registration statistics
  const currentStats = useMemo(() => {
    if (!event?.registrations) return null;

    try {
      return {
        total: event.registrations.length,
        confirmed: event.registrations.filter((r) => r?.status === "CONFIRMED").length,
        pending: event.registrations.filter((r) => r?.status === "PENDING").length,
        waitingList: event.waitingList?.length || 0, // Use separate waitingList array
      };
    } catch (error) {
      logger.error("Error calculating registration statistics:", error);
      return null;
    }
  }, [event.registrations, event.waitingList]);

  // Validate changes and their impact
  const validateChanges = useCallback(async (): Promise<ValidationResult> => {
    try {
      const result: ValidationResult = {
        isValid: true,
        warnings: [],
        criticalIssues: [],
        impactLevel: "safe",
        affectedRegistrations: 0,
        recommendations: [],
      };

      // Check capacity changes
      if (newCapacity && newCapacity < event.capacity) {
        const confirmedCount = currentStats?.confirmed || 0;
        if (newCapacity < confirmedCount) {
          result.isValid = false;
          result.criticalIssues.push(
            t("capacityReductionWarning", {
              current: event.capacity,
              new: newCapacity,
              confirmed: confirmedCount,
            })
          );
          result.affectedRegistrations = confirmedCount - newCapacity;
          result.impactLevel = "critical";
        } else if (newCapacity < event.capacity) {
          result.warnings.push(
            t("capacityReductionWarning", {
              current: event.capacity,
              new: newCapacity,
              confirmed: confirmedCount,
            })
          );
          result.impactLevel = "warning";
        }
      }

      // Check date changes
      if (newStartDate && newStartDate > event.startDate) {
        const earlyRegistrations =
          event.registrations?.filter((r) => new Date(r.registeredAt) < newStartDate).length || 0;

        if (earlyRegistrations > 0) {
          result.warnings.push(
            `${earlyRegistrations} registrations were made before the new start date`
          );
        }
      }

      if (newEndDate && event.endDate && newEndDate < event.endDate) {
        const lateRegistrations =
          event.registrations?.filter((r) => new Date(r.registeredAt) > newEndDate).length || 0;

        if (lateRegistrations > 0) {
          result.warnings.push(
            `${lateRegistrations} registrations were made after the new end date`
          );
        }
      }

      // Check registration deadline changes
      if (
        newRegistrationEndDate &&
        event.registrationEndDate &&
        newRegistrationEndDate < event.registrationEndDate
      ) {
        const lateRegistrations =
          event.registrations?.filter((r) => new Date(r.registeredAt) > newRegistrationEndDate)
            .length || 0;

        if (lateRegistrations > 0) {
          result.warnings.push(
            `${lateRegistrations} registrations were made after the new registration deadline`
          );
          result.impactLevel = "warning";
        }
      }

      // Payment requirement changes - this would need to be passed as a prop to compare
      // For now, we'll skip this validation until we have the new values

      // Online/offline changes - this would need to be passed as a prop to compare
      // For now, we'll skip this validation until we have the new values

      setValidationResult(result);
      return result;
    } catch (error) {
      logger.error("Validation error:", error);
      return {
        isValid: false,
        warnings: [],
        criticalIssues: ["Validation failed due to an error"],
        impactLevel: "critical",
        affectedRegistrations: 0,
        recommendations: [],
      };
    }
  }, [event, newCapacity, newStartDate, newEndDate, newRegistrationEndDate, currentStats, t]);

  // Run validation when props change
  useEffect(() => {
    if (newCapacity !== undefined || newStartDate || newEndDate || newRegistrationEndDate) {
      validateChanges();
    }
  }, [newCapacity, newStartDate, newEndDate, newRegistrationEndDate, validateChanges]);

  // Notify parent component of validation results
  useEffect(() => {
    if (validationResult) {
      onValidationComplete(
        validationResult.isValid,
        validationResult.warnings,
        validationResult.criticalIssues
      );
    }
  }, [validationResult, onValidationComplete]);

  // Handle rollback
  const handleRollback = useCallback(() => {
    setShowRollbackDialog(true);
  }, []);

  const confirmRollback = useCallback(() => {
    if (onRollback) {
      onRollback();
      setShowRollbackDialog(false);
      setHasRollbackData(false);
    }
  }, [onRollback]);

  // Show confirmation dialog for critical changes
  const handleCriticalChangeConfirmation = useCallback(() => {
    setShowConfirmationDialog(true);
  }, []);

  const confirmCriticalChanges = useCallback(() => {
    setShowConfirmationDialog(false);
    // Continue with the changes
  }, []);

  if (!validationResult) {
    return null;
  }

  const hasWarnings = validationResult.warnings.length > 0;
  const hasCriticalIssues = validationResult.criticalIssues.length > 0;
  const showRollbackButton = hasRollbackData && onRollback;

  return (
    <>
      <Card className="mt-6 border-amber-200 bg-amber-50">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-amber-800">
            <AlertTriangle className="h-5 w-5" />
            {t("title")}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Registration Statistics */}
          <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-600">{currentStats?.total}</div>
              <div className="text-sm text-gray-600">{t("totalRegistrations")}</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-green-600">{currentStats?.confirmed}</div>
              <div className="text-sm text-gray-600">{t("confirmedRegistrations")}</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-yellow-600">{currentStats?.pending}</div>
              <div className="text-sm text-gray-600">{t("pendingRegistrations")}</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-orange-600">{currentStats?.waitingList}</div>
              <div className="text-sm text-gray-600">{t("waitingList")}</div>
            </div>
          </div>

          {/* Capacity Impact */}
          {newCapacity !== undefined && newCapacity !== event.capacity && (
            <Alert className="border-blue-200 bg-blue-50">
              <Users className="h-4 w-4 text-blue-600" />
              <AlertDescription className="text-blue-800">
                <strong>{t("capacityChange")}:</strong> {event.capacity} → {newCapacity}
                {newCapacity < event.capacity && (
                  <span className="mt-1 block text-red-600">
                    {t("capacityReductionWarning", {
                      current: event.capacity,
                      new: newCapacity,
                      confirmed: currentStats?.confirmed || 0,
                    })}
                  </span>
                )}
              </AlertDescription>
            </Alert>
          )}

          {/* Warnings */}
          {hasWarnings && (
            <Alert className="border-yellow-200 bg-yellow-50">
              <AlertCircle className="h-4 w-4 text-yellow-600" />
              <AlertDescription className="text-yellow-800">
                <strong>{t("warnings")}:</strong>
                <ul className="mt-2 list-inside list-disc space-y-1">
                  {validationResult.warnings.map((warning, index) => (
                    <li key={index}>{warning}</li>
                  ))}
                </ul>
              </AlertDescription>
            </Alert>
          )}

          {/* Critical Issues */}
          {hasCriticalIssues && (
            <Alert className="border-red-200 bg-red-50">
              <AlertTriangle className="h-4 w-4 text-red-600" />
              <AlertDescription className="text-red-800">
                <strong>{t("criticalIssues")}:</strong>
                <ul className="mt-2 list-inside list-disc space-y-1">
                  {validationResult.criticalIssues.map((issue, index) => (
                    <li key={index}>{issue}</li>
                  ))}
                </ul>
              </AlertDescription>
            </Alert>
          )}

          {/* Action Buttons */}
          <div className="flex flex-wrap gap-2">
            {hasCriticalIssues && (
              <Button
                variant="destructive"
                onClick={handleCriticalChangeConfirmation}
                className="flex items-center gap-2"
              >
                <AlertTriangle className="h-4 w-4" />
                {t("proceedWithChanges")}
              </Button>
            )}

            {showRollbackButton && (
              <Button
                variant="outline"
                onClick={handleRollback}
                className="flex items-center gap-2"
              >
                <UserX className="h-4 w-4" />
                {t("rollbackChanges")}
              </Button>
            )}
          </div>

          {/* Validation Status */}
          <div className="flex items-center justify-between rounded-lg bg-white p-3">
            <div className="flex items-center gap-2">
              {validationResult.isValid ? (
                <UserCheck className="h-5 w-5 text-green-600" />
              ) : (
                <UserX className="h-5 w-5 text-red-600" />
              )}
              <span className={validationResult.isValid ? "text-green-700" : "text-red-700"}>
                {validationResult.isValid ? t("validationPassed") : t("validationFailed")}
              </span>
            </div>
            <Badge variant={validationResult.isValid ? "default" : "destructive"}>
              {validationResult.isValid ? t("safeToProceed") : t("requiresAttention")}
            </Badge>
          </div>
        </CardContent>
      </Card>

      {/* Critical Changes Confirmation Dialog */}
      <Dialog open={showConfirmationDialog} onOpenChange={setShowConfirmationDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="text-red-600">{t("confirmationDialog.title")}</DialogTitle>
            <DialogDescription>{t("confirmationDialog.description")}</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <Alert className="border-red-200 bg-red-50">
              <AlertTriangle className="h-4 w-4 text-red-600" />
              <AlertDescription className="text-red-800">
                {t("confirmationDialog.warning")}
              </AlertDescription>
            </Alert>
            <ul className="list-inside list-disc space-y-1 text-sm text-gray-700">
              {validationResult.criticalIssues.map((issue, index) => (
                <li key={index}>{issue}</li>
              ))}
            </ul>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowConfirmationDialog(false)}>
              {t("confirmationDialog.cancel")}
            </Button>
            <Button variant="destructive" onClick={confirmCriticalChanges}>
              {t("confirmationDialog.proceed")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Rollback Confirmation Dialog */}
      <Dialog open={showRollbackDialog} onOpenChange={setShowRollbackDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t("rollbackDialog.title")}</DialogTitle>
            <DialogDescription>{t("rollbackDialog.description")}</DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowRollbackDialog(false)}>
              {t("rollbackDialog.cancel")}
            </Button>
            <Button variant="destructive" onClick={confirmRollback}>
              {t("rollbackDialog.confirm")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
