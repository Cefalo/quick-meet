import { BadRequestException, ConflictException, ForbiddenException, Inject, Injectable, NotFoundException, Logger } from '@nestjs/common';
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
    private logger: Logger,
  ) {}

  async createEvent(
    client: OAuth2Client,
    startTime: string,
    endTime: string,
    room: string,
    organizerEmail: string,
    createConference?: boolean,
    eventTitle?: string,
    attendees?: IPeopleInformation[],
  ): Promise<EventResponse> {
    const rooms = await this.authService.getDirectoryResources(client);

    const filteredAttendees: IPeopleInformation[] = [];
    if (attendees?.length) {
      for (const attendee of attendees) {
        if (validateEmail(attendee.email)) {
          filteredAttendees.push({ email: attendee.email, photo: attendee.photo.length > 1024 ? '' : attendee.photo, name: attendee.name });
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
      attendees: [...filteredAttendees, { email: pickedRoom.email }, { email: organizerEmail, organizer: true, responseStatus: 'accepted' }],
      colorId: '3',
      // https://developers.google.com/calendar/api/guides/extended-properties
      extendedProperties: {
        private: {
          createdAt: new Date().toISOString(), // Adding custom createdAt timestamp
        },
      },
      ...conference,
    };

    const createdEvent = await this.googleApiService.createCalenderEvent(client, event);

    this.logger.log('[CreateEvent] Room has been booked' + JSON.stringify(createdEvent));

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

  async getHighestSeatCapacity(client: OAuth2Client): Promise<number> {
    const rooms = await this.authService.getDirectoryResources(client);
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

    const rooms = await this.authService.getDirectoryResources(client);
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

  async getEvents(client: OAuth2Client, startTime: string, endTime: string, timeZone: string, userEmail: string): Promise<EventResponse[]> {
    const rooms = await this.authService.getDirectoryResources(client);
    const events = await this.googleApiService.getCalenderEvents(client, startTime, endTime, timeZone);
    const people = await this.authService.getPeopleResources(client);

    const formattedEvents = [];

    for (const event of events) {
      let room: IConferenceRoom | null = null;
      let responseStatus: string;

      const attendees: IPeopleInformation[] = [];

      if (event.attendees) {
        for (const attendee of event.attendees) {
          // current user's response status
          if (userEmail === attendee.email) {
            responseStatus = attendee.responseStatus;
          }

          if (!attendee.resource && !attendee.organizer) {
            let person = people.find((person: IPeopleInformation) => person.email === attendee.email);

            if (!person) {
              const emailParts = attendee.email.split('@');
              person = { email: attendee.email, name: emailParts[0], photo: '' };
            }

            attendees.push(person);
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
        responseStatus: responseStatus,
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
    eventId: string,
    startTime: string,
    endTime: string,
    userEmail: string,
    room?: string,
    createConference?: boolean,
    eventTitle?: string,
    attendees?: IPeopleInformation[],
  ): Promise<EventUpdateResponse> {
    const event = await this.googleApiService.getCalenderEvent(client, eventId);
    const rooms = await this.authService.getDirectoryResources(client);

    if (event.organizer.email !== userEmail) {
      throw new ForbiddenException('Not allowed to update this event');
    }

    const pickedRoom = extractRoomByEmail(rooms, room);
    if (!pickedRoom) {
      throw new NotFoundException('Incorrect room picked!');
    }

    // check if event room is available
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

    attendees.push({ email: event.organizer.email });

    const filteredAttendees: IPeopleInformation[] = [];
    let responseStatus: string;

    if (attendees?.length) {
      for (const attendee of attendees) {
        if (validateEmail(attendee.email)) {
          const existingAttendee = event.attendees?.find((a) => a.email === attendee.email);
          if (existingAttendee) {
            filteredAttendees.push({ ...attendee, ...existingAttendee });
            if (userEmail === existingAttendee.email) {
              responseStatus = existingAttendee.responseStatus;
            }
          } else {
            filteredAttendees.push({ email: attendee.email });
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
      attendees: [...filteredAttendees, { email: pickedRoom.email }],
      colorId: '3',
      extendedProperties: {
        private: {
          createdAt: new Date().toISOString(), // Adding custom createdAt timestamp to order events
        },
      },
      ...conference,
    };

    const result = await this.googleApiService.updateCalenderEvent(client, eventId, updatedEvent);
    const people = await this.authService.getPeopleResources(client);

    let updatedAttendees: IPeopleInformation[] = [];

    for (const attendee of result.attendees) {
      if (!attendee.email.endsWith('resource.calendar.google.com') && attendee.email !== event.organizer.email) {
        const person = people.find((person) => person.email === attendee.email);
        updatedAttendees.push({ ...attendee, ...(person || {}) });
      }
    }

    this.logger.log('[UpdateEvent] Room has been updated' + JSON.stringify(result));

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
      responseStatus,
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

  async updateEventResponse(client: OAuth2Client, userEmail: string, eventId: string, responseStatus: string): Promise<EventResponse> {
    const event = await this.googleApiService.getCalenderEvent(client, eventId);

    if (!event.attendees.some(({ email }) => email === userEmail)) {
      throw new ForbiddenException('Not authorized to respond to this event');
    }

    for (const attendee of event.attendees) {
      if (attendee.email === userEmail && !attendee.email.endsWith('resource.calendar.google.com') && attendee.email !== event.organizer.email) {
        attendee.responseStatus = responseStatus;
        break;
      }
    }

    const eventPayload: calendar_v3.Schema$Event = {
      ...event,
      attendees: event.attendees,
      colorId: '3',
    };

    const result = await this.googleApiService.updateCalenderEvent(client, eventId, eventPayload);
    const updatedAttendees = result.attendees.filter(
      (attendee) => !attendee.email.endsWith('resource.calendar.google.com') && attendee.email !== event.organizer.email,
    );

    const eventResponse: EventResponse = {
      eventId: result.id,
      attendees: updatedAttendees,
      responseStatus,
    };

    return eventResponse;
  }

  async listFloors(client: OAuth2Client): Promise<string[]> {
    const floors = await this.authService.getFloors(client);
    return floors;
  }

  async searchPeople(client: OAuth2Client, emailQuery: string): Promise<IPeopleInformation[]> {
    const people = await this.authService.getPeopleResources(client);
    const searchedPeople = people.filter((person) => person.email?.toLowerCase().includes(emailQuery.toLowerCase()));

    return searchedPeople;
  }
}
