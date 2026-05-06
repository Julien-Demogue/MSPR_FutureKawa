import { CanActivate, ExecutionContext, Injectable, applyDecorators, UseGuards, SetMetadata } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { JwtPayload } from '../dto/jwt.dto';
import { RolesPermissions } from '../constants/roles-permissions.constant';

/**
 * Guard that checks whether the authenticated user
 * has the required permission to access a route.
 */
@Injectable()
export class PermissionGuard implements CanActivate {
    constructor(private reflector: Reflector) { }

    canActivate(context: ExecutionContext): boolean {
        const request = context.switchToHttp().getRequest();
        const user: JwtPayload = request.user;

        if (!user) return false;

        const requiredPermission = this.reflector.getAllAndOverride<string>(
            'permission',
            [context.getHandler(), context.getClass()],
        );

        if (!requiredPermission) return true;

        const permissions =
            RolesPermissions[user.role_label as keyof typeof RolesPermissions];

        return permissions?.includes(requiredPermission);
    }
}

/**
 * Decorator that restricts access to a route or controller
 * based on a required permission.
 *
 * This decorator:
 * - Attaches the required permission as metadata
 * - Applies the {@link PermissionGuard} to enforce access control
 *
 * The authenticated user must have the specified permission
 * in their `permissions` array to access the endpoint.
 *
 * @param permission - The permission required to access the resource
 *
 * @example @Permission('users:read')
 */
export const Permission = (permission: string) =>
    SetMetadata('permission', permission);