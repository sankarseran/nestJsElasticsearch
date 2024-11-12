import { BadRequestException, Injectable } from '@nestjs/common';
import { ElasticsearchService } from '@nestjs/elasticsearch';
import { Person } from './person.entity';

@Injectable()
export class PersonService {
  constructor(private readonly elasticsearchService: ElasticsearchService) {}

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
      index: 'people',
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
        index: 'people',
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
      index: 'people',
      id: personId,
      doc: { countOfOwnedCars: newCount },
    });

    return result;
  }
}
