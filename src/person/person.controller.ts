import {
  Controller,
  Post,
  Body,
  UsePipes,
  ValidationPipe,
  Get,
  Query,
  Put,
  InternalServerErrorException,
  BadRequestException,
} from '@nestjs/common';
import { PersonService } from './person.service';
import { Person } from './person.entity';

@Controller('person')
export class PersonController {
  constructor(private readonly personService: PersonService) {}

  @Post()
  @UsePipes(new ValidationPipe())
  async createPerson(@Body() person: Person) {
    try {
      const result = await this.personService.createPerson(person);
      return { message: 'Person created successfully', result };
    } catch (error) {
      console.error('Error creating person:', error);
      if (error instanceof BadRequestException) {
        throw error;
      }
      throw new InternalServerErrorException('Failed to create person');
    }
  }

  @Get('search')
  async searchPerson(
    @Query('fName') fName?: string,
    @Query('lName') lName?: string,
    @Query('age') age?: number,
    @Query('minCars') minCars?: number,
  ) {
    try {
      if (!fName && !lName && !age && !minCars) {
        throw new BadRequestException(
          'At least one search criterion (fName, lName, age, or minCars) must be provided',
        );
      }

      if (age && (isNaN(age) || age < 0)) {
        throw new BadRequestException('Invalid age');
      }

      const result = await this.personService.searchPerson({
        fName,
        lName,
        age,
        minCars,
      });
      return { message: 'Search results', result };
    } catch (error) {
      console.error('Error searching:', error);
      if (error instanceof BadRequestException) {
        throw error;
      }
      throw new InternalServerErrorException('Error occurred during search');
    }
  }

  @Put()
  async updateCarCount(
    @Query('personId') personId: string,
    @Query('newCount') newCount: number,
  ) {
    try {
      const result = await this.personService.updateCarCount(personId, Number(newCount));
      return { message: 'Car count updated successfully', result };
    } catch (error) {
      console.error('Error updating car count:', error);
      if (error instanceof BadRequestException) {
        throw error;
      }
      throw new InternalServerErrorException('Failed to update car count');
    }
  }
}
