import { BadRequestException, ConflictException, ForbiddenException, Inject, Injectable, NotFoundException } from '@nestjs/common';
import { calendar_v3 } from 'googleapis';
import { extractRoomByEmail, isRoomAvailable, validateEmail } from './util/calender.util';
import { DeleteResponse, EventResponse, EventUpdateResponse, IConferenceRoom, IPeopleInformation, IAvailableRooms } from '@quickmeet/shared';
import { OAuth2Client } from 'google-auth-library';
import { GoogleApiService } from 'src/google-api/google-api.service';
import { AuthService } from '../auth/auth.service';

@Injectable()
export class CalenderService {
  constructor(
    private authService: AuthService,
    @Inject('GoogleApiService') private readonly googleApiService: GoogleApiService,
  ) {}

  async createEvent(
    client: OAuth2Client,
    domain: string,
    startTime: string,
    endTime: string,
    room: string,
    organizerEmail: string,
    createConference?: boolean,
    eventTitle?: string,
    attendees?: IPeopleInformation[],
  ): Promise<EventResponse> {
    const rooms = await this.authService.getDirectoryResources(client, domain);

    const attendeeList = [];
    if (attendees?.length) {
      for (const attendee of attendees) {
        if (validateEmail(attendee.email)) {
          attendeeList.push({ email: attendee.email });
        } else {
          throw new BadRequestException('Invalid attendee email provided: ' + attendee);
        }
      }
    }

    let conference = {};
    if (createConference) {
      conference = {
        conferenceData: {
          createRequest: {
            requestId: Math.random().toString(36).substring(7),
            conferenceSolutionKey: {
              type: 'hangoutsMeet',
            },
          },
        },
      };
    }

    const pickedRoom = extractRoomByEmail(rooms, room);
    if (!pickedRoom) {
      throw new NotFoundException('Incorrect room picked!');
    }

    const isAvailable = await this.isRoomAvailable(client, startTime, endTime, pickedRoom.email);
    if (!isAvailable) {
      throw new ConflictException('Room has already been booked.');
    }

    const event: calendar_v3.Schema$Event = {
      summary: eventTitle?.trim() || '-',
      location: pickedRoom.name,
      description: 'A quick meeting created by Quick Meet',
      start: {
        dateTime: startTime,
      },
      end: {
        dateTime: endTime,
      },
      attendees: [...attendeeList, { email: pickedRoom.email }, { email: organizerEmail, organizer: true, responseStatus: 'accepted' }],
      colorId: '3',
      extendedProperties: {
        private: {
          createdAt: new Date().toISOString(), // Adding custom createdAt timestamp
          attendees: JSON.stringify(attendees),
        },
      },
      ...conference,
    };

    const createdEvent = await this.googleApiService.createCalenderEvent(client, event);

    console.log('Room has been booked', createdEvent);

    const data: EventResponse = {
      eventId: createdEvent.id,
      summary: createdEvent.summary,
      meet: createdEvent.hangoutLink,
      start: createdEvent.start.dateTime,
      end: createdEvent.end.dateTime,
      room: pickedRoom.name,
      roomEmail: pickedRoom.email,
      roomId: pickedRoom.id,
      seats: pickedRoom.seats,
      isEditable: true,
      floor: pickedRoom.floor,
    };

    return data;
  }

  async getHighestSeatCapacity(client: OAuth2Client, domain: string): Promise<number> {
    const rooms = await this.authService.getDirectoryResources(client, domain);
    let max = -1;
    for (const room of rooms) {
      if (room.seats > max) {
        max = room.seats;
      }
    }

    return max;
  }

