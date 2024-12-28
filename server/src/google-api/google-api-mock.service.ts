import { Inject, Injectable } from '@nestjs/common';
import { IGoogleApiService } from './interfaces/google-api.interface';
import { OAuth2Client } from 'google-auth-library';
import { calendar_v3, admin_directory_v1 } from 'googleapis';
import { OAuthTokenResponse } from '../auth/dto/oauth-token.response';
import { CalenderMockDb } from './mock.database';
import { IJwtPayload } from 'src/auth/dto';
import { JwtService } from '@nestjs/jwt';
import appConfig from 'src/config/env/app.config';
import { ConfigType } from '@nestjs/config';

@Injectable()
export class GoogleApiMockService implements IGoogleApiService {
  db: CalenderMockDb;

  constructor(
    private jwtService: JwtService,
    @Inject(appConfig.KEY) private config: ConfigType<typeof appConfig>,
  ) {
    this.db = new CalenderMockDb();
  }

  getOAuthClient(): OAuth2Client;
  getOAuthClient(payload?: IJwtPayload): OAuth2Client;
  getOAuthClient(_?: IJwtPayload): OAuth2Client {
    return new OAuth2Client();
  }

  async getToken(_: OAuth2Client, code: string): Promise<OAuthTokenResponse> {
    console.log(`Mock getToken called with code: ${code}`);

    const idTokenPayload = {
      hd: 'example.com',
      name: 'Mr Bob',
    };

    const idToken = await this.jwtService.signAsync({ payload: idTokenPayload }, { secret: this.config.jwtSecret });
    const res: OAuthTokenResponse = {
      tokens: {
        access_token: 'mockAccessToken',
        refresh_token: 'mockRefreshToken',
        scope: 'mockScopes',
        id_token: idToken,
        token_type: 'Bearer',
        expiry_date: Date.now() + 3600 * 1000,
      },
    };

    return Promise.resolve(res);
  }

  getOAuthUrl(): string {
    return `/oauthcallback?code=mock_code`;
  }

  createCalenderEvent(_: OAuth2Client, event: calendar_v3.Schema$Event): Promise<calendar_v3.Schema$Event> {
    console.log(`Mock createCalenderEvent called with event: ${event.summary}`);
    if (event.conferenceData) {
      event.hangoutLink = 'https://meet.google.com/mock-meeting-id';
    }

    return Promise.resolve(this.db.createEvent(event));
  }

  getCalendarResources(_: OAuth2Client): Promise<admin_directory_v1.Schema$CalendarResources> {
    console.log('Mock getCalendarResources called');
    const items = this.db.getRooms();
    return Promise.resolve({
      kind: 'admin#directory#resources#calendars',
      etag: 'mockEtag',
      items: items,
    } as admin_directory_v1.Schema$CalendarResources);
  }

  async getCalenderSchedule(
    _: OAuth2Client,
    start: string,
    end: string,
    timeZone: string,
    rooms: string[],
  ): Promise<{
    [key: string]: calendar_v3.Schema$FreeBusyCalendar;
  }> {
    console.log(`Mock getCalenderSchedule called with start: ${start}, end: ${end}, rooms: ${rooms}`);
    const busySchedule: Record<string, { busy: { start: string; end: string }[] }> = {};
    const events = this.db.listEvents();

    for (const roomEmail of rooms) {
      busySchedule[roomEmail] = { busy: [] };

      for (const event of events) {
        if (!event.attendees) continue;

        const isRoomAttendee = event.attendees.some((attendee: { email: string }) => attendee.email === roomEmail);
        if (isRoomAttendee) {
          busySchedule[roomEmail].busy.push({
            start: event.start.dateTime,
            end: event.end.dateTime,
          });
        }
      }
    }

    return new Promise((resolve) => {
      setTimeout(() => {
        resolve(
          busySchedule as {
            [key: string]: calendar_v3.Schema$FreeBusyCalendar;
          },
        );
      }, 1000);
    });
  }

  async getCalenderEvents(_: OAuth2Client, start: string, end: string, timeZone: string, limit = 30): Promise<calendar_v3.Schema$Event[]> {
    console.log(`Mock getCalenderEvents called with start: ${start}, end: ${end}, limit: ${limit}`);
    const events = this.db.listEvents(start, end, limit);
    return new Promise((resolve) => {
      setTimeout(() => {
        resolve(events);
      }, 1000);
    });
  }

  async getCalenderEvent(_: OAuth2Client, id: string): Promise<calendar_v3.Schema$Event> {
    console.log(`Mock getCalenderEvent called with id: ${id}`);
    const event = this.db.getEvent(id);
    return new Promise((resolve) => {
      setTimeout(() => {
        resolve(event);
      }, 1000);
    });
  }

  async updateCalenderEvent(_: OAuth2Client, id: string, event: calendar_v3.Schema$Event): Promise<calendar_v3.Schema$Event> {
    console.log(`Mock updateCalenderEvent called with id: ${id}, event: ${event.summary}`);
    const updatedEvent = this.db.updateEvent(id, event);
    return new Promise((resolve) => {
      setTimeout(() => {
        resolve(updatedEvent);
      }, 1000);
    });
  }

  async deleteEvent(_: OAuth2Client, id: string): Promise<void> {
    console.log(`Mock deleteEvent called with id: ${id}`);
    this.db.deleteEvent(id);
    return new Promise((resolve) => {
      setTimeout(() => {
        resolve();
      }, 1000);
    });
  }
}
