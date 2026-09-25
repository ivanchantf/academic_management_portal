import { Module } from '@nestjs/common';
import { AppController } from './app.controller.js';
import { AppService } from './app.service.js';
import { TypeOrmModule } from '@nestjs/typeorm';
import { fileURLToPath } from 'url';
import { dirname, resolve } from 'path';
import { AuthModule } from './auth/auth.module.js';
import { ProfileModule } from './profile/profile.module.js';
import { ServeStaticModule } from '@nestjs/serve-static';
import { DepartmentModule } from './department/department.module.js';
import { EnrollmentModule } from './enrollment/enrollment.module.js';
import { join } from 'path';
import { ProgrammeModule } from './programme/programme.module.js';
import { CourseModule } from './course/course.module.js';
import { TimeticketModule } from './timeticket/timeticket.module.js';
import { RequestModule } from './request/request.module.js';
import { StaffModule } from './staff/staff.module.js';
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
  ServeStaticModule.forRoot({
    rootPath: resolve(__dirname, '../uploads'),
    serveRoot: '/api/uploads',
    serveStaticOptions: {
      fallthrough: false,
      index: false,
    },
  }),
    AuthModule,
    ProfileModule,
    DepartmentModule,
    EnrollmentModule,
    ProgrammeModule,
    CourseModule,
    TimeticketModule,
    RequestModule,
    StaffModule
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
