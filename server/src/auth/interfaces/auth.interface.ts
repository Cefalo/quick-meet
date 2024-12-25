export class IAuth {
  id?: number;
  accessToken?: string;
  refreshToken?: string;
  scope?: string;
  idToken?: string;
  tokenType?: string;
  expiryDate?: number;
  createdAt?: Date;
  updatedAt?: Date;
}
