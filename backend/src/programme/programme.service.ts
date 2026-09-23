import { Injectable, OnModuleInit } from '@nestjs/common';
import { DataSource, QueryRunner } from 'typeorm';

@Injectable()
export class ProgrammeService {
  constructor(private dataSource: DataSource) { }

async getAllProgrammeWithIncludedCourses() {
  const result = await this.dataSource.query(`
    SELECT 
      p.Programme_Code,
      p.Title,
      p.Credits_Required,
      p.Status,
      p.DID,
      maj.Normative_Duration_Years,
      maj.Max_Duration_Years,
      maj.Degree_Awarded,
      CASE 
        WHEN maj.Programme_Code IS NOT NULL THEN (
          SELECT COALESCE(json_group_array(mpc.Course_Code), '[]')
          FROM Major_Programmes_Courses mpc
          WHERE mpc.Programme_Code = p.Programme_Code
        )
        WHEN min.Programme_Code IS NOT NULL THEN (
          SELECT COALESCE(json_group_array(minpc.Course_Code), '[]')
          FROM Minor_Programmes_Courses minpc
          WHERE minpc.Programme_Code = p.Programme_Code
        )
        ELSE json_array()
      END AS Courses_Coverage
    FROM Programmes p
    LEFT JOIN Major_Programmes maj ON p.Programme_Code = maj.Programme_Code
    LEFT JOIN Minor_Programmes min ON p.Programme_Code = min.Programme_Code
  `);

  // Parse JSON strings if your SQLite driver returns Courses_Coverage as a string
  return result.map((row: any) => ({
    ...row,
    Courses_Coverage: typeof row.Courses_Coverage === 'string' 
      ? JSON.parse(row.Courses_Coverage) 
      : row.Courses_Coverage
  }));
}

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

async updateProgramme(
  user: any,
  programmeData: {
    code: string;
    creditsRequired: number;
    degreeAwarded?: string;
    normativeDurationYears?: number;
    maxDurationYears?: number;
    offeringDepartment: string;
    title: string;
    status: string;
    coursesCoverage?: string[];
  }
): Promise<{ success: boolean; error?: any }> {
  const {
    code,
    creditsRequired,
    degreeAwarded,
    normativeDurationYears,
    maxDurationYears,
    offeringDepartment,
    title,
    status,
    coursesCoverage=[]
  } = programmeData;

  const queryRunner: QueryRunner = this.dataSource.createQueryRunner();
  await queryRunner.connect();
  await queryRunner.startTransaction();

  try {
    // 1. Check if it is a Major Programme
    const majorCheck = await queryRunner.query(
      `SELECT 1 FROM Major_Programmes WHERE Programme_Code = ? LIMIT 1`,
      [code]
    );
    const isUpdatingMajor = majorCheck.length > 0;

    // 2. Update base Programme table (Fixed typo: Staus -> Status)
    const updateResult = await queryRunner.query(
      `UPDATE Programmes SET Title = ?, Credits_Required = ?, Status = ?, DID = ? WHERE Programme_Code = ?`,
      [title, creditsRequired, status, offeringDepartment, code]
    );

    if (updateResult.affectedRows === 0) {
      await queryRunner.rollbackTransaction();
      return { success: false, error: 'Programme not found' };
    }

    // 3. Update Major Programme details if applicable
    if (isUpdatingMajor) {
      const updateMajorResult = await queryRunner.query(
        `UPDATE Major_Programmes SET Degree_Awarded = ?, Normative_Duration_Years = ?, Max_Duration_Years = ? WHERE Programme_Code = ?`,
        [degreeAwarded, normativeDurationYears, maxDurationYears, code]
      );

      if (updateMajorResult.affectedRows === 0) {
        await queryRunner.rollbackTransaction();
        return { success: false, error: 'Major Programme entry not found' };
      }
    }

    // 4. Update Course Associations
    const coursesTable = isUpdatingMajor ? 'Major_Programmes_Courses' : 'Minor_Programmes_Courses';

    await queryRunner.query(
      `DELETE FROM ${coursesTable} WHERE Programme_Code = ?`,
      [code]
    );

    if (coursesCoverage.length > 0) {
      // Bulk insert for better performance
      const values = coursesCoverage.map(() => '(?, ?)').join(', ');
      const params = coursesCoverage.flatMap(courseCode => [code, courseCode]);

      await queryRunner.query(
        `INSERT INTO ${coursesTable} (Programme_Code, Course_Code) VALUES ${values}`,
        [params]
      );
    }

    await queryRunner.commitTransaction();
    return { success: true };
  } catch (error: any) {
    await queryRunner.rollbackTransaction();
    return { success: false, error: error?.message || error };
  } finally {
    await queryRunner.release();
  }
}
}