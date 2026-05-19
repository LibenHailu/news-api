import { Injectable } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { UserService } from '../user/user.service';
import { UserRole } from '../user/entities/user.entity';
import * as bcrypt from 'bcrypt';

export type AuthUser = {
  _id: string;
  email: string;
  name: string;
  role: UserRole;
};

@Injectable()
export class AuthService {
  constructor(
    private readonly userService: UserService,
    private readonly jwtService: JwtService,
  ) {}

  async validateUser(email: string, pass: string): Promise<AuthUser | null> {
    const user = await this.userService.findByEmail(email);
    if (!user) {
      return null;
    }

    const isMatch = await bcrypt.compare(pass, user.password);
    if (!isMatch) {
      return null;
    }

    return {
      _id: String(user._id),
      email: user.email,
      name: user.name,
      role: user.role,
    };
  }

  login(user: AuthUser) {
    const payload = {
      sub: String(user._id),
      email: user.email,
      role: user.role,
    };
    return {
      access_token: this.jwtService.sign(payload),
    };
  }
}
