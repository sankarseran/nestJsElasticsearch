import {
  BadRequestException,
  HttpException,
  HttpStatus,
  Injectable,
} from '@nestjs/common';
import { ElasticsearchService } from '@nestjs/elasticsearch';
import { Person } from './person.entity';
import { HubSpotService } from '../hubspot/hubspot.service';
import { Cron } from '@nestjs/schedule';

@Injectable()
export class PersonService {
  private readonly index = 'people';

  constructor(
    private readonly elasticsearchService: ElasticsearchService,
    private readonly hubSpotService: HubSpotService,
  ) {}

  async createPerson(person: Person): Promise<any> {
    const dateOfBirthString = person.dateOfBirth;
    const dateOfBirth = new Date(dateOfBirthString);

    if (isNaN(dateOfBirth.getTime())) {
      throw new BadRequestException('Invalid date format');
    }

    const today = new Date();
    if (dateOfBirth > today) {
      throw new BadRequestException('dateOfBirth cannot be in the future');
    }

    const result = await this.elasticsearchService.index({
      index: this.index,
      document: {
        fName: person.fName,
        lName: person.lName,
        dateOfBirth: person.dateOfBirth,
        countOfOwnedCars: person.countOfOwnedCars,
      },
    });
    return result;
  }

  async searchPerson(filters: {
    fName?: string;
    lName?: string;
    age?: number;
    minCars?: number;
  }) {
    const { fName, lName, age, minCars } = filters;

    let query: any = { bool: { must: [] } };

    if (fName) {
      query.bool.must.push({
        match: { fName },
      });
    }

    if (lName) {
      query.bool.must.push({
        match: { lName },
      });
    }

    if (age) {
      const now = new Date();
      const year = now.getFullYear() - age;
      const dateStart = `${year}-01-01`;
      const dateEnd = `${year}-12-31`;

      query.bool.must.push({
        range: {
          dateOfBirth: {
            gte: dateStart,
            lte: dateEnd,
          },
        },
      });
    }

    if (minCars) {
      query.bool.must.push({
        range: {
          countOfOwnedCars: { gte: minCars },
        },
      });
    }

    try {
      const { hits } = await this.elasticsearchService.search({
        index: this.index,
        body: {
          query,
        },
      });
      return hits.hits;
    } catch (error) {
      throw error;
    }
  }

  async updateCarCount(personId: string, newCount: number): Promise<any> {
    if (typeof newCount !== 'number' || isNaN(newCount)) {
      throw new BadRequestException('countOfOwnedCars must be a valid number');
    }
    const result = await this.elasticsearchService.update({
      index: this.index,
      id: personId,
      doc: { countOfOwnedCars: newCount },
    });

    return result;
  }

  async updateElasticsearchPerson(id: string, person: Person) {
    await this.elasticsearchService.update({
      index: this.index,
      id,
      doc: person,
    });
  }

  private getContactEmail(contact: any): string | undefined {
    const emailIdentity = contact['identity-profiles']
      ?.flatMap((profile) => profile.identities)
      .find((identity) => identity.type === 'EMAIL');

    return emailIdentity?.value;
  }
  // for 60 seconds -> '*/60 * * * * *'
  @Cron('0 */5 * * *') // Every 5 minutes
  async handleScheduledSync() {
    console.log('Running HubSpot sync job every 60 seconds...');
    await this.syncHubSpotContacts();
  }

  async syncHubSpotContacts() {
    let hasMore = true;
    let vidOffset: number | undefined = undefined;

    try {
      while (hasMore) {
        const { data } =
          await this.hubSpotService.fetchHubSpotContacts(vidOffset);

        for (const contact of data?.contacts) {
          const { properties } = contact;
          const fName = properties.firstname?.value;
          const lName = properties.lastname?.value;
          const email = this.getContactEmail(contact);
          const dateOfBirth = properties.date_of_birth?.value;

          const existingPerson = await this.searchPerson({ fName, lName });

          if (existingPerson.length) {
            await this.elasticsearchService.update({
              index: this.index,
              id: existingPerson[0]._id,
              doc: { fName, lName, email, dateOfBirth },
            });
          } else {
            await this.elasticsearchService.index({
              index: this.index,
              document: {
                fName,
                lName,
                email,
                dateOfBirth,
                countOfOwnedCars: 0,
              },
            });
          }
        }

        hasMore = data['has-more'];
        vidOffset = data['vid-offset'];
      }
    } catch (error) {
      console.log('Error syncing contacts with HubSpot', error);
      throw new HttpException(
        'Failed to sync contacts with HubSpot',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }
}