  async getAvailableRooms(
    client: OAuth2Client,
    domain: string,
    start: string,
    end: string,
    timeZone: string,
    minSeats: number,
    floor?: string,
    eventId?: string,
  ): Promise<IAvailableRooms> {
    const filteredRoomEmails: string[] = [];
    const otherRoomEmails: string[] = [];
    const isPreferredRoom: Record<string, boolean> = {};

    const rooms = await this.authService.getDirectoryResources(client, domain);
    for (const room of rooms) {
      if (room.seats >= Number(minSeats)) {
        if (floor === undefined || floor === '' || room.floor === floor) {
          filteredRoomEmails.push(room.email);
          isPreferredRoom[room.email] = true;
        } else {
          otherRoomEmails.push(room.email);
          isPreferredRoom[room.email] = false;
        }
      }
    }

    if (filteredRoomEmails.length === 0 && otherRoomEmails.length === 0) {
      return { preferred: [], others: [] };
    }

    const calenders = await this.googleApiService.getCalenderSchedule(client, start, end, timeZone, [...filteredRoomEmails, ...otherRoomEmails]);

    const availableRooms: IAvailableRooms = { others: [], preferred: [] };
    let room: IConferenceRoom = null;

    for (const roomEmail of Object.keys(calenders)) {
      const isAvailable = isRoomAvailable(calenders[roomEmail].busy, new Date(start), new Date(end));
      if (isAvailable) {
        room = rooms.find((room) => room.email === roomEmail);
        if (isPreferredRoom[room.email]) {
          availableRooms.preferred.push(room);
        } else {
          availableRooms.others.push(room);
        }
      }
    }

    if (eventId) {
      const event = await this.googleApiService.getCalenderEvent(client, eventId);
      const roomEmail = (event.attendees || []).find((attendee) => attendee.resource && attendee.responseStatus !== 'declined');

      if (roomEmail) {
        const currentStartTime = new Date(event.start.dateTime).getTime();
        const currentEndTime = new Date(event.end.dateTime).getTime();

        const requestStart = new Date(start).getTime();
        const requestEnd = new Date(end).getTime();

        const currentRoom = extractRoomByEmail(rooms, roomEmail.email);

        const { timeZone } = event.start;
        const originalEventDate = new Date(event.start.dateTime).toDateString();
        const newEventDate = new Date(start).toDateString();

        let isEventRoomAvailable = true;

        if (originalEventDate !== newEventDate) {
          const isAvailable = await this.isRoomAvailable(client, start, end, roomEmail.email, timeZone);
          if (!isAvailable) {
            isEventRoomAvailable = false;
          }
        } else {
          if (requestStart < currentStartTime) {
            const isAvailable = await this.isRoomAvailable(client, start, event.start.dateTime, roomEmail.email, timeZone);
            if (!isAvailable) {
              isEventRoomAvailable = false;
            }
          }

          if (requestEnd > currentEndTime) {
            const isAvailable = await this.isRoomAvailable(client, event.end.dateTime, end, roomEmail.email, timeZone);
            if (!isAvailable) {
              isEventRoomAvailable = false;
            }
          }
        }

        if (isEventRoomAvailable) {
          if (isPreferredRoom[currentRoom.email]) {
            availableRooms.preferred.unshift(currentRoom);
          } else {
            availableRooms.others.unshift(currentRoom);
          }
        }
      }
    }

    return availableRooms;
  }

  async isRoomAvailable(client: OAuth2Client, start: string, end: string, roomEmail: string, timeZone?: string): Promise<boolean> {
    const calenders = await this.googleApiService.getCalenderSchedule(client, start, end, timeZone, [roomEmail]);

    const availableRooms: IConferenceRoom[] = [];
    const room: IConferenceRoom = null;

    for (const roomEmail of Object.keys(calenders)) {
      const isAvailable = isRoomAvailable(calenders[roomEmail].busy, new Date(start), new Date(end));
      if (isAvailable) {
        availableRooms.push(room);
      }
    }

    if (availableRooms.length === 0) {
      return false;
    }

    return true;
  }

  async getEvents(client: OAuth2Client, domain: string, startTime: string, endTime: string, timeZone: string, userEmail: string): Promise<EventResponse[]> {
    const rooms = await this.authService.getDirectoryResources(client, domain);
    const events = await this.googleApiService.getCalenderEvents(client, startTime, endTime, timeZone);

    const formattedEvents = [];

    for (const event of events) {
      let room: IConferenceRoom | null = null;
      const attendessInformations = event.extendedProperties?.private?.attendees ? JSON.parse(event.extendedProperties.private.attendees) : [];

      const attendees: IPeopleInformation[] = [];
      if (event.attendees) {
        for (const attendee of event.attendees) {
          if (!attendee.resource && attendee.responseStatus !== 'declined' && !attendee.organizer) {
            const person = attendessInformations.find((person) => person.email === attendee.email);
            if (person) {
              attendees.push(person);
            } else {
              const emailParts = attendee.email.split('@');
              attendees.push({ email: attendee.email, name: emailParts[0] || attendee.email, photo: '' });
            }
          } else if (attendee.resource) {
            room = rooms.find((_room) => _room.email === attendee.email);
          }
        }
      }

      if (!room && event.location) {
        // event location must be an external link
        event.hangoutLink = event.location;
      }

      const _event: EventResponse = {
        meet: event.hangoutLink,
        room: room?.name,
        roomEmail: room?.email,
        eventId: event.id,
        seats: room?.seats,
        floor: room?.floor,
        summary: event.summary,
        start: event.start.dateTime,
        attendees: attendees,
        end: event.end.dateTime,
        createdAt: event.extendedProperties?.private?.createdAt ? new Date(event.extendedProperties.private.createdAt).getTime() : Date.now(),
        isEditable: event.organizer.email === userEmail,
      };

      formattedEvents.push(_event);
    }

    const sortedEvents = formattedEvents.sort((a, b) => {
      const startA = new Date(a.start).getTime();
      const startB = new Date(b.start).getTime();
      if (startA !== startB) {
        return startA - startB;
      }
      const createdAtA = new Date(a.createdAt).getTime();
      const createdAtB = new Date(b.createdAt).getTime();
      const timestamps = [createdAtA, createdAtB];
      const firstCreated = Math.min(...timestamps);
      return firstCreated === createdAtA ? 1 : -1;
    });

    return sortedEvents;
  }

