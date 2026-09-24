import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import { AuthUser } from '@leaderos/shared-types';
import { Request } from 'express';

export interface AuthenticatedRequest extends Request {
  user?: AuthUser;
}

export const CurrentUser = createParamDecorator(
  (data: keyof AuthUser | undefined, ctx: ExecutionContext): unknown => {
    const request = ctx.switchToHttp().getRequest<AuthenticatedRequest>();
    const user = request.user;
    return data && user ? user[data] : user;
  },
);

