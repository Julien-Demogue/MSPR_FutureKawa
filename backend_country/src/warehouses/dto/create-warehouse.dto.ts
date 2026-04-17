import { ApiProperty } from "@nestjs/swagger";
import { IsString, IsNumber } from "class-validator";

export class CreateWarehouseDto {
    @ApiProperty()
    @IsString()
    name!: string;

    @ApiProperty()
    @IsNumber()
    id_farm!: number;
}