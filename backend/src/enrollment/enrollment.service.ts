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

async getMyEnrolledCourse(user:any){
  let query = `SELECT * From Students WHERE User_ID = ?`;
  let student = await this.dataSource.query(query, [user.User_ID]);
  let myStudentID = student[0].Student_ID;
  let query2 = `SELECT * From Course_Enrollments 
  JOIN Courses ON Course_Enrollments.Course_Code = Courses.Course_Code
  WHERE Student_ID = ?`;
  let myEnrolledCourses = await this.dataSource.query(query2, [myStudentID]);
  return myEnrolledCourses;
}

async getMyEnrolledProgrammes(user: any) {
  let query = `SELECT Student_ID FROM Students WHERE User_ID = ?`;
  let student = await this.dataSource.query(query, [user.User_ID]);

  // Return null if no student profile exists for this user
  if (!student || student.length === 0) {
    return null;
  }

  let myStudentID = student[0].Student_ID;

  let query2 = `
    SELECT 
      Programme_Major_Enrollments.Programme_Code AS Programme_Code,
      Programmes.Title,
      Programmes.Credits_Required,
      Major_Programmes.Normative_Duration_Years,
      Major_Programmes.Max_Duration_Years,
      Major_Programmes.Degree_Awarded,
      'Major' AS Programme_Type
    FROM Programme_Major_Enrollments
    JOIN Programmes ON Programme_Major_Enrollments.Programme_Code = Programmes.Programme_Code
    JOIN Major_Programmes ON Programme_Major_Enrollments.Programme_Code = Major_Programmes.Programme_Code
    WHERE Student_ID = ?

    UNION ALL

    SELECT 
      Programme_Minor_Enrollments.Programme_Code AS Programme_Code,
      Programmes.Title,
      Programmes.Credits_Required,
      NULL AS Normative_Duration_Years,
      NULL AS Max_Duration_Years,
      NULL AS Degree_Awarded,
      'Minor' AS Programme_Type
    FROM Programme_Minor_Enrollments 
    JOIN Programmes ON Programme_Minor_Enrollments.Programme_Code = Programmes.Programme_Code
    JOIN Minor_Programmes ON Programme_Minor_Enrollments.Programme_Code = Minor_Programmes.Programme_Code
    WHERE Student_ID = ?
  `;

  let myEnrolledCourses = await this.dataSource.query(query2, [myStudentID, myStudentID]);

  // Return null if no major or minor programmes were found
  return myEnrolledCourses.length > 0 ? myEnrolledCourses : null;
}

async enrollCourses(user: any, registeredCourses: string[], deregisteredCourses: string[]) {

  let studentID=await this.dataSource.query(`SELECT Student_ID FROM Students WHERE User_ID = ?`, [user.User_ID]);
  if (!studentID || studentID.length === 0) {
    return { success: false, message: 'Student profile not found' };
  }

  const myStudentID = studentID[0].Student_ID;

  let timetickets=await this.dataSource.query(`SELECT * FROM Time_Tickets WHERE Holder_Student_ID = ? 
    AND From_DT<=CURRENT_TIMESTAMP and To_DT>=CURRENT_TIMESTAMP`, [myStudentID]);
    
  if (!timetickets || timetickets.length === 0) {
    return { success: false, message: 'No active time tickets found' };
  }

  const enrollQuery = `INSERT INTO Course_Enrollments (Student_ID, Course_Code, Enroll_DT) VALUES (?, ?, CURRENT_DATE)`;
  const deregisterQuery = `DELETE FROM Course_Enrollments WHERE Student_ID = ? AND Course_Code = ?`;

  const enrollPromises = registeredCourses.map(courseCode => this.dataSource.query(enrollQuery, [myStudentID, courseCode]));
  const deregisterPromises = deregisteredCourses.map(courseCode => this.dataSource.query(deregisterQuery, [myStudentID, courseCode]));

  await Promise.all([...enrollPromises, ...deregisterPromises]);
  return { success: true, message: 'Courses enrolled successfully' };

}
}