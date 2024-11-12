import { ElasticsearchModuleOptions, ElasticsearchOptionsFactory } from '@nestjs/elasticsearch';
import { Injectable } from '@nestjs/common';
import * as dotenv from 'dotenv';

dotenv.config();

@Injectable()
export class ElasticsearchConfigService implements ElasticsearchOptionsFactory {
    createElasticsearchOptions(): ElasticsearchModuleOptions {
        return {
            node: process.env.ELASTICSEARCH_NODE,
            auth: {
                apiKey: process.env.ELASTICSEARCH_APIKEY,
            },
            tls: {
                rejectUnauthorized: false,
            },
        };
    }
}
