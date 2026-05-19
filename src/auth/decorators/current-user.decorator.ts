import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import { JwtPayloadUser } from '../types/jwt-payload.type';

export const CurrentUser = createParamDecorator(
  (_data: unknown, ctx: ExecutionContext): JwtPayloadUser | null => {
    const request = ctx
      .switchToHttp()
      .getRequest<{ user?: JwtPayloadUser | null }>();
    return request.user ?? null;
  },
);
