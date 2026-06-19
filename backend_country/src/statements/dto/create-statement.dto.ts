import { ApiProperty } from "@nestjs/swagger";
import { IsDecimal, IsEnum, IsNumber } from "class-validator";

export class CreateStatementDto {

    @ApiProperty()
    @IsDecimal({ decimal_digits: '5,2' })
    value!: number;

    @ApiProperty()
    @IsEnum(['TEMPERATURE', 'HUMIDITY'])
    type!: string;

    @ApiProperty()
    @IsNumber()
    id_warehouse!: number;
}