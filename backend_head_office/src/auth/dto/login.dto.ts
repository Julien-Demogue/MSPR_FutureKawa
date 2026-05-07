import { ApiProperty } from "@nestjs/swagger";
import { IsEmail, Length } from "class-validator";

export class LoginDto {
  @ApiProperty({ example: "john.doe@itsap.fr" })
  @IsEmail()
  email!: string;

  @ApiProperty({ example: "password1234" })
  @Length(8)
  password!: string;
}