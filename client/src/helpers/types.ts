import { RoomsDropdownOption } from '@/components/RoomsDropdown';
import type { IPeopleInformation } from '@quickmeet/shared';

export interface FormData {
  startTime: string;
  duration: number;
  seats: number;
  room?: string;
  floor?: string;
  title?: string;
  attendees?: IPeopleInformation[];
  conference?: boolean;
  eventId?: string;
  date?: string;
}

export interface IAvailableRoomsDropdownOption {
  preferred: RoomsDropdownOption[];
  others: RoomsDropdownOption[];
}
