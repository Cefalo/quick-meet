import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import { _Request } from '../interfaces';

/**
 * can only be used if the endpoint has the AuthGuard applied to it
 */
export const _OAuth2Client = createParamDecorator((data: unknown, ctx: ExecutionContext) => {
  const request: _Request = ctx.switchToHttp().getRequest();
  return request.oauth2Client;
});
