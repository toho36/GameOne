export interface RegisteredUsersListProps {
  eventId: string;
}

export interface ParticipantsApiResponse {
  count: number;
  participants?: Array<{ id: string; name: string }>;
}
