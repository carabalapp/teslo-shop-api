import { IsArray, IsIn, IsInt, IsNumber, IsOptional, IsPositive, IsString, MinLength } from "class-validator";

export class CreateProductDto {

    @IsString()
    @MinLength(1)
    title: string;

    @IsNumber()
    @IsPositive()
    @IsOptional()
    price?: number;

    @IsString()
    @IsOptional()
    description?: string;

    @IsString()
    @IsOptional()
    slug?: string;

    @IsInt()
    @IsPositive()
    @IsOptional()
    stock?: number;


    @IsString({ each: true }) // La validacion each: true, hacer que cada uno debe ser obligatoriamente un string
    @IsArray()
    sizes: string[];

    @IsIn(['men', 'women', 'kid', 'unisex']) // Esta validacion me dice que solamente permitire que vengan esos valores en el array
    gender: string;

    @IsString({ each: true }) // La validacion each: true, hacer que cada uno debe ser obligatoriamente un string
    @IsArray()
    @IsOptional()
    tags: string[];
    
    @IsString({ each: true }) // La validacion each: true, hacer que cada uno debe ser obligatoriamente un string
    @IsArray()
    @IsOptional()
    images: string[];
}
