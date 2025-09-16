import { Module } from '@nestjs/common';
import { FoundryService } from './foundry.service';
import { FoundryController } from './foundry.controller';
import { LoggerModule } from '../common/logger/logger.module';
import { PrismaModule } from '../prisma/prisma.module';

@Module({
  imports: [LoggerModule, PrismaModule],
  providers: [FoundryService],
  controllers: [FoundryController],
})
export class FoundryModule {}
