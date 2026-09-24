import { Injectable, OnModuleInit } from '@nestjs/common';
import { DataSource } from 'typeorm';

@Injectable()
export class RequestService {
  constructor(private dataSource: DataSource) { }


  async submitMitigationRequest(user:any,     assessmentDate: string, reason: string, courseCode: string, supportingDocumentPath: string) {

  let student=await this.dataSource.query(`SELECT Student_ID FROM Students WHERE User_ID = ?`, [user.User_ID]);
  if(student.length===0){
    throw new Error('Student not found for the given user.');
  }
  const studentId = student[0].Student_ID;

  let query = `INSERT INTO  Mitigation_Requests  (Date_Of_Assessment,Reason,Affecting_Course_Code,Submit_DT,Submitted_Student_ID,File_Path) VALUES (?, ?, ?, CURRENT_DATE, ?, ?)`;
  await this.dataSource.query(query, [assessmentDate, reason, courseCode, studentId, supportingDocumentPath]);
  return {success: true, message: 'Mitigation request submitted successfully.' };

}
  async getMyMitigationRequests(user: any) {
    const requests = await this.dataSource.query(
      `SELECT * FROM Mitigation_Requests WHERE Submitted_Student_ID = (SELECT Student_ID FROM Students WHERE User_ID = ?)`,
      [user.User_ID]
    );
    return requests;
  }

}