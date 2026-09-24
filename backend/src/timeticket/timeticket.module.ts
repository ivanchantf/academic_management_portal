import { Module } from '@nestjs/common';

import {   TimeticketService} from './timeticket.service.js';
import { TypeOrmModule } from '@nestjs/typeorm';
import { fileURLToPath } from 'url';
import { dirname, resolve } from 'path';
import { AuthModule } from '../auth/auth.module.js';
import { JwtService } from '@nestjs/jwt';
import { TimeticketController } from './timeticket.controller.js';
// Recreate __dirname for ES Module scope
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
@Module({
  imports: [
TypeOrmModule.forRoot({
      type: 'better-sqlite3', 
      database: resolve(__dirname, '../../pjDB.db'),
      logging: true,
    }),
    AuthModule,
  ],
  controllers: [TimeticketController],
  providers: [TimeticketService,JwtService],
})
export class TimeticketModule {}
