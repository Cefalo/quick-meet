import {
  ApiResponse,
  BookRoomDto,
  DeleteResponse,
  EventResponse,
  EventUpdateResponse,
  GetAvailableRoomsQueryDto,
  IConferenceRoom,
  LoginResponse,
} from '@quickmeet/shared';
import axios, { AxiosInstance, RawAxiosRequestHeaders } from 'axios';
import { toast } from 'react-hot-toast';
import { secrets } from '@config/secrets';
import { CacheService, CacheServiceFactory } from '@helpers/cache';

export const SCOPES = [
  'https://www.googleapis.com/auth/admin.directory.resource.calendar.readonly',
  'https://www.googleapis.com/auth/calendar',
  'https://www.googleapis.com/auth/userinfo.email',
  'https://www.googleapis.com/auth/userinfo.profile',
];

/**
 * @description Serves as the base API endpoint for the application. It provides the authorization token in every request
 */
export default class Api {
  apiToken?: string;
  apiEndpoint?: string = secrets.backendEndpoint;
  client: AxiosInstance;
  cacheService: CacheService = CacheServiceFactory.getCacheService();

  constructor() {
    this.client = axios.create({
      baseURL: `${this.apiEndpoint}`,
      timeout: secrets.nodeEnvironment === 'development' ? 1000000 : 10000,
    });
  }

  async validateSession() {
    try {
      const token = await this.cacheService.get('access_token');
      if (!token) {
        return;
      }

      const headers = await this.getHeaders();
      const res = await this.client.get('/session', {
        headers,
      });

      return res.data as ApiResponse<LoginResponse>;
    } catch (error: any) {
      return this.handleError(error);
    }
  }

  async handleOAuthCallback(code: string) {
    try {
      const payload = {
        code,
      };

      const headers = await this.getHeaders();
      const res = await this.client.post('/oauth2callback', payload, {
        headers,
      });

      return res.data as ApiResponse<LoginResponse>;
    } catch (error: any) {
      return this.handleError(error);
    }
  }

  async logout() {
    try {
      const headers = await this.getHeaders();
      const res = await this.client.post('/logout', null, {
        headers,
      });

      await this.cacheService.remove('access_token');

      return res.data as ApiResponse<boolean>;
    } catch (error: any) {
      console.log(error);
    }
  }

  async loginChrome() {
    const scopes = SCOPES.join(' ').trim();
    const authUrl = `https://accounts.google.com/o/oauth2/v2/auth?client_id=${secrets.clientId}&redirect_uri=${secrets.oAuthRedirectUrl}&response_type=code&scope=${scopes}&access_type=offline`;
    console.log('secrets.oAuthRedirectUrl', secrets.oAuthRedirectUrl);

    return this.handleChromeOauthFlow(authUrl);
  }

  async login() {
    if (secrets.mockCalender === 'true' || !secrets.mockCalender) {
      const mockRedirectUrl = `${secrets.oAuthRedirectUrl}?code=mock_code`;
      window.location.href = mockRedirectUrl;
    } else {
      const scopes = SCOPES.join(' ').trim();
      const authUrl = `https://accounts.google.com/o/oauth2/v2/auth?client_id=${secrets.clientId}&redirect_uri=${secrets.oAuthRedirectUrl}&response_type=code&scope=${scopes}&access_type=offline`;

      window.location.href = authUrl;
    }
  }

  async handleChromeOauthFlow(authUrl: string) {
    const res = await new Promise<ApiResponse<any>>((resolve, _) => {
      chrome.identity.launchWebAuthFlow(
        {
          url: authUrl,
          interactive: true,
        },
        async (redirectUrl) => {
          if (chrome.runtime.lastError || !redirectUrl) {
            toast.error("Couldn't complete the OAuth flow");
            console.error(chrome.runtime.lastError);
          } else {
            console.log('Redirect URL:', redirectUrl);
            const url = new URL(redirectUrl);

            const code = url.searchParams.get('code');
            console.log(code);

            try {
              if (code) {
                const res = await this.handleOAuthCallback(code);
                if (!res) return;

                const { status, message, data } = res;
                if (status === 'error') {
                  return resolve({
                    message: message || 'Something went wrong',
                    redirect: true,
                    status: 'success',
                  });
                }

                resolve({
                  status: 'success',
                  data: data?.accessToken,
                });
              }
            } catch (error: any) {
              resolve({
                status: 'error',
                redirect: true,
                message: error.message,
              });
            }

            resolve({
              status: 'error',
              redirect: true,
              message: 'Something went wrong',
            });
          }
        },
      );
    });

    return res;
  }

