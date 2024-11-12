import { Module } from '@nestjs/common';
import { ElasticsearchModule } from '@nestjs/elasticsearch';
import { ElasticsearchConfigService } from '../config/elasticsearch.config';
import { PersonService } from './person.service';
import { PersonController } from './person.controller';

@Module({
  imports: [
    ElasticsearchModule.registerAsync({
      useClass: ElasticsearchConfigService,
    }),
  ],
  providers: [PersonService],
  controllers: [PersonController],
})
export class PersonModule {}
