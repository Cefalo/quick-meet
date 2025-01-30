import { ROUTES } from '@/config/routes';
import { secrets } from '@config/secrets';
import { CacheService, CacheServiceFactory } from '@helpers/cache';
import { ApiResponse, BookRoomDto, DeleteResponse, EventResponse, GetAvailableRoomsQueryDto, IAvailableRooms, StatusTypes } from '@quickmeet/shared';
import axios, { AxiosInstance } from 'axios';
import { toast } from 'react-hot-toast';
import { NavigateFunction } from 'react-router-dom';

/**
 * @description Serves as the base API endpoint for the application. It provides the authorization token in every request
 */
export default class Api {
  private static instance: Api;
  apiToken?: string;
  client: AxiosInstance;
  private navigate: NavigateFunction | undefined;

  cacheService: CacheService = CacheServiceFactory.getCacheService();

  constructor(navigate?: NavigateFunction) {
    this.client = axios.create({
      baseURL: secrets.backendEndpoint,
      timeout: secrets.nodeEnvironment === 'development' ? 1000000 : 10000,
      headers: this.getHeaders(),
      withCredentials: secrets.nodeEnvironment === 'development' ? true : false,
    });

    this.navigate = navigate;
    this.handleTokenRefresh();
  }

  static getInstance(navigate: NavigateFunction): Api {
    if (!Api.instance) {
      Api.instance = new Api(navigate);
    }
    return Api.instance;
  }

  getHeaders() {
    return {
      Accept: 'application/json',
      'x-mock-api': secrets.mockCalender,
    };
  }

  async refreshToken() {
    try {
      const res = await axios.get('/auth/token/refresh', {
        baseURL: secrets.backendEndpoint,
        timeout: secrets.nodeEnvironment === 'development' ? 1000000 : 10000,
        headers: this.getHeaders(),
        withCredentials: secrets.nodeEnvironment === 'development' ? true : false,
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

        if (error.response?.status === 401 && !originalRequest._retry) {
          originalRequest._retry = true;

          const renewedToken = await this.refreshToken();
          if (!renewedToken) {
            await this.logout();

            this.navigate && this.navigate(ROUTES.signIn);
            return Promise.reject(error);
          }

          return this.client(originalRequest);
        }

        return Promise.reject(error);
      },
    );
  }

  async getOAuthUrl(client: 'chrome' | 'web' = 'web') {
    try {
      const { data } = await this.client.get('/auth/oauth2/url', {
        params: {
          client,
        },
      });
      return this.createReply('success', '', data.data) as ApiResponse<string>;
    } catch (error: any) {
      return this.handleError(error);
    }
  }

  async handleOAuthCallback(code: string) {
    try {
      const payload = {
        code,
      };

      await this.client.post('/auth/oauth2/callback', payload);
      return this.createReply() as ApiResponse<boolean>;
    } catch (error: any) {
      return this.handleError(error);
    }
  }

  async logout(revokeToken: boolean = false) {
    try {
      await this.client.post('/auth/logout', {
        revokeToken,
      });
      return true;
    } catch (error: any) {
      return false;
    }
  }

  async login() {
    const { data } = await this.getOAuthUrl(secrets.appEnvironment);
    if (!data) {
      toast.error('Failed to retrieve oauth callback url');
      return;
    }

    secrets.appEnvironment === 'chrome' ? window.open(data) : (window.location.href = data);
  }

  async getAvailableRooms(signal: AbortSignal, startTime: string, duration: number, timeZone: string, seats: number, floor?: string, eventId?: string) {
    try {
      const params: GetAvailableRoomsQueryDto = { startTime, duration, timeZone, seats, floor, eventId };
      const res = await this.client.get('/api/rooms/available', { params, signal });

      return res.data as ApiResponse<IAvailableRooms>;
    } catch (error: any) {
      return this.handleError(error);
    }
  }

  async getEvents(signal: AbortSignal, startTime: string, endTime: string, timeZone: string) {
    try {
      const res = await this.client.get('/api/events', {
        params: {
          startTime,
          endTime,
          timeZone,
        },
        signal,
      });

      return res.data as ApiResponse<EventResponse[]>;
    } catch (error: any) {
      return this.handleError(error);
    }
  }

  async createEvent(payload: BookRoomDto) {
    try {
      const res = await this.client.post('/api/event', payload);

      return res.data as ApiResponse<EventResponse>;
    } catch (error: any) {
      return this.handleError(error);
    }
  }

  async updateEvent(eventId: string, payload: BookRoomDto) {
    try {
      const res = await this.client.put('/api/event', { eventId, ...payload });

      return res.data as ApiResponse<EventResponse>;
    } catch (error: any) {
      return this.handleError(error);
    }
  }

  async updateEventResponse(eventId: string, response: string) {
    try {
      const res = await this.client.put('/api/event/response', { eventId, response });

      return res.data as ApiResponse<EventResponse>;
    } catch (error: any) {
      return this.handleError(error);
    }
  }

  async deleteEvent(eventId: string) {
    try {
      const res = await this.client.delete(`/api/event?id=${eventId}`);

      return res.data as ApiResponse<DeleteResponse>;
    } catch (error: any) {
      return this.handleError(error);
    }
  }

  async getMaxSeatCount(): Promise<ApiResponse<number>> {
    try {
      const res = await this.client.get('/api/rooms/highest-seat-count');

      return res.data as ApiResponse<number>;
    } catch (error: any) {
      return this.handleError(error);
    }
  }

  async searchPeople(email: string): Promise<ApiResponse<string[]>> {
    try {
      const res = await this.client.get('/api/directory/people', {
        params: {
          email,
        },
      });

      return res.data as ApiResponse<string[]>;
    } catch (error: any) {
      return this.handleError(error);
    }
  }
  async getFloors() {
    try {
      const res = await this.client.get('/api/floors');

      return res.data as ApiResponse<string[]>;
    } catch (error: any) {
      return this.handleError(error);
    }
  }

  createReply(status: StatusTypes = 'success', message?: string, data?: any): ApiResponse<any> {
    return { status, message, data };
  }

  handleError(error: any) {
    // used for Abort request controllers
    if (error.code === 'ERR_CANCELED') {
      return this.createReply('ignore', 'Pending request aborted', null);
    }

    const res: ApiResponse<any> = error?.response?.data;
    if (res) {
      return res;
    }

    return this.createReply('error', 'Something went wrong', null);
  }
}
