import { applyDecorators, UseGuards, SetMetadata } from '@nestjs/common';
import { Roles } from '../guards/role.guard';
import { LoginGuard } from '../guards/login.guard';
import { RoleGuard } from '../guards/role.guard';

export function Guard(...roles: string[]) {
    return applyDecorators(
        UseGuards(LoginGuard, RoleGuard),
        Roles(...roles),
    );
}