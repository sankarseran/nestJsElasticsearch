import {
  IsString,
  IsInt,
  Min,
  IsNotEmpty,
  IsDateString,
  IsEmail,
} from 'class-validator';

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

export class CreateHubSpotContactDto {
  @IsString()
  fName: string;

  @IsString()
  lName: string;

  @IsEmail()
  email: string;

  @IsDateString()
  dateOfBirth: string;
}