  async updateEvent(
    client: OAuth2Client,
    domain: string,
    eventId: string,
    startTime: string,
    endTime: string,
    userEmail: string,
    createConference?: boolean,
    eventTitle?: string,
    attendees?: IPeopleInformation[],
    room?: string,
  ): Promise<EventUpdateResponse> {
    const event = await this.googleApiService.getCalenderEvent(client, eventId);
    const rooms = await this.authService.getDirectoryResources(client, domain);
    const attendeesEmails = attendees?.map((attendee) => attendee.email) || [];

    if (event.organizer.email !== userEmail) {
      throw new ForbiddenException('Not allowed to update this event');
    }

    const pickedRoom = extractRoomByEmail(rooms, room);
    if (!pickedRoom) {
      throw new NotFoundException('Incorrect room picked!');
    }

    if (event.attendees?.some((attendee) => attendee.email === room)) {
      const currentStartTime = new Date(event.start.dateTime).getTime();
      const currentEndTime = new Date(event.end.dateTime).getTime();

      const newStartTime = new Date(startTime).getTime();
      const newEndTime = new Date(endTime).getTime();

      const { timeZone } = event.start;
      const originalEventDate = new Date(event.start.dateTime).toDateString();
      const newEventDate = new Date(startTime).toDateString();

      if (originalEventDate !== newEventDate) {
        const isAvailable = await this.isRoomAvailable(client, startTime, endTime, pickedRoom.email, timeZone);
        if (!isAvailable) {
          throw new ConflictException('Room is not available within the set duration');
        }
      } else {
        if (newStartTime < currentStartTime) {
          const isAvailable = await this.isRoomAvailable(client, startTime, event.start.dateTime, room, timeZone);
          if (!isAvailable) {
            throw new ConflictException('Room is not available within the set duration');
          }
        }

        if (newEndTime > currentEndTime) {
          const isAvailable = await this.isRoomAvailable(client, event.end.dateTime, endTime, room, timeZone);
          if (!isAvailable) {
            throw new ConflictException('Room is not available within the set duration');
          }
        }
      }
    }

    if (pickedRoom) {
      attendeesEmails.push(pickedRoom.email);
    }

    attendeesEmails.push(event.organizer.email);

    const attendeeList = [];
    if (attendees?.length) {
      for (const attendee of attendees) {
        if (validateEmail(attendee.email)) {
          const existingAttendee = event.attendees?.find((a) => a.email === attendee);
          if (existingAttendee) {
            attendeeList.push({ email: attendee.email });
          } else {
            attendeeList.push({ email: attendee.email });
          }
        } else {
          throw new BadRequestException('Invalid attendee email provided: ' + attendee);
        }
      }
    }

    let conference = {};
    if (createConference) {
      conference = {
        conferenceData: {
          createRequest: {
            requestId: Math.random().toString(36).substring(7),
            conferenceSolutionKey: {
              type: 'hangoutsMeet',
            },
          },
        },
      };
    } else {
      conference = {
        conferenceData: null,
      };
    }

    const updatedEvent: calendar_v3.Schema$Event = {
      ...event,
      summary: eventTitle?.trim() || '-',
      location: pickedRoom.name,
      description: 'A quick meeting created by Quick Meet',
      start: {
        dateTime: startTime,
      },
      end: {
        dateTime: endTime,
      },
      attendees: [...attendeeList, { email: pickedRoom.email }],
      colorId: '3',
      extendedProperties: {
        private: {
          createdAt: new Date().toISOString(), // Adding custom createdAt timestamp to order events
          attendees: JSON.stringify(attendees),
        },
      },
      ...conference,
    };

    const result = await this.googleApiService.updateCalenderEvent(client, eventId, updatedEvent);
    const updatedAttendees = result.extendedProperties.private.attendees ? JSON.parse(result.extendedProperties.private.attendees) : [];

    const eventResponse: EventResponse = {
      eventId: updatedEvent.id,
      summary: updatedEvent.summary,
      meet: result.hangoutLink,
      start: updatedEvent.start.dateTime,
      end: updatedEvent.end.dateTime,
      room: pickedRoom.name,
      roomEmail: pickedRoom.email,
      roomId: pickedRoom.id,
      seats: pickedRoom.seats,
      attendees: updatedAttendees,
      isEditable: true,
      floor: pickedRoom.floor,
    };

    return eventResponse;
  }

  async deleteEvent(client: OAuth2Client, id: string): Promise<DeleteResponse> {
    await this.googleApiService.deleteEvent(client, id);

    const data: DeleteResponse = {
      deleted: true,
    };

    return data;
  }

  async listFloors(client: OAuth2Client, domain: string): Promise<string[]> {
    const floors = await this.authService.getFloors(client, domain);
    return floors;
  }

  async searchPeople(client: OAuth2Client, emailQuery: string): Promise<IPeopleInformation[]> {
    const response = await this.googleApiService.searchPeople(client, emailQuery);
    const peoples: IPeopleInformation[] = response.map((people) => {
      const email = people.emailAddresses.find((email) => email.metadata.primary && email.metadata.verified);
      const photo = people.photos?.find((photo) => photo.metadata.primary);
      const name = people.names?.find((name) => name.metadata.primary);
      return {
        email: email?.value,
        name: name?.displayName,
        photo: photo?.url,
      };
    });

    return peoples;
  }
}
