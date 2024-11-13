import { Module } from '@nestjs/common';
import { ElasticsearchModule } from '@nestjs/elasticsearch';
import { ElasticsearchConfigService } from '../config/elasticsearch.config';
import { PersonService } from './person.service';
import { PersonController } from './person.controller';
import { HubSpotService } from '../hubspot/hubspot.service';
import { ScheduleModule } from '@nestjs/schedule';

@Module({
  imports: [
    ElasticsearchModule.registerAsync({
      useClass: ElasticsearchConfigService,
    }),
    ScheduleModule.forRoot(),
  ],
  providers: [PersonService, HubSpotService],
  controllers: [PersonController],
})
export class PersonModule {}