  async getHeaders(): Promise<Partial<RawAxiosRequestHeaders>> {
    const token = await this.cacheService.get('access_token');
    return {
      Accept: 'application/json',
      Authorization: `Bearer ${token}`,
      'X-Redirect-Url': secrets.oAuthRedirectUrl,
    };
  }

  async getAvailableRooms(signal: AbortSignal, startTime: string, duration: number, timeZone: string, seats: number, floor?: string, eventId?: string) {
    try {
      const params: GetAvailableRoomsQueryDto = { startTime, duration, timeZone, seats, floor, eventId };
      const headers = await this.getHeaders();
      const res = await this.client.get('/available-rooms', { headers, params, signal });

      return res.data as ApiResponse<IConferenceRoom[]>;
    } catch (error: any) {
      return this.handleError(error);
    }
  }

  async getRooms(startTime: string, endTime: string, timeZone: string) {
    try {
      const headers = await this.getHeaders();
      const res = await this.client.get('/rooms', {
        headers,
        params: {
          startTime,
          endTime,
          timeZone,
        },
      });

      return res.data as ApiResponse<EventResponse[]>;
    } catch (error: any) {
      return this.handleError(error);
    }
  }

  async createRoom(payload: BookRoomDto) {
    try {
      const headers = await this.getHeaders();
      const res = await this.client.post('/room', payload, {
        headers,
      });

      return res.data as ApiResponse<EventResponse>;
    } catch (error: any) {
      return this.handleError(error);
    }
  }

  async updateRoom(eventId: string, payload: BookRoomDto) {
    try {
      const headers = await this.getHeaders();
      const res = await this.client.put(
        '/room',
        { eventId, ...payload },
        {
          headers,
        },
      );

      return res.data as ApiResponse<EventResponse>;
    } catch (error: any) {
      return this.handleError(error);
    }
  }

  async updateRoomDuration(eventId: string, roomId: string, duration: number) {
    try {
      const data = { eventId, roomId, duration };

      const headers = await this.getHeaders();
      const res = await this.client.put('/room/duration', data, {
        headers,
      });

      return res.data as ApiResponse<EventUpdateResponse>;
    } catch (error: any) {
      return this.handleError(error);
    }
  }

  async deleteRoom(roomId: string) {
    try {
      const headers = await this.getHeaders();
      const res = await this.client.delete(`/room?id=${roomId}`, {
        headers,
      });

      return res.data as ApiResponse<DeleteResponse>;
    } catch (error: any) {
      return this.handleError(error);
    }
  }

  async getMaxSeatCount(): Promise<ApiResponse<number>> {
    try {
      const headers = await this.getHeaders();
      const res = await this.client.get('/highest-seat-count', { headers });

      return res.data as ApiResponse<number>;
    } catch (error: any) {
      return this.handleError(error);
    }
  }

  async getFloors() {
    try {
      const headers = await this.getHeaders();
      const res = await this.client.get('/floors', {
        headers,
      });

      return res.data as ApiResponse<string[]>;
    } catch (error: any) {
      return this.handleError(error);
    }
  }

  handleError(error: any) {
    if (error.code === 'ERR_CANCELED') {
      return {
        status: 'ignore',
        message: 'Pending request aborted',
        data: null,
      } as ApiResponse<any>;
    }

    console.error(error);

    const res: ApiResponse<any> = error?.response?.data;
    if (res) {
      console.error(res);
      return res;
    }

    return {
      status: 'error',
      message: 'Something went wrong',
      data: null,
    } as ApiResponse<any>;
  }
}
