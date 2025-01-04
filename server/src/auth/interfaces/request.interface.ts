import { OAuth2Client } from 'google-auth-library';
import { Request } from 'express';

export interface _Request extends Request {
  hd?: string;
  accessToken?: string;
  refreshToken?: string;
  oauth2Client?: OAuth2Client;
}
