import { ApiProperty } from "@nestjs/swagger";
import { IsNumber, IsString } from "class-validator";

export class CreateAlertDto {
    @ApiProperty()
    @IsString()
    value!: string;

    @ApiProperty()
    @IsNumber()
    id_status!: number;

    @ApiProperty()
    @IsNumber()
    id_statement!: number;
}