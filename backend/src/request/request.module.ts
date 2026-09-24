import { Module } from '@nestjs/common';

import {  RequestService} from './request.service.js';
import { TypeOrmModule } from '@nestjs/typeorm';
import { fileURLToPath } from 'url';
import { dirname, resolve } from 'path';
import { AuthModule } from '../auth/auth.module.js';
import { JwtService } from '@nestjs/jwt';
import {  RequestController } from './request.controller.js';
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
  ],controllers: [RequestController],
  providers: [RequestService,JwtService],
})
export class RequestModule {}
