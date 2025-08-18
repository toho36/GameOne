import { CalendarIcon, EyeIcon, DocumentTextIcon, UsersIcon } from "@heroicons/react/24/outline";

import { EventStatsProps } from "./event-dashboard.types";

export function EventStats({
  totalEvents,
  publishedEvents,
  draftEvents,
  totalRegistrations,
}: EventStatsProps) {
  const stats = [
    {
      name: "Total Events",
      value: totalEvents,
      icon: CalendarIcon,
      color: "text-blue-600",
    },
    {
      name: "Published",
      value: publishedEvents,
      icon: EyeIcon,
      color: "text-green-600",
    },
    {
      name: "Drafts",
      value: draftEvents,
      icon: DocumentTextIcon,
      color: "text-yellow-600",
    },
    {
      name: "Total Registrations",
      value: totalRegistrations,
      icon: UsersIcon,
      color: "text-purple-600",
    },
  ];

  return (
    <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
      {stats.map((stat) => (
        <div key={stat.name} className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">{stat.name}</p>
              <p className="text-2xl font-semibold text-gray-900">{stat.value.toLocaleString()}</p>
            </div>
            <div className={`rounded-full bg-gray-50 p-3 ${stat.color}`}>
              <stat.icon className="h-6 w-6" />
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
