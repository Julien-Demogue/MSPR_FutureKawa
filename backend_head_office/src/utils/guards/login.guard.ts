import { ExecutionContext, Injectable, SetMetadata } from "@nestjs/common";
import { Reflector } from "@nestjs/core";
import { AuthGuard } from "@nestjs/passport";
import { Observable } from "rxjs";
import { IS_PUBLIC_KEY } from "../decorators/public.decorator";

/**
 * Authentication guard responsible for protecting routes using JWT strategy.
 *
 * This guard:
 * - Allows access to routes marked as public via the {@link IS_PUBLIC_KEY} metadata
 * - Allows access if a user is already attached to the request
 * - Falls back to the JWT authentication strategy otherwise
 */
@Injectable()
export class LoginGuard extends AuthGuard('jwt') {
    constructor(private readonly reflector: Reflector) {
        super();
    }

    /**
     * Determines whether the current request can proceed.
     *
     * @param context - The execution context of the incoming request
     * @returns `true` if access is granted, otherwise delegates to JWT authentication
     */
    canActivate(
        context: ExecutionContext,
    ): boolean | Promise<boolean> | Observable<boolean> {

        const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
            context.getHandler(),
            context.getClass(),
        ]);

        // Public routes bypass authentication
        if (isPublic) {
            return true;
        }

        // Default JWT authentication
        return super.canActivate(context);
    }
}