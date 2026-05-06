import { Injectable } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { ConfigService } from '@nestjs/config';
import { extractAccessFromCookie } from './utils.strategy';
import { JwtPayload } from '../dto/jwt.dto';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
    constructor(readonly configService: ConfigService) {
        super({
            secretOrKey: configService.getOrThrow("JWT_SECRET"),
            ignoreExpiration: false,
            jwtFromRequest: ExtractJwt.fromExtractors([
                extractAccessFromCookie,
            ]),
        });
    }

    async validate(payload: JwtPayload) {
        return payload;
    }
}