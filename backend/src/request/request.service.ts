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
      `SELECT Mitigation_Requests.*, Users.Name AS Processed_By FROM Mitigation_Requests
      LEFT JOIN Staffs ON Mitigation_Requests.Processed_Staff_ID = Staffs.Staff_ID
      LEFT JOIN Users ON Staffs.User_ID = Users.User_ID
      WHERE Submitted_Student_ID = (SELECT Student_ID FROM Students WHERE User_ID = ?) ORDER BY Submit_DT DESC`,
      [user.User_ID]
    );
    return requests;
  }

  async getAllMitigationRequests(user: any) {
    const requests = await this.dataSource.query(
      `SELECT Mitigation_Requests.*, Users.Name AS Submitted_By FROM Mitigation_Requests
      JOIN Students ON Mitigation_Requests.Submitted_Student_ID = Students.Student_ID
      JOIN Users ON Students.User_ID = Users.User_ID
      ORDER BY Submit_DT DESC `
      
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
      `SELECT Credit_Overload_Requests.*, Users.Name AS Submitted_By FROM Credit_Overload_Requests
      LEFT JOIN Staffs ON Credit_Overload_Requests.Processed_Staff_ID = Staffs.Staff_ID
      LEFT JOIN Users ON Staffs.User_ID = Users.User_ID
      WHERE Submitted_Student_ID = (SELECT Student_ID FROM Students WHERE User_ID = ?) ORDER BY Submit_DT DESC`,
      [user.User_ID]
    );
    return requests;
  }


  async getAllOverloadRequests(user: any) {
    const requests = await this.dataSource.query(
      `SELECT Credit_Overload_Requests.*, Users.Name AS Submitted_By FROM Credit_Overload_Requests
      LEFT JOIN Students ON Credit_Overload_Requests.Submitted_Student_ID = Students.Student_ID
      LEFT JOIN Users ON Students.User_ID = Users.User_ID
      ORDER BY Submit_DT DESC`,
    );
    return requests;
  }

  async processMitigationRequest(user:any, requestId: number, status: string) {
    const request = await this.dataSource.query(
      `SELECT * FROM Mitigation_Requests WHERE Request_ID = ?`,
      [requestId]
    );

    if (request.length === 0) {
      return { success: false, message: 'Mitigation request not found.' };
    }
    let staffID=await this.dataSource.query(`Select * from Staffs WHERE Staffs.User_ID=?`, [user.User_ID]);
    staffID=staffID[0].Staff_ID;

    if (status === 'APPROVED') {
      await this.dataSource.query(
        `UPDATE Mitigation_Requests SET Status = 'APPROVED', Processed_Staff_ID = ?,Process_DT = CURRENT_TIMESTAMP WHERE Request_ID = ?`,
        [staffID, requestId]
      );
    } else {
      await this.dataSource.query(
        `UPDATE Mitigation_Requests SET Status = 'REJECTED', Processed_Staff_ID = ?,Process_DT = CURRENT_TIMESTAMP WHERE Request_ID = ?`,
        [staffID, requestId]
      );
    }

    return { success: true, message: `Mitigation request ${status.toLowerCase()}d successfully.` };
  }

  
  async processOverloadRequest(user:any, requestId: number, status: string) {
    const request = await this.dataSource.query(
      `SELECT * FROM Credit_Overload_Requests WHERE Request_ID = ?`,
      [requestId]
    );

    if (request.length === 0) {
      return { success: false, message: 'Overload request not found.' };
    }
    let staffID=await this.dataSource.query(`Select * from Staffs WHERE Staffs.User_ID=?`, [user.User_ID]);
    staffID=staffID[0].Staff_ID;

    if (status === 'APPROVED') {
      await this.dataSource.query(
        `UPDATE Credit_Overload_Requests SET Status = 'APPROVED', Processed_Staff_ID = ?,Process_DT = CURRENT_TIMESTAMP WHERE Request_ID = ?`,
        [staffID, requestId]
      );
    } else {
      await this.dataSource.query(
        `UPDATE Credit_Overload_Requests SET Status = 'REJECTED', Processed_Staff_ID = ?,Process_DT = CURRENT_TIMESTAMP WHERE Request_ID = ?`,
        [staffID, requestId]
      );
    }

    return { success: true, message: `Overload request ${status.toLowerCase()}d successfully.` };
  }

  async getIsApprovedOverload(user:any){
    let student=await this.dataSource.query(`SELECT Student_ID FROM Students WHERE User_ID = ?`, [user.User_ID]);
    if(student.length===0){
      return { success: false, message: 'Student not found for the given user.' };
    }
    let isApproved=await this.dataSource.query(`SELECT * FROM Credit_Overload_Requests WHERE Submitted_Student_ID = ? AND Status = 'APPROVED'`, [student[0].Student_ID]);

    return isApproved.length > 0 ;
  }
}