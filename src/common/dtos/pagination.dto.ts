import { Type } from 'class-transformer';
import { IsInt, IsOptional, IsPositive } from 'class-validator';

export class PaginationDto {
    
    @IsOptional()
    @IsInt()
    @IsPositive()
    // Transformar automaticamente.
    // Esto seria igual a que hicieramos el enableImplicitConversion: true
    // Tal y como lo hice en el main.ts del pokedex con mongo
    @Type( () => Number) 
    limit?: number

    @IsOptional()
    @IsInt()
    @Type( () => Number)
    offset?: number
}