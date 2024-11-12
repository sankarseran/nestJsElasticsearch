import { IsString, IsInt, Min, IsNotEmpty } from 'class-validator';

export class Person {
    @IsString()
    @IsNotEmpty()
    fName: string;

    @IsString()
    @IsNotEmpty()
    lName: string;

    @IsString()
    dateOfBirth: string;

    @IsInt()
    @Min(0)
    countOfOwnedCars: number;
}
