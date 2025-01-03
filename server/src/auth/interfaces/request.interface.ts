import { OAuth2Client } from 'google-auth-library';
import { Request } from 'express';

export interface _Request extends Request {
  hd?: string;
  access_token?: string;
  refresh_token?: string;
  oauth2Client?: OAuth2Client;
}
