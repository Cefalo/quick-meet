import { IAuth } from './auth.interface';

export class IUser {
  id?: string;
  authId?: number;
  auth: IAuth;
  email?: string;
  name?: string;
  createdAt?: Date;
  updatedAt?: Date;
}
