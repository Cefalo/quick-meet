import { IConferenceRoom, IPeopleInformation } from '@quickmeet/shared';
import { BadRequestException, Inject, Injectable, Logger, UnauthorizedException } from '@nestjs/common';
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

  async login(code: string) {
    const client = this.googleApiService.getOAuthClient();
    const { tokens } = await this.googleApiService.getToken(client, code);
    const userInfo = await this.jwtService.decode(tokens.id_token);

    await this.getDirectoryResources(client);
    await this.getPeopleResources(client);

    this.logger.log(`User logged in: ${JSON.stringify(userInfo)}`);

    const encryptedAccessToken = await this.encryptionService.encrypt(tokens.access_token);
    const encryptedRefreshToken = await this.encryptionService.encrypt(tokens.refresh_token);

    return {
      accessToken: encryptedAccessToken.encryptedData,
      accessTokenIv: encryptedAccessToken.iv,
      refreshToken: encryptedRefreshToken?.encryptedData,
      refreshTokenIv: encryptedRefreshToken?.iv,
      hd: userInfo.hd,
      email: userInfo.email,
    };
  }

  async refreshAppToken(refreshToken?: string) {
    if (!refreshToken) {
      throw new BadRequestException("Couldn't rotate token. No refresh token");
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

  async getFloors(client: OAuth2Client): Promise<string[]> {
    const conferenceRooms = (await this.getDirectoryResources(client)) || [];
    const floors = Array.from(new Set(conferenceRooms.map((room) => room.floor)));

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
  async createDirectoryResources(oauth2Client: OAuth2Client): Promise<IConferenceRoom[]> {
    const { items } = await this.googleApiService.getCalendarResources(oauth2Client);

    const rooms: IConferenceRoom[] = [];
    for (const resource of items) {
      rooms.push({
        id: resource.resourceId,
        email: resource.resourceEmail,
        description: resource.userVisibleDescription,
        floor: resource.floorName, // in the format of F3 or F1, whatever the organization assigns
        name: resource.resourceName,
        seats: resource.capacity,
      });
    }

    await this.saveToCache('conference_rooms', rooms);
    this.logger.log(`Conference rooms created successfully, Count: ${rooms.length}`);

    return rooms;
  }

  async createPeopleList(oauth2Client: OAuth2Client): Promise<IPeopleInformation[]> {
    const items = await this.googleApiService.listPeople(oauth2Client);

    const people: IPeopleInformation[] = items.map((item) => {
      const email = item.emailAddresses.find((email) => email.metadata.primary && email.metadata.verified);
      const photo = item.photos?.find((photo) => photo.metadata.primary);
      const name = item.names?.find((name) => name.metadata.primary);
      return {
        email: email?.value,
        name: name?.displayName,
        photo: photo?.url,
      };
    });

    await this.saveToCache('people', people, toMs('30d'));
    this.logger.log(`People data created successfully, Count: ${people.length}`);

    return people;
  }

  /**
   * obtains the people resources from the in-memory cache, if not found, creates them
   */
  async getPeopleResources(client: OAuth2Client): Promise<IPeopleInformation[] | null> {
    let people: IPeopleInformation[] = await this.cacheManager.get('people');
    if (!people) {
      people = await this.createPeopleList(client);
    }

    return people;
  }

  /**
   * obtains the directory resources from the in-memory cache (sorted by floor), if not found, creates them
   */
  async getDirectoryResources(client: OAuth2Client): Promise<IConferenceRoom[] | null> {
    let rooms: IConferenceRoom[] = await this.cacheManager.get('conference_rooms');
    if (!rooms) {
      rooms = await this.createDirectoryResources(client);
    }

    return rooms.sort((a: IConferenceRoom, b: IConferenceRoom) => a.seats - b.seats);
  }

  /**
   * saves the conference rooms in the cache
   */
  async saveToCache(key: string, value: unknown, expiry = toMs('15d')): Promise<void> {
    await this.cacheManager.set(key, value, expiry); // set TTL to 15 days
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
