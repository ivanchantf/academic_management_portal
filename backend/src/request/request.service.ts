import { Injectable, OnModuleInit } from '@nestjs/common';
import { DataSource } from 'typeorm';

@Injectable()
export class RequestService {
  constructor(private dataSource: DataSource) { }


  async submitMitigationRequest(user: any, assessmentDate: string, reason: string, courseCode: string, supportingDocumentPath?: string) {

    let student = await this.dataSource.query(`SELECT Student_ID FROM Students WHERE User_ID = ?`, [user.User_ID]);
    if (student.length === 0) {
      throw new Error('Student not found for the given user.');
    }
    const studentId = student[0].Student_ID;

    let existingRequest = await this.dataSource.query(
      `SELECT * FROM Mitigation_Requests WHERE Submitted_Student_ID = ? AND Affecting_Course_Code = ? AND Date_Of_Assessment = ?`,
      [studentId, courseCode, assessmentDate]
    );

    if (existingRequest.length > 0) {
      return { success: false, message: 'You already have a mitigation request for this course at this date.' };
    }

    let query = `INSERT INTO  Mitigation_Requests  (Date_Of_Assessment,Reason,Affecting_Course_Code,Submit_DT,Submitted_Student_ID,File_Path) VALUES (?, ?, ?, CURRENT_DATE, ?, ?)`;
    await this.dataSource.query(query, [assessmentDate, reason, courseCode, studentId, supportingDocumentPath ? supportingDocumentPath : null]);
    return { success: true, message: 'Mitigation request submitted successfully.' };

  }
  async getMyMitigationRequests(user: any) {
    const requests = await this.dataSource.query(
      `SELECT * FROM Mitigation_Requests WHERE Submitted_Student_ID = (SELECT Student_ID FROM Students WHERE User_ID = ?)`,
      [user.User_ID]
    );
    return requests;
  }



  async submitOverloadRequest(user: any, reason: string, supportingDocumentPath?: string) {
    try {
      let student = await this.dataSource.query(`SELECT Student_ID FROM Students WHERE User_ID = ?`, [user.User_ID]);
      if (student.length === 0) {
        return { success: false, message: 'Student not found for the given user.' };
        //throw new Error('Student not found for the given user.');
      }
      const studentId = student[0].Student_ID;

      let existingRequest = await this.dataSource.query(
        `SELECT * FROM Credit_Overload_Requests WHERE Submitted_Student_ID = ? AND Status = 'PENDING'`,
        [studentId]
      );

      if (existingRequest.length > 0) {
        return { success: false, message: 'You already have a pending overload request.' };
      }

      let query = `INSERT INTO  Credit_Overload_Requests  (Reason,Submit_DT,Submitted_Student_ID,File_Path) VALUES (?, CURRENT_DATE, ?, ?)`;
      await this.dataSource.query(query, [reason, studentId, supportingDocumentPath ? supportingDocumentPath : null]);
    }
    catch (error: any) {
      console.error('Error submitting overload request:', error);
      return { success: false, message: 'Failed to submit overload request: ' + error.message };
    }

    return { success: true, message: 'Overload request submitted successfully.' };

  }
  async getMyOverloadRequests(user: any) {
    const requests = await this.dataSource.query(
      `SELECT * FROM Credit_Overload_Requests WHERE Submitted_Student_ID = (SELECT Student_ID FROM Students WHERE User_ID = ?)`,
      [user.User_ID]
    );
    return requests;
  }





}