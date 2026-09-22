import { Injectable, OnModuleInit } from '@nestjs/common';
import { DataSource } from 'typeorm';

@Injectable()
export class DepartmentService {
  constructor(private dataSource: DataSource) { }

  async checkDepartment(did: string) {
    // Example implementation - replace with actual logic
    let dept= await this.dataSource.query(`Select * from Departments WHERE Departments.DID=?`, [did]);


    return dept.length > 0 ? dept[0] : null;
  }



}