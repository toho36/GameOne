export interface RegisteredUsersListProps {
  eventId: string;
}

export interface ParticipantItem {
  id: string;
  name: string;
  registrationStatus?: string;
  paymentStatus?: string;
}

export interface ParticipantsApiResponse {
  counts: { confirmed: number; waiting: number };
  confirmed?: ParticipantItem[];
  waiting?: ParticipantItem[];
}
