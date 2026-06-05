import { CanActivate, ExecutionContext, Injectable, UnauthorizedException } from '@nestjs/common';

@Injectable()
export class ServiceAuthGuard implements CanActivate {
    canActivate(context: ExecutionContext): boolean {
        const request = context.switchToHttp().getRequest();
        const serviceToken = request.headers['x-api-key'];
        if (!serviceToken || serviceToken !== process.env.COUNTRY_API_SECRET) {
            throw new UnauthorizedException('Invalid service token');
        }
        return true;
    }
}