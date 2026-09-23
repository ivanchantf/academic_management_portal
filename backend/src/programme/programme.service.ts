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

async createProgramme(user: any, programmeData: any): Promise<{ success: boolean; error?: any }> {
  let {
    code,
    creditRequire,
    degreeAwarded,
    normativeDurationYears,
    maxDurationYears,
    offeringDepartment,
    title,
    programmeType
  } = programmeData;

  const queryRunner = this.dataSource.createQueryRunner();

  await queryRunner.connect();
  await queryRunner.startTransaction();

  try {
    // 1. Insert into base Programmes table
    await queryRunner.query(
      `INSERT INTO Programmes (Programme_Code, Title, Credits_Required, Status, DID) VALUES (?, ?, ?, 'ACTIVE', ?)`,
      [code, title, creditRequire, offeringDepartment]
    );

    // 2. Insert into subtype table based on programmeType
    if (programmeType === 'Major') {
      await queryRunner.query(
        `INSERT INTO Major_Programmes (Programme_Code, Normative_Duration_Years, Max_Duration_Years, Degree_Awarded) VALUES (?, ?, ?, ?)`,
        [code, normativeDurationYears, maxDurationYears, degreeAwarded]
      );
    } else if (programmeType === 'Minor') {
      await queryRunner.query(
        `INSERT INTO  Minor_Programmes (Programme_Code) VALUES (?)`,
        [code]
      );
    }

    // Commit transaction if all queries succeed
    await queryRunner.commitTransaction();
    return { success: true };
  } catch (err) {
    // Roll back changes if any query fails
    await queryRunner.rollbackTransaction();
    return { success: false, error: err };
  } finally {
    // Release the query runner connection back to the pool
    await queryRunner.release();
  }
}

}