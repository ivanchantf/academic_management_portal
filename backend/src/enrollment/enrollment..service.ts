import { Injectable, OnModuleInit } from '@nestjs/common';
import { asyncScheduler } from 'rxjs';
import { DataSource } from 'typeorm';

@Injectable()
export class EnrollmentService {

  constructor(private dataSource: DataSource) { }

  async getStudentNotEnrollMajor() {
   let query = `SELECT 
    s.Student_ID,
    u.Name,
    u.Email,
    u.HKID
FROM Students s
JOIN Users u ON s.User_ID = u.User_ID
WHERE NOT EXISTS (
    SELECT 1 
    FROM Programme_Major_Enrollments pe
    JOIN Major_Programmes mp ON pe.Programme_Code = mp.Programme_Code
    WHERE pe.Student_ID = s.Student_ID AND pe.Status = 'ENROLLED'
);`
    return await this.dataSource.query(query);
  }


  async assignMajor(studentId: string, majorId: string) {
    let query = `INSERT INTO Programme_Major_Enrollments (Student_ID, Programme_Code,Enroll_DT) VALUES (?, ?, CURRENT_DATE);`;
    return await this.dataSource.query(query, [studentId, majorId]);
  }
  async assignMinor(studentId: string, minorId: string) {
    //if no major enrollment, then cannot enroll in minor
    let query1=`SELECT * FROM Programme_Major_Enrollments WHERE Student_ID=? AND Status='ENROLLED';`;
    let result= await this.dataSource.query(query1,[studentId]);
    if (result.length === 0) {
      return null; // Student has no major enrollment
    }
    let query2 = `INSERT INTO Programme_Minor_Enrollments (Student_ID, Programme_Code,Enroll_DT) VALUES (?, ?, CURRENT_DATE);`;
    return await this.dataSource.query(query2, [studentId, minorId]);
  }


  async getStudentNotEnrollMinor() {
   let query = `SELECT 
    s.Student_ID,
    u.Name,
    u.Email,
    u.HKID
FROM Students s
JOIN Users u ON s.User_ID = u.User_ID
WHERE NOT EXISTS (
    SELECT 1 
    FROM Programme_Minor_Enrollments pe
    JOIN Minor_Programmes mp ON pe.Programme_Code = mp.Programme_Code
    WHERE pe.Student_ID = s.Student_ID AND pe.Status = 'ENROLLED'
);`
    return await this.dataSource.query(query);
  }


async getStudentsByProgramme(programmeCode: string) {
  let query = `
    SELECT Student_ID FROM Programme_Major_Enrollments WHERE Programme_Code = ?
    UNION
    SELECT Student_ID FROM Programme_Minor_Enrollments WHERE Programme_Code = ?
  `;

  return await this.dataSource.query(query, [programmeCode, programmeCode]);
}
}