export interface IJwtPayload {
  name: string;
  accessToken: string;
  hd: string;
  exp?: number;
  iat?: number;
}
