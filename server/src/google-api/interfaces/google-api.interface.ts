import { OAuth2Client } from 'google-auth-library';
import { admin_directory_v1, calendar_v3, people_v1 } from 'googleapis';
import { OAuthTokenResponse } from 'src/auth/dto';

export interface IGoogleApiService {
  getOAuthClient(): OAuth2Client;
  getToken(oauth2Client: OAuth2Client, code: string): Promise<OAuthTokenResponse>;

  createCalenderEvent(oauth2Client: OAuth2Client, event: calendar_v3.Schema$Event): Promise<calendar_v3.Schema$Event>;
  getCalendarResources(oauth2Client: OAuth2Client): Promise<admin_directory_v1.Schema$CalendarResources>;
  getCalenderSchedule(oauth2Client: OAuth2Client, start: string, end: string, timeZone: string, rooms: string[]): Promise<calendar_v3.Schema$FreeBusyCalendar>;
  getCalenderEvents(oauth2Client: OAuth2Client, start: string, end: string, timeZone: string, limit?: number): Promise<calendar_v3.Schema$Event[]>;
  getCalenderEvent(oauth2Client: OAuth2Client, id: string): Promise<calendar_v3.Schema$Event>;
  updateCalenderEvent(oauth2Client: OAuth2Client, id: string, event: calendar_v3.Schema$Event): Promise<calendar_v3.Schema$Event>;
  deleteEvent(oauth2Client: OAuth2Client, id: string): Promise<void>;
  listPeople(oauth2Client: OAuth2Client): Promise<people_v1.Schema$Person[]>;
}
