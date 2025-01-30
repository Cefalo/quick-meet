import type { IPeopleInformation } from 'interfaces';

export interface EventResponse {
  eventId?: string;
  summary?: string;
  room?: string;
  start?: string;
  end?: string;
  meet?: string;
  floor?: string;
  roomEmail?: string;
  roomId?: string;
  seats?: number;
  attendees?: IPeopleInformation[];
  createdAt?: number;
  isEditable?: boolean;
  responseStatus?: string;
}
