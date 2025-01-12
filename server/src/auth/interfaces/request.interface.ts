import { OAuth2Client } from 'google-auth-library';
import { Request } from 'express';

export interface _Request extends Request {
  hd?: string;
  accessToken?: string;
  accessTokenIv?: string;
  refreshToken?: string;
  refreshTokenIv?: string;
  oauth2Client?: OAuth2Client;
  email?: string;
}
