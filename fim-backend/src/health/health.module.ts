import { Module } from '@nestjs/common';
import { TerminusModule } from '@nestjs/terminus';
import { HealthController } from './health.controller';
import { HealthService } from './health.service';
import { PrismaModule } from '../prisma/prisma.module';
import { LoggerModule } from '../common/logger/logger.module'; // Import LoggerModule

@Module({
  imports: [TerminusModule, PrismaModule, LoggerModule], // Add LoggerModule
  controllers: [HealthController],
  providers: [HealthService],
})
export class HealthModule {}