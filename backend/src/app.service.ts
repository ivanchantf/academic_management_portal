import { Injectable, OnModuleInit } from '@nestjs/common';
import { DataSource } from 'typeorm';

@Injectable()
export class AppService implements OnModuleInit {
  constructor(private dataSource: DataSource) {}

  // Verify connection when the module starts
  async onModuleInit() {
    if (this.dataSource.isInitialized) {
      console.log('✅ DataSource connected to db successfully!');
      let a= await this.dataSource.query( `SELECT name FROM sqlite_master WHERE type='table' AND name NOT LIKE 'sqlite_%';`);
      console.log(a);
    }
  }

  // Execute raw SQL
  async test() {
    return await this.dataSource.query(`SELECT name FROM sqlite_master WHERE type='table' AND name NOT LIKE 'sqlite_%';`);
  }
}