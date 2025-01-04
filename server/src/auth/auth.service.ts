import { IConferenceRoom } from '@quickmeet/shared';
import { Inject, Injectable, Logger, UnauthorizedException } from '@nestjs/common';
import appConfig from '../config/env/app.config';
import { ConfigType } from '@nestjs/config';
import { IJwtPayload } from './dto';
import { JwtService } from '@nestjs/jwt';
import { OAuth2Client } from 'google-auth-library';
import to from 'await-to-js';
import { GoogleApiService } from '../google-api/google-api.service';
import { Cache } from 'cache-manager';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { EncryptionService } from './encryption.service';
import { _OAuth2Client } from 'src/auth/decorators';
import { CookieOptions } from 'express';
import { RefreshAccessTokenResponse } from 'google-auth-library/build/src/auth/oauth2client';

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

  async login(code: string) {
    const client = this.googleApiService.getOAuthClient();
    const { tokens } = await this.googleApiService.getToken(client, code);
    const userInfo = await this.jwtService.decode(tokens.id_token);

    const _ = await this.getDirectoryResources(client, userInfo.hd);

    const jwt = await this.createAppToken(tokens.access_token, userInfo.hd, userInfo.name);
    this.logger.log(`User logged in: ${JSON.stringify(userInfo)}`);

    return {
      jwt,
      refreshToken: tokens.refresh_token,
    };
  }

  async createAppToken(accessToken: string, domain: string, name: string) {
    const jwtPayload: IJwtPayload = { accessToken, hd: domain, name: name };

    const { iv, encryptedData } = await this.encryptionService.encrypt(JSON.stringify(jwtPayload));
    const jwt = await this.createJwt({ payload: encryptedData, iv }, '1h');

    return jwt;
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

  async createJwt(payload: any, expiresIn: string) {
    // todo: hard coding to 1h cause if the oAuthExpiry is used (even when converted to seconds), produce large exp values, eg 2079. No idea why
    return await this.jwtService.signAsync(payload, { secret: this.config.jwtSecret, expiresIn });
  }

  getOAuthUrl(): string {
    return this.googleApiService.getOAuthUrl();
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

    const userInfo = await this.jwtService.decode(res.credentials.id_token);
    const jwt = await this.createAppToken(res.credentials.access_token, userInfo.hd, userInfo.name);
    return jwt;
  }

  /**
   * remove the refresh token from the cookie
   * the accessToken is removed from the client side
   */
  async logout(@_OAuth2Client() client: OAuth2Client): Promise<boolean> {
    try {
      await this.purgeAccess(client);
      return true;
    } catch (error) {
      return false;
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

  getCookieOptions(httpOnly = true, age = 2592000000) {
    return {
      httpOnly: httpOnly,
      secure: this.config.environment === 'development' ? false : true,
      sameSite: 'strict',
      path: '/',
      maxAge: age,
    } as CookieOptions;
  }
}
