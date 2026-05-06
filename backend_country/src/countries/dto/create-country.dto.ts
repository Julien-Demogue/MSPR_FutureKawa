import { ApiProperty } from "@nestjs/swagger";
import { IsString, IsNumber  } from "class-validator";

export class CreateCountryDto { 
    @ApiProperty()
    @IsString()
    name!: string;

    @ApiProperty()
    @IsNumber()
    temperature_ideal!: number;

    @ApiProperty()
    @IsNumber()
    temperature_tolerance_degrees!: number;

    @ApiProperty()
    @IsNumber()
    humidity_ideal!: number;

    @ApiProperty()
    @IsNumber()
    humidity_tolerance_percents!: number;
}