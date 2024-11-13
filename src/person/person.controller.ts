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
  HttpException,
  HttpStatus,
} from '@nestjs/common';
import { PersonService } from './person.service';
import { CreateHubSpotContactDto, Person } from './person.entity';
import { HubSpotService } from '../hubspot/hubspot.service';

@Controller('person')
export class PersonController {
  constructor(private readonly personService: PersonService, private readonly hubSpotService: HubSpotService) {}

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
        throw new BadRequestException(error.message);
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
        throw new BadRequestException(error.message);
      }
      throw new InternalServerErrorException('Failed to update car count');
    }
  }

  @Post('sync-contacts')
  async syncHubSpotContacts() {
    try {
      await this.personService.syncHubSpotContacts();
      return { message: 'HubSpot contacts synced successfully' };
    } catch (error) {
      console.error('Error updating car count:', error);
      throw new InternalServerErrorException('Failed to sync contacts with HubSpot');
    }
  }

  @Post('create-contact')
  @UsePipes(new ValidationPipe())
  async createHubSpotContact(@Body() createHubSpotContactDto: CreateHubSpotContactDto) {
    try {
      const contact = await this.hubSpotService.createHubSpotContact(createHubSpotContactDto);
      return { message: 'Contact created successfully', contact };
    } catch (error) {
      throw new HttpException('Failed to create contact', HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }
}
