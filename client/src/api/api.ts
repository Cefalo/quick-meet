import { ApiResponse, BookRoomDto, DeleteResponse, EventResponse, GetAvailableRoomsQueryDto, IConferenceRoom, StatusTypes } from '@quickmeet/shared';
import axios, { AxiosInstance } from 'axios';
import { toast } from 'react-hot-toast';
import { secrets } from '@config/secrets';
import { CacheService, CacheServiceFactory } from '@helpers/cache';
import { ROUTES } from '@/config/routes';

/**
 * @description Serves as the base API endpoint for the application. It provides the authorization token in every request
 */
export default class Api {
  apiToken?: string;
  client: AxiosInstance;

  cacheService: CacheService = CacheServiceFactory.getCacheService();

  constructor() {
    this.client = axios.create({
      baseURL: secrets.backendEndpoint,
      timeout: secrets.nodeEnvironment === 'development' ? 1000000 : 10000,
      headers: this.getHeaders(),
    });

    this.handleTokenRefresh();
  }

  getHeaders() {
    return {
      Accept: 'application/json',
      'x-mock-api': secrets.mockCalender,
      'x-app-environment': secrets.appEnvironment, // can be either chrome or web
    };
  }

  async refreshToken() {
    try {
      const res = await axios.get('/auth/token/refresh', {
        baseURL: `${secrets.backendEndpoint}`,
        headers: this.getHeaders(),
      });

      return res.data.data;
    } catch (error) {
      return null;
    }
  }

  async handleTokenRefresh() {
    this.client.interceptors.response.use(
      (response) => response,
      async (error) => {
        const originalRequest = error.config;
        console.log(error);

        if (error.response?.status === 401 && !originalRequest._retry) {
          originalRequest._retry = true;

          const renewedToken = await this.refreshToken();
          if (!renewedToken) {
            await this.logout();

            window.location.href = ROUTES.signIn;
            return Promise.reject(error);
          }

          return this.client(originalRequest);
        }

        return Promise.reject(error);
      },
    );
  }

  async getOAuthUrl() {
    try {
      const res = await this.client.get('/auth/oauth2/url');

      return res.data as ApiResponse<string>;
    } catch (error: any) {
      return await this.handleError(error);
    }
  }

  async handleOAuthCallback(code: string) {
    try {
      const payload = {
        code,
      };

      const res = await this.client.post('/auth/oauth2/callback', payload);

      return res.data as ApiResponse<boolean>;
    } catch (error: any) {
      return await this.handleError(error);
    }
  }

  async logout() {
    try {
      const res = await this.client.post('/auth/logout', null);
      return res.data as ApiResponse<boolean>;
    } catch (error: any) {
      console.log(error);
    }
  }

  async loginChrome() {
    const { data } = await this.getOAuthUrl();
    if (data) {
      return this.handleChromeOauthFlow(data);
    }
  }

  async login() {
    const { data } = await this.getOAuthUrl();
    if (!data) {
      toast.error('Failed to retrieve oauth callback url');
      return;
    }

    window.location.href = data;
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

  async getAvailableRooms(signal: AbortSignal, startTime: string, duration: number, timeZone: string, seats: number, floor?: string, eventId?: string) {
    try {
      const params: GetAvailableRoomsQueryDto = { startTime, duration, timeZone, seats, floor, eventId };
      const res = await this.client.get('/api/rooms/available', { params, signal });

      return res.data as ApiResponse<IConferenceRoom[]>;
    } catch (error: any) {
      return await this.handleError(error);
    }
  }

  async getRooms(startTime: string, endTime: string, timeZone: string) {
    try {
      const res = await this.client.get('/api/events', {
        params: {
          startTime,
          endTime,
          timeZone,
        },
      });

      return res.data as ApiResponse<EventResponse[]>;
    } catch (error: any) {
      return await this.handleError(error);
    }
  }

  async createEvent(payload: BookRoomDto) {
    try {
      const res = await this.client.post('/api/event', payload);

      return res.data as ApiResponse<EventResponse>;
    } catch (error: any) {
      return await this.handleError(error);
    }
  }

  async updateEvent(eventId: string, payload: BookRoomDto) {
    try {
      const res = await this.client.put('/api/event', { eventId, ...payload });

      return res.data as ApiResponse<EventResponse>;
    } catch (error: any) {
      return await this.handleError(error);
    }
  }

  async deleteEvent(eventId: string) {
    try {
      const res = await this.client.delete(`/api/event?id=${eventId}`);

      return res.data as ApiResponse<DeleteResponse>;
    } catch (error: any) {
      return await this.handleError(error);
    }
  }

  async getMaxSeatCount(): Promise<ApiResponse<number>> {
    try {
      const res = await this.client.get('/api/rooms/highest-seat-count');

      return res.data as ApiResponse<number>;
    } catch (error: any) {
      return await this.handleError(error);
    }
  }

  async getFloors() {
    try {
      const res = await this.client.get('/api/floors');

      return res.data as ApiResponse<string[]>;
    } catch (error: any) {
      return await this.handleError(error);
    }
  }

  createReply(status: StatusTypes, message?: string, data?: any): ApiResponse<any> {
    return { status, message, data };
  }

  async handleError(error: any) {
    // used for Abort request controllers
    if (error.code === 'ERR_CANCELED') {
      return this.createReply('ignore', 'Pending request aborted', null);
    }

    console.error(error);

    const res: ApiResponse<any> = error?.response?.data;
    if (res) {
      console.error(res);
      return res;
    }

    return this.createReply('error', 'Something went wrong', null);
  }
}
