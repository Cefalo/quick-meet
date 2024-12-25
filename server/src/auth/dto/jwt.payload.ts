export interface IJwtPayload {
  name?: string;
  expiresIn?: number;
  accessToken: string;
  refreshToken?: string;
  scope: string;
  expiryDate: number;
  tokenType: string;
  hd: string;
}
