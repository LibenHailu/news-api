import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import { JwtPayloadUser } from '../types/jwt-payload.type';

export const CurrentUser = createParamDecorator(
  (_data: unknown, ctx: ExecutionContext): JwtPayloadUser => {
    const request = ctx.switchToHttp().getRequest<{ user: JwtPayloadUser }>();
    return request.user;
  },
);
