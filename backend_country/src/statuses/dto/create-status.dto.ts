import { ApiProperty } from "@nestjs/swagger";
import { IsEnum, IsNumber } from "class-validator";

export class CreateStatusDto {
    @ApiProperty()
    @IsEnum(['OK', 'ALERT', 'EXPIRED', 'SENT'])
    value!: 'OK' | 'ALERT' | 'EXPIRED' | 'SENT';

    @ApiProperty()
    @IsNumber()
    id_batch!: number;
}