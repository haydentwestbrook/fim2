import { Module } from '@nestjs/common';
import { FoundryService } from './foundry.service';
import { FoundryController } from './foundry.controller';
import { LoggerModule } from '../common/logger/logger.module';

@Module({
  imports: [LoggerModule],
  providers: [FoundryService],
  controllers: [FoundryController],
})
export class FoundryModule {}
