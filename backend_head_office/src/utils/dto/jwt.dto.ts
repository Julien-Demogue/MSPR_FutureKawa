export class JwtPayload {
    sub!: string;
    role_label!: string;
    iat?: number;
    exp?: number;
}

export class JwtTokenDto {
    access_token!: string;
    refresh_token!: string;
}