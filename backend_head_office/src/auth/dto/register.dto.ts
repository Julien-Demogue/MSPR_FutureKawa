import { ApiProperty } from "@nestjs/swagger";
import { IsEmail, IsString } from "class-validator";

export class RegisterDto {
  @ApiProperty({ example: "john.doe@itsap.fr" })
  @IsEmail()
  email!: string;

  @ApiProperty({ example: "password1234" })
  @IsString()
  password!: string;
}