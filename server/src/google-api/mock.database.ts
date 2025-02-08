import { admin_directory_v1, calendar_v3, people_v1 } from 'googleapis';
import { toMs } from '../helpers/helper.util';
import { Cache } from 'cache-manager';
import { Inject } from '@nestjs/common';
import { CACHE_MANAGER } from '@nestjs/cache-manager';

export class CalenderMockDb {
  rooms: admin_directory_v1.Schema$CalendarResource[];
  people: people_v1.Schema$Person[];

  constructor(@Inject(CACHE_MANAGER) private cacheManager: Cache) {
    this.seedData();
  }

  seedData() {
    this.rooms = [
      {
        resourceId: 'room102',
        resourceName: 'Cedar',
        resourceEmail: 'cedar.room@resource.calendar.google.com',
        userVisibleDescription: 'A cozy room with wooden accents and a large display screen.',
        floorName: 'F1',
        capacity: 8,
      },
      {
        resourceId: 'room112',
        resourceName: 'Aurora',
        resourceEmail: 'aurora.room@resource.calendar.google.com',
        userVisibleDescription: 'A high-tech room with smart lighting and advanced video conferencing equipment.',
        floorName: 'F1',
        capacity: 12,
      },
      {
        resourceId: 'room203',
        resourceName: 'Oasis',
        resourceEmail: 'oasis.room@resource.calendar.google.com',
        userVisibleDescription: 'A relaxing room with plants and a calming atmosphere, ideal for creative sessions.',
        floorName: 'F2',
        capacity: 7,
      },
      {
        resourceId: 'room306',
        resourceName: 'Summit',
        resourceEmail: 'summit.room@resource.calendar.google.com',
        userVisibleDescription: 'An executive boardroom with premium furnishings and a city skyline view.',
        floorName: 'F3',
        capacity: 18,
      },
      {
        resourceId: 'room207',
        resourceName: 'Cascade',
        resourceEmail: 'cascade.room@@resource.calendar.google.com',
        userVisibleDescription: 'A quiet room with comfortable seating and a large whiteboard for brainstorming.',
        floorName: 'F2',
        capacity: 6,
      },
      {
        resourceId: 'room307',
        resourceName: 'Zen Conference',
        resourceEmail: 'zen.room@resource.calendar.google.com',
        userVisibleDescription: 'A minimalist room with natural lighting and a video wall for presentations.',
        floorName: 'F3',
        capacity: 10,
      },
      {
        resourceId: 'room108',
        resourceName: 'Galaxy',
        resourceEmail: 'galaxy.room@resource.calendar.google.com',
        userVisibleDescription: 'A futuristic room with interactive displays and advanced connectivity options.',
        floorName: 'F1',
        capacity: 12,
      },
      {
        resourceId: 'room401',
        resourceName: 'Nebula Boardroom',
        resourceEmail: 'nebula.room@resource.calendar.google.com',
        userVisibleDescription: 'A top-floor boardroom with a stunning view and high-end presentation tools.',
        floorName: 'F4',
        capacity: 20,
      },
    ];

    this.people = [
      {
        names: [
          {
            metadata: {
              primary: true,
            },
            displayName: 'Example User',
          },
        ],
        photos: [
          {
            metadata: {
              primary: true,
            },
            url: 'https://example.com/photo.jpg',
          },
        ],

        emailAddresses: [
          {
            metadata: {
              primary: true,
              verified: true,
            },
            value: 'example@org.com',
          },
        ],
      },
      {
        names: [
          {
            metadata: {
              primary: true,
            },
            displayName: 'John Doe',
          },
        ],
        photos: [
          {
            metadata: {
              primary: true,
            },
            url: 'https://example.com/photo.jpg',
          },
        ],
        emailAddresses: [
          {
            metadata: {
              primary: true,
              verified: true,
            },
            value: 'john.doe@org.com',
          },
        ],
      },
      {
        names: [
          {
            metadata: {
              primary: true,
            },
            displayName: 'Jane Doe',
          },
        ],
        photos: [
          {
            metadata: {
              primary: true,
            },
            url: 'https://example.com/photo.jpg',
          },
        ],
        emailAddresses: [
          {
            metadata: {
              primary: true,
              verified: true,
            },
            value: 'jane.doe@org.com',
          },
        ],
      },
      {
        names: [
          {
            metadata: {
              primary: true,
            },
            displayName: 'Sam Lee',
          },
        ],
        photos: [
          {
            metadata: {
              primary: true,
            },
            url: 'https://example.com/photo.jpg',
          },
        ],
        emailAddresses: [
          {
            metadata: {
              primary: true,
              verified: false,
            },
            value: 'unverified@org.com',
          },
        ],
      },
      {
        names: [
          {
            metadata: {
              primary: true,
            },
            displayName: 'Test User',
          },
        ],
        photos: [
          {
            metadata: {
              primary: true,
            },
            url: 'https://example.com/photo.jpg',
          },
        ],
        emailAddresses: [
          {
            metadata: {
              primary: true,
              verified: true,
            },
            value: 'test.user@org.com',
          },
        ],
      },
    ];
  }

