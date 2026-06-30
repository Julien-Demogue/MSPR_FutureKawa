import { ApiProperty } from "@nestjs/swagger";
import { IsEnum, IsNumber } from "class-validator";
import { Transform } from "class-transformer";

export class CreateStatementDto {

    @ApiProperty({ type: 'number', description: 'Sensor captor value. Accepts numbers or strings representing numbers' })
    @Transform(({ value }) => (typeof value === 'string' ? Number(value) : value))
    @IsNumber()
    value!: number;

    @ApiProperty()
    @IsEnum(['TEMPERATURE', 'HUMIDITY'])
    type!: string;

    @ApiProperty()
    @IsNumber()
    id_warehouse!: number;
}