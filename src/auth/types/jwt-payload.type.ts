import { UserRole } from '../../user/entities/user.entity';

export type JwtPayloadUser = {
  userId: string;
  email: string;
  role: UserRole;
};
