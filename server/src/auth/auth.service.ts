import { type IConferenceRoom } from '@quickmeet/shared';
import { ApiResponse } from '@quickmeet/shared';
import { Inject, Injectable, Logger } from '@nestjs/common';
import appConfig from '../config/env/app.config';
import { ConfigType } from '@nestjs/config';
import { IJwtPayload } from './dto';
import { JwtService } from '@nestjs/jwt';
import { OAuth2Client } from 'google-auth-library';
import to from 'await-to-js';
import { createResponse } from '../helpers/payload.util';
import { GoogleApiService } from '../google-api/google-api.service';
import type { Cache } from 'cache-manager';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { EncryptionService } from './encryption.service';
import { _OAuth2Client } from 'src/auth/decorators';
import type { CookieOptions } from 'express';

@Injectable()
export class AuthService {
  constructor(
    private readonly encryptionService: EncryptionService,
    @Inject(appConfig.KEY) private config: ConfigType<typeof appConfig>,
    @Inject('GoogleApiService') private readonly googleApiService: GoogleApiService,
    @Inject(CACHE_MANAGER) private cacheManager: Cache,
    private jwtService: JwtService,
    private logger: Logger,
  ) {}

  async login(code: string, redirectUrl: string) {
    const client = this.googleApiService.getOAuthClient(redirectUrl);
    const { tokens } = await this.googleApiService.getToken(client, code);
    const userInfo = this.jwtService.decode(tokens.id_token);

    const _ = await this.getDirectoryResources(client, userInfo.hd);

    const jwtPayload: IJwtPayload = {
      accessToken: tokens.access_token,
      scope: tokens.scope,
      expiryDate: tokens.expiry_date,
      tokenType: tokens.token_type,
      hd: userInfo.hd,
      name: userInfo.name,
    };

    const { iv, encryptedData } = await this.encryptionService.encrypt(JSON.stringify(jwtPayload));
    const jwt = await this.createJwt({ payload: encryptedData, iv }, jwtPayload.expiryDate);

    this.logger.log(`User logged in: ${JSON.stringify(userInfo)}`);

    return {
      jwt,
      refreshToken: tokens.refresh_token,
    };
  }

  /**
   *  purging is required to revoke the refresh token as google's refresh tokens have no expiry date
   *  more: https://stackoverflow.com/a/8954103
   */
  async purgeAccess(oauth2Client: OAuth2Client) {
    const [err, _] = await to(oauth2Client.revokeCredentials());

    if (err) {
      this.logger.error(err);
      return false;
    }

    return true;
  }

  async createJwt(payload: any, oAuthExpiry: number) {
    return await this.jwtService.signAsync(payload, { secret: this.config.jwtSecret, expiresIn: oAuthExpiry });
  }

  async validateSession() {
    return createResponse(true);
  }

  /**
   * remove the refresh token from the cookie
   * the access_token is removed from the client side
   */
  async logout(@_OAuth2Client() client: OAuth2Client): Promise<ApiResponse<boolean>> {
    try {
      await this.purgeAccess(client);
      return createResponse(true);
    } catch (error) {
      return createResponse(false);
    }
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
  async saveDirectoryResouces(resources: IConferenceRoom[], expiry = 15 * 24 * 60 * 60 * 1000): Promise<void> {
    await this.cacheManager.set('conference_rooms', resources, expiry); // set TTL to 15 days
  }

  getCookieOptions(age = 30 * 24 * 60 * 60 * 1000) {
    return {
      httpOnly: true,
      secure: this.config.environment === 'development' ? false : true,
      sameSite: 'strict',
      path: '/',
      maxAge: age,
    } as CookieOptions;
  }
}
