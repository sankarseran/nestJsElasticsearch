import { Test, TestingModule } from '@nestjs/testing';
import { ElasticsearchService } from '@nestjs/elasticsearch';
import { PersonService } from './person.service';
import { Person } from './person.entity';
import {
  WriteResponseBase,
  SearchResponse,
  SearchTotalHitsRelation,
} from '@elastic/elasticsearch/lib/api/types';
import { HubSpotService } from '../hubspot/hubspot.service';

const mockIndexResponse: WriteResponseBase = {
  _id: '1',
  _index: 'people',
  _primary_term: 1,
  _seq_no: 1,
  _shards: {
    successful: 1,
    failed: 0,
    total: 1,
  },
  _version: 1,
  result: 'created',
};

const mockSearchResponse: SearchResponse = {
  took: 1,
  timed_out: false,
  _shards: {
    total: 1,
    successful: 1,
    skipped: 0,
    failed: 0,
  },
  hits: {
    total: {
      value: 1,
      relation: 'eq' as SearchTotalHitsRelation,
    },
    max_score: 1.0,
    hits: [
      {
        _index: 'people',
        _id: '1',
        _score: 1.0,
        _source: {
          fName: 'John',
          lName: 'Doe',
        },
      },
    ],
  },
};

describe('PersonService', () => {
  let service: PersonService;
  let elasticsearchService: ElasticsearchService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        PersonService,
        HubSpotService,
        {
          provide: ElasticsearchService,
          useValue: {
            index: jest.fn(),
            search: jest.fn(),
            update: jest.fn(),
          },
        },
      ],
    }).compile();

    service = module.get<PersonService>(PersonService);
    elasticsearchService =
      module.get<ElasticsearchService>(ElasticsearchService);
  });

  describe('createPerson', () => {
    it('should create a person document in Elasticsearch', async () => {
      const person: Person = {
        fName: 'John',
        lName: 'Doe',
        dateOfBirth: '1990-01-01',
        countOfOwnedCars: 2,
      };

      jest
        .spyOn(elasticsearchService, 'index')
        .mockResolvedValue(mockIndexResponse);

      const result = await service.createPerson(person);
      expect(result).toEqual(mockIndexResponse);
      expect(elasticsearchService.index).toHaveBeenCalledWith({
        index: 'people',
        document: {
          fName: 'John',
          lName: 'Doe',
          dateOfBirth: '1990-01-01',
          countOfOwnedCars: 2,
        },
      });
    });
  });

  describe('searchPersonByFName', () => {
    it('should search for persons by first name', async () => {
      const fName = 'John';
      jest
        .spyOn(elasticsearchService, 'search')
        .mockResolvedValue(mockSearchResponse);

      const result = await service.searchPerson({ fName });
      expect(result).toEqual(mockSearchResponse.hits.hits);
      expect(elasticsearchService.search).toHaveBeenCalledWith({
        index: 'people',
        body: {
          query: {
            bool: {
              must: [
                {
                  match: {
                    fName
                  },
                },
              ],
            },
          },
        },
      });
    });
  });

  describe('searchPersonByLName', () => {
    it('should search for persons by last name', async () => {
      const lName = 'Doe';
      jest
        .spyOn(elasticsearchService, 'search')
        .mockResolvedValue(mockSearchResponse);

      const result = await service.searchPerson({ lName });
      expect(result).toEqual(mockSearchResponse.hits.hits);
      expect(elasticsearchService.search).toHaveBeenCalledWith({
        index: 'people',
        body: {
          query: {
            bool: {
              must: [
                {
                  match: {
                    lName
                  },
                },
              ],
            },
          },
        },
      });
    });
  });

  describe('searchPersonByAge', () => {
    it('should search for persons by age', async () => {
      const age = 30;
      const year = new Date().getFullYear() - age;
      const dateStart = `${year}-01-01`;
      const dateEnd = `${year}-12-31`;

      jest
        .spyOn(elasticsearchService, 'search')
        .mockResolvedValue(mockSearchResponse);

      const result = await service.searchPerson({ age });
      expect(result).toEqual(mockSearchResponse.hits.hits);
      expect(elasticsearchService.search).toHaveBeenCalledWith({
        body: {
          query: {
            bool: {
              must: [
                {
                  range: {
                    dateOfBirth: {
                      gte: dateStart,
                      lte: dateEnd,
                    },
                  },
                },
              ],
            },
          },
        },
        index: 'people',
      });
    });
  });

  describe('searchByCarCount', () => {
    it('should search for persons by minimum car count', async () => {
      const minCars = 1;
      jest
        .spyOn(elasticsearchService, 'search')
        .mockResolvedValue(mockSearchResponse);

      const result = await service.searchPerson({ minCars });
      expect(result).toEqual(mockSearchResponse.hits.hits);
      expect(elasticsearchService.search).toHaveBeenCalledWith({
        index: 'people',
        body: {
          query: {
            bool: {
              must: [
                {
                  range: {
                    countOfOwnedCars: { gte: minCars },
                  },
                },
              ],
            },
          },
        },
      });
    });
  });

  describe('updateCarCount', () => {
    it('should update the car count for a person by ID', async () => {
      const personId = '123';
      const newCount = 4;
      const mockUpdateResponse: WriteResponseBase = {
        _id: personId,
        _index: 'people',
        _primary_term: 1,
        _seq_no: 1,
        _shards: {
          successful: 1,
          failed: 0,
          total: 1,
        },
        _version: 2,
        result: 'updated',
      };

      jest
        .spyOn(elasticsearchService, 'update')
        .mockResolvedValue(mockUpdateResponse);

      await service.updateCarCount(personId, newCount);
      expect(elasticsearchService.update).toHaveBeenCalledWith({
        index: 'people',
        id: personId,
        doc: { countOfOwnedCars: newCount },
      });
    });
  });
});
