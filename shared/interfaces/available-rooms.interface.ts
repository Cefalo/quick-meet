import { IConferenceRoom } from './conference-room.interface';

export interface IAvailableRooms {
  preferred: IConferenceRoom[];
  others: IConferenceRoom[];
}
