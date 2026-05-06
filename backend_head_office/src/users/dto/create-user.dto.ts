import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsEmail, IsInt, IsOptional, IsString } from 'class-validator';

export class CreateUserDto {
    @ApiPropertyOptional()
    @IsString()
    first_name!: string;

    @ApiPropertyOptional()
    @IsString()
    last_name!: string;

    @ApiProperty()
    @IsEmail()
    email!: string;

    @ApiProperty()
    @IsString()
    password!: string;

    @ApiPropertyOptional()
    @IsString()
    role_label!: string;
}
