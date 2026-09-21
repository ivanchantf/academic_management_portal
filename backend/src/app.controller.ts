import { Controller, Get } from '@nestjs/common';

import { AppService } from './app.service.js';

@Controller('test-db')
export class AppController {
  constructor(private  appService:AppService) {}

  @Get()
  async testDatabase() {
    try {
      // Execute a native SQLite query to list all user tables
      const tables = await this.appService.test()

      return {
        status: 'success',
        message: 'Successfully connected to SQLite database!',
        tablesCount: tables.length,
        tables: tables.map((t: { name: string }) => t.name),
      };
    } catch (error) {
      return {
        status: 'error',
        message: 'Failed to query database',
        error: error instanceof Error ? error.message : String(error),
      };
    }
  }
}