  async saveToCache(key: string, value: unknown, expiry = toMs('15d')): Promise<void> {
    await this.cacheManager.set(key, value, expiry);
  }

  async getFromCache(key: string, defaultValue?: any): Promise<any> {
    return (await this.cacheManager.get(key)) || defaultValue;
  }

  listDirectoryPeople(query?: string) {
    if (query) {
      return this.people.filter((person) => person.emailAddresses?.some((email) => email.value?.toLowerCase().includes(query.toLowerCase())));
    }

    return this.people;
  }

  async getRooms() {
    return this.rooms;
  }

  getRoom(name: string) {
    return this.rooms.find((r) => r.resourceName === name);
  }

  async createEvent(event: calendar_v3.Schema$Event) {
    const randomId = `event-${Date.now()}-${Math.floor(Math.random() * 1000)}`;

    const emailPool = ['john.doe@example.com', 'jane.smith@example.com', 'alice.johnson@example.com', 'bob.williams@example.com', 'charlie.brown@example.com'];
    event.organizer = { email: emailPool[Math.floor(Math.random() * emailPool.length)] };

    const events = await this.getFromCache('events', []);
    events.push({ ...event, id: randomId });
    await this.saveToCache('events', events);

    return event;
  }

  async getEvent(eventId: string): Promise<calendar_v3.Schema$Event | undefined> {
    const events: calendar_v3.Schema$Event[] = await this.getFromCache('events', []);
    return events.find((event) => event.id === eventId);
  }

  async updateEvent(eventId: string, updatedEvent: Partial<calendar_v3.Schema$Event>): Promise<calendar_v3.Schema$Event | undefined> {
    const events: calendar_v3.Schema$Event[] = await this.getFromCache('events', []);

    const eventIndex = events.findIndex((event) => event.id === eventId);
    if (eventIndex !== -1) {
      events[eventIndex] = {
        ...events[eventIndex],
        ...updatedEvent,
      };

      await this.saveToCache('events', events);
      return events[eventIndex];
    }

    return undefined;
  }

  async deleteEvent(eventId: string): Promise<boolean> {
    const events: calendar_v3.Schema$Event[] = await this.getFromCache('events', []);
    const eventIndex = events.findIndex((event) => event.id === eventId);

    if (eventIndex !== -1) {
      events.splice(eventIndex, 1);
      await this.saveToCache('events', events);

      return true;
    }

    return false;
  }

  async listEvents(start?: string, end?: string, limit?: number): Promise<calendar_v3.Schema$Event[]> {
    const events: calendar_v3.Schema$Event[] = await this.getFromCache('events', []);

    const startTime = start ? new Date(start) : null;
    const endTime = end ? new Date(end) : null;

    const OFFSET_MS = 15 * 60 * 1000;

    const filteredEvents = events.filter((event) => {
      if (!event.start?.dateTime || !event.end?.dateTime) return false;

      const eventStart = new Date(event.start.dateTime);
      const eventEnd = new Date(event.end.dateTime);

      const adjustedStart = new Date(eventStart.getTime() - OFFSET_MS);
      const adjustedEnd = new Date(eventEnd.getTime() + OFFSET_MS);

      return (!startTime || adjustedEnd >= startTime) && (!endTime || adjustedStart <= endTime);
    });

    for (const event of filteredEvents) {
      for (const attendee of event.attendees) {
        if (attendee.email.includes('resource.calendar.google.com')) {
          attendee.resource = true;
        }
      }
    }

    return limit ? filteredEvents.slice(0, limit) : filteredEvents;
  }
}
