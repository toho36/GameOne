"use client";

import React from "react";
import { Calendar, Search, Filter, Users, MapPin } from "lucide-react";

interface EmptyStateProps {
  title: string;
  description: string;
  icon?: "calendar" | "search" | "filter" | "users" | "map" | string;
  action?: React.ReactNode;
}

export function EmptyState({ title, description, icon = "calendar", action }: EmptyStateProps) {
  const getIcon = () => {
    switch (icon) {
      case "calendar":
        return <Calendar className="h-12 w-12 text-gray-300" />;
      case "search":
        return <Search className="h-12 w-12 text-gray-300" />;
      case "filter":
        return <Filter className="h-12 w-12 text-gray-300" />;
      case "users":
        return <Users className="h-12 w-12 text-gray-300" />;
      case "map":
        return <MapPin className="h-12 w-12 text-gray-300" />;
      default:
        return <Calendar className="h-12 w-12 text-gray-300" />;
    }
  };

  return (
    <div className="py-12 text-center">
      <div className="mx-auto mb-4">{getIcon()}</div>
      <h3 className="mb-2 text-lg font-medium text-gray-900">{title}</h3>
      <p className="mx-auto mb-6 max-w-md text-gray-600">{description}</p>
      {action && <div className="flex justify-center">{action}</div>}
    </div>
  );
}
