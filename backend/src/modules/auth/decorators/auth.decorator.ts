import { applyDecorators, UseGuards } from '@nestjs/common';
import { ApiBearerAuth } from '@nestjs/swagger';
import { JwtAuthGuard } from '../../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../../common/guards/roles.guard';
import { Roles } from '../../../common/decorators/roles.decorator';
import { UserRole } from '../../users/entities/user.entity';

export function Auth(...roles: UserRole[]) {
  const guards = roles.length > 0 ? [JwtAuthGuard, RolesGuard] : [JwtAuthGuard];

  return applyDecorators(
    UseGuards(...guards),
    ApiBearerAuth('access-token'),
    Roles(...roles),
  );
}
