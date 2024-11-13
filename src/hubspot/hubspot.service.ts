import { HttpException, HttpStatus, Injectable, Logger } from '@nestjs/common';
import axios from 'axios';
import { CreateHubSpotContactDto } from 'src/person/person.entity';

@Injectable()
export class HubSpotService {
  private readonly logger = new Logger(HubSpotService.name);
  private readonly apiKey = process.env.HUBSPOT_API_KEY;
  private readonly baseUrl = 'https://api.hubapi.com';

  async fetchHubSpotContacts(vidOffset?: number) {
    const url = `${this.baseUrl}/contacts/v1/lists/all/contacts/all`;

    const params: any = {
      count: 100,
      property: ['firstname', 'lastname', 'email', 'date_of_birth'],
    };

    if (vidOffset) {
      params.vidOffset = vidOffset;
    }

    return axios.get(url, {
      params,
      headers: {
        Authorization: `Bearer ${this.apiKey}`,
        'Content-Type': 'application/json',
      },
    });
  }

  async createHubSpotContact(createHubSpotContactDto: CreateHubSpotContactDto) {
    const { fName, lName, email, dateOfBirth } = createHubSpotContactDto;
    const url = `${this.baseUrl}/crm/v3/objects/contacts`;

    const data = {
      properties: {
        firstname: fName,
        lastname: lName,
        email,
        date_of_birth: dateOfBirth,
      },
    };

    try {
      const response = await axios.post(url, data, {
        headers: {
          Authorization: `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json',
        },
      });
      return response.data;
    } catch (error) {
      console.log('Error creating contact in HubSpot', error.message);
      throw new HttpException(
        'Failed to create contact in HubSpot',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }
}
