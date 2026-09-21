import { Module } from '@nestjs/common';

import { TypeOrmModule } from '@nestjs/typeorm';
import { fileURLToPath } from 'url';
import { dirname, resolve } from 'path';
import { AuthService } from './auth.service.js';
import { AuthController } from './auth.controller.js';
import { JwtService } from '@nestjs/jwt';
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
  ],
  controllers: [AuthController],
  providers: [AuthService, JwtService],
})
export class AuthModule {}
