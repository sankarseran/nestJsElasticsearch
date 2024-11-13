import { Injectable, Logger } from '@nestjs/common';
import axios from 'axios';

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
}
