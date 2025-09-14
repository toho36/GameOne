"use client";

import React from "react";

import type { EventCreationFormData, EventCreationFormErrors } from "@/types/event";

interface EventRegistrationControlProps {
  formData: EventCreationFormData;
  errors: EventCreationFormErrors;
  isLoading: boolean;
  // eslint-disable-next-line no-unused-vars
  updateFormData: (data: Partial<EventCreationFormData>) => void;
}

export function EventRegistrationControl({
  formData,
  errors,
  isLoading,
  updateFormData,
}: EventRegistrationControlProps) {
  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <label className="block text-sm font-medium text-gray-900">Registration Control</label>
        <div className="space-y-3">
          {/* Registration Control Mode Toggle */}
          <div className="flex items-center space-x-4">
            <label className="flex items-center">
              <input
                type="radio"
                name="registrationControlMode"
                value="manual"
                checked={formData.registrationControlMode === "manual"}
                onChange={(e) =>
                  updateFormData({
                    registrationControlMode: e.target.value as "manual" | "scheduled",
                  })
                }
                className="h-4 w-4 border-gray-300 text-blue-600 focus:ring-blue-500"
                disabled={isLoading}
              />
              <span className="ml-2 text-sm text-gray-700">Manual Control</span>
            </label>
            <label className="flex items-center">
              <input
                type="radio"
                name="registrationControlMode"
                value="scheduled"
                checked={formData.registrationControlMode === "scheduled"}
                onChange={(e) =>
                  updateFormData({
                    registrationControlMode: e.target.value as "manual" | "scheduled",
                  })
                }
                className="h-4 w-4 border-gray-300 text-blue-600 focus:ring-blue-500"
                disabled={isLoading}
              />
              <span className="ml-2 text-sm text-gray-700">Scheduled Control</span>
            </label>
          </div>

          {/* Manual Control Options */}
          {formData.registrationControlMode === "manual" && (
            <div className="ml-6 space-y-2">
              <label className="flex items-center">
                <input
                  type="radio"
                  name="registrationManualState"
                  value="open"
                  checked={formData.registrationManualState === "open"}
                  onChange={(e) =>
                    updateFormData({
                      registrationManualState: e.target.value as "open" | "closed",
                    })
                  }
                  className="h-4 w-4 border-gray-300 text-green-600 focus:ring-green-500"
                  disabled={isLoading}
                />
                <span className="ml-2 text-sm text-gray-700">Registration Open</span>
              </label>
              <label className="flex items-center">
                <input
                  type="radio"
                  name="registrationManualState"
                  value="closed"
                  checked={formData.registrationManualState === "closed"}
                  onChange={(e) =>
                    updateFormData({
                      registrationManualState: e.target.value as "open" | "closed",
                    })
                  }
                  className="h-4 w-4 border-gray-300 text-red-600 focus:ring-red-500"
                  disabled={isLoading}
                />
                <span className="ml-2 text-sm text-gray-700">Registration Closed</span>
              </label>
            </div>
          )}

          {/* Scheduled Control Options */}
          {formData.registrationControlMode === "scheduled" && (
            <div className="ml-6 grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <label
                  htmlFor="registrationStartDate"
                  className="block text-sm font-medium text-gray-700"
                >
                  Registration Opens
                </label>
                <input
                  type="datetime-local"
                  id="registrationStartDate"
                  value={
                    formData.registrationStartDate
                      ? new Date(
                          formData.registrationStartDate.getTime() -
                            formData.registrationStartDate.getTimezoneOffset() * 60000
                        )
                          .toISOString()
                          .slice(0, 16)
                      : ""
                  }
                  onChange={(e) =>
                    updateFormData({
                      registrationStartDate: e.target.value ? new Date(e.target.value) : undefined,
                    })
                  }
                  className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm placeholder-gray-400 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                  disabled={isLoading}
                />
                {errors.registrationStartDate && (
                  <p className="text-sm text-red-600">{errors.registrationStartDate}</p>
                )}
              </div>

              <div className="space-y-2">
                <label
                  htmlFor="registrationEndDate"
                  className="block text-sm font-medium text-gray-700"
                >
                  Registration Closes
                </label>
                <input
                  type="datetime-local"
                  id="registrationEndDate"
                  value={
                    formData.registrationEndDate
                      ? new Date(
                          formData.registrationEndDate.getTime() -
                            formData.registrationEndDate.getTimezoneOffset() * 60000
                        )
                          .toISOString()
                          .slice(0, 16)
                      : ""
                  }
                  onChange={(e) =>
                    updateFormData({
                      registrationEndDate: e.target.value ? new Date(e.target.value) : undefined,
                    })
                  }
                  className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm placeholder-gray-400 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                  disabled={isLoading}
                />
                {errors.registrationEndDate && (
                  <p className="text-sm text-red-600">{errors.registrationEndDate}</p>
                )}
              </div>
            </div>
          )}
        </div>
        {errors.registrationControlMode && (
          <p className="text-sm text-red-600">{errors.registrationControlMode}</p>
        )}
      </div>
    </div>
  );
}
