import { CanActivate, ExecutionContext, Injectable, SetMetadata } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { JwtPayload } from '../dto/jwt.dto';

/**
 * Guard that checks whether the authenticated user
 * has a required role to access a route.
 */
@Injectable()
export class RoleGuard implements CanActivate {
    constructor(private reflector: Reflector) { }

    canActivate(context: ExecutionContext): boolean {
        const request = context.switchToHttp().getRequest();
        const user: JwtPayload = request.user;

        if (!user || !user.role_label) return false;

        const requiredRoles = this.reflector.getAllAndOverride<string[]>(
            'roles',
            [context.getHandler(), context.getClass()],
        );

        if (!requiredRoles || requiredRoles.length === 0) return true;

        const userRole = user.role_label.toUpperCase();
        return requiredRoles.some(role => role.toUpperCase() === userRole);
    }
}

/**
 * Decorator that restricts access to a route or controller
 * based on required roles.
 *
 * This decorator:
 * - Attaches the required roles as metadata
 * - Applies the {@link RoleGuard} to enforce access control
 *
 * The authenticated user must have one of the specified roles
 * to access the endpoint.
 *
 * @param roles - The roles required to access the resource
 *
 * @example @Roles('SUPERADMIN', 'ADMIN')
 */
export const Roles = (...roles: string[]) =>
    SetMetadata('roles', roles);
