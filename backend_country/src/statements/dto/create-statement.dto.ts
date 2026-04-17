import { ApiProperty } from "@nestjs/swagger";
import { IsDecimal, IsNumber } from "class-validator";

export class CreateStatementDto {

    @ApiProperty()
    @IsDecimal({ decimal_digits: '5,2' })
    temperature!: number;

    @ApiProperty()
    @IsDecimal({ decimal_digits: '5,2' })
    humidity!: number;

    @ApiProperty()
    @IsNumber()
    id_warehouse!: number;
}