import { Injectable, OnModuleInit } from '@nestjs/common';
import { DataSource } from 'typeorm';

@Injectable()
export class ProgrammeService {
  constructor(private dataSource: DataSource) { }

  async getAllMajorProgramme() {
    let query = `SELECT 
    p.Programme_Code,
    p.Title,
    p.Credits_Required,
    p.Status,
    p.DID,
    mp.Normative_Duration_Years,
    mp.Max_Duration_Years,
    mp.Degree_Awarded
    FROM Major_Programmes mp
    INNER JOIN Programmes p 
    ON mp.Programme_Code = p.Programme_Code
    WHERE p.Status = 'Active'
    ;`;
    return await this.dataSource.query(query);
  }
  async getAllMinorProgramme() {
    let query = `SELECT 
    p.Programme_Code,
    p.Title,
    p.Credits_Required,
    p.Status,
    p.DID
    FROM Minor_Programmes mp
    INNER JOIN Programmes p 
    ON mp.Programme_Code = p.Programme_Code
    WHERE p.Status = 'Active'
    ;`;
    return await this.dataSource.query(query);
  }


}