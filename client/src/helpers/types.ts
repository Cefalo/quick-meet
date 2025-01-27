import { RoomsDropdownOption } from '@/components/RoomsDropdown';

export interface FormData {
  startTime: string;
  duration: number;
  seats: number;
  room?: string;
  floor?: string;
  title?: string;
  attendees?: string[];
  conference?: boolean;
  eventId?: string;
}

export interface IAvailableRoomsDropdownOption {
  preferred: RoomsDropdownOption[];
  others: RoomsDropdownOption[];
}
