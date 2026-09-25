import { Module } from '@nestjs/common';

import { TypeOrmModule } from '@nestjs/typeorm';
import { fileURLToPath } from 'url';
import { dirname, resolve } from 'path';
import { AuthModule } from '../auth/auth.module.js';
import { JwtService } from '@nestjs/jwt';
import {  EnrollmentController } from './enrollment.controller.js';
import { EnrollmentService } from './enrollment.service.js';
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
  controllers: [EnrollmentController],
  providers: [EnrollmentService, JwtService],
})
export class EnrollmentModule {}
