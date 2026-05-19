import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { AuthorService } from './author.service';
import { QueryDashboardDto } from './dto/query-dashboard.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { UserRole } from '../user/entities/user.entity';
import type { JwtPayloadUser } from '../auth/types/jwt-payload.type';

@Controller('author')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.AUTHOR)
export class AuthorController {
  constructor(private readonly authorService: AuthorService) {}

  @Get('dashboard')
  getDashboard(
    @CurrentUser() user: JwtPayloadUser,
    @Query() query: QueryDashboardDto,
  ) {
    return this.authorService.getDashboard(user.userId, query);
  }
}
