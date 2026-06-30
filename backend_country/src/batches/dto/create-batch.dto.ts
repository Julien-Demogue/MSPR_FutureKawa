import { ApiProperty } from "@nestjs/swagger";
import { IsNumber } from "class-validator";

export class CreateBatchDto {
    @ApiProperty()
    @IsNumber()
    id_warehouse!: number;
}