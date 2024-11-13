import { IsString, IsInt, Min, IsNotEmpty, IsDateString } from 'class-validator';

export class Person {
    @IsString()
    @IsNotEmpty()
    fName: string;

    @IsString()
    @IsNotEmpty()
    lName: string;

    @IsDateString()
    dateOfBirth: string;

    @IsInt()
    @Min(0)
    countOfOwnedCars: number;
}
