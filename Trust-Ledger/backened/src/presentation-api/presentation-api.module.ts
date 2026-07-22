import { Module } from '@nestjs/common';
import { PresentationApiController } from './presentation-api.controller';
import { PresentationApiService } from './presentation-api.service';
import { PresentationDataService } from './presentation-data.service';

@Module({
  controllers: [PresentationApiController],
  providers: [PresentationApiService, PresentationDataService],
})
export class PresentationApiModule {}
