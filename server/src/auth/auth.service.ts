import { IConferenceRoom } from '@quickmeet/shared';
import { Inject, Injectable, Logger, UnauthorizedException } from '@nestjs/common';
import appConfig from '../config/env/app.config';
import { ConfigType } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { OAuth2Client } from 'google-auth-library';
import to from 'await-to-js';
import { GoogleApiService } from '../google-api/google-api.service';
import { Cache } from 'cache-manager';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { _OAuth2Client } from 'src/auth/decorators';
import { CookieOptions } from 'express';
import { RefreshAccessTokenResponse } from 'google-auth-library/build/src/auth/oauth2client';
import { toMs } from 'src/helpers/helper.util';
import { EncryptionService } from './encryption.service';

@Injectable()
export class AuthService {
  constructor(
    @Inject(appConfig.KEY) private config: ConfigType<typeof appConfig>,
    @Inject('GoogleApiService') private readonly googleApiService: GoogleApiService,
    private encryptionService: EncryptionService,
    @Inject(CACHE_MANAGER) private cacheManager: Cache,
    private jwtService: JwtService,
    private logger: Logger,
  ) {}

  async login(code: string, oauthRedirectUrl: string) {
    const client = this.googleApiService.getOAuthClient(oauthRedirectUrl);
    const { tokens } = await this.googleApiService.getToken(client, code);
    const userInfo = await this.jwtService.decode(tokens.id_token);

    const _ = await this.getDirectoryResources(client, userInfo.hd);

    this.logger.log(`User logged in: ${JSON.stringify(userInfo)}`);

    const data = await this.encryptionService.encrypt(tokens.refresh_token);

    return {
      accessToken: tokens.access_token,
      hd: userInfo.hd,
      userId: userInfo.sub,
      refreshToken: data?.encryptedData,
      iv: data?.iv,
    };
  }

  async refreshAppToken(refreshToken?: string) {
    if (!refreshToken) {
      throw new UnauthorizedException("Couldn't rotate token. Try re-logging");
    }

    const client = this.googleApiService.getOAuthClient();
    client.setCredentials({ refresh_token: refreshToken });

    const [refreshTokenErr, res]: [Error, RefreshAccessTokenResponse] = await to(client.refreshAccessToken());

    if (refreshTokenErr) {
      throw new UnauthorizedException(refreshTokenErr.message);
    }

    return res.credentials.access_token;
  }

  /**
   * purging is required to revoke the refresh token as google's refresh tokens have no expiry date
   * Revoking a token, also prompts google to issue a new refresh token when logging back again
   * more: https://stackoverflow.com/a/8954103
   */
  async logout(@_OAuth2Client() client: OAuth2Client): Promise<boolean> {
    const [err, _] = await to(client.revokeCredentials());

    if (err) {
      this.logger.error(`[logout]: ${err}`);
      return false;
    }

    return true;
  }

  async getFloors(client: OAuth2Client, domain: string): Promise<string[]> {
    const conferenceRooms = (await this.getDirectoryResources(client, domain)) || [];
    const floors = Array.from(new Set(conferenceRooms.filter((room) => room.domain === domain).map((room) => room.floor)));

    // assuming floor is a string in the format F1, F2 etc
    floors.sort((a, b) => {
      const numA = parseInt(a.slice(1), 10);
      const numB = parseInt(b.slice(1), 10);
      return numA - numB;
    });

    return floors;
  }

  /**
   * gets the calender resources from google and save it in the cache
   */
  async createDirectoryResources(oauth2Client: OAuth2Client, domain: string): Promise<IConferenceRoom[]> {
    const { items } = await this.googleApiService.getCalendarResources(oauth2Client);

    const rooms: IConferenceRoom[] = [];
    for (const resource of items) {
      rooms.push({
        id: resource.resourceId,
        email: resource.resourceEmail,
        description: resource.userVisibleDescription,
        domain: domain,
        floor: resource.floorName, // in the format of F3 or F1, whatever the organization assigns
        name: resource.resourceName,
        seats: resource.capacity,
      });
    }

    await this.saveDirectoryResouces(rooms);
    this.logger.log(`Conference rooms created successfully, Count: ${rooms.length}`);

    return rooms;
  }

  /**
   * obtains the directory resources from the in-memory cache (sorted by floor), if not found, creates them
   */
  async getDirectoryResources(client: OAuth2Client, domain: string): Promise<IConferenceRoom[] | null> {
    let rooms: IConferenceRoom[] = await this.cacheManager.get('conference_rooms');
    if (!rooms) {
      rooms = await this.createDirectoryResources(client, domain);
    }

    const resources = rooms.filter((room: IConferenceRoom) => room.domain === domain).sort((a: IConferenceRoom, b: IConferenceRoom) => a.seats - b.seats);
    return resources;
  }

  /**
   * saves the conference rooms in the cache
   */
  async saveDirectoryResouces(resources: IConferenceRoom[], expiry = toMs('15d')): Promise<void> {
    await this.cacheManager.set('conference_rooms', resources, expiry); // set TTL to 15 days
  }

  getCookieOptions(age = toMs('30d')) {
    return {
      httpOnly: true,
      secure: this.config.environment === 'development' ? false : true,
      sameSite: 'strict',
      path: '/',
      maxAge: age,
    } as CookieOptions;
  }
}